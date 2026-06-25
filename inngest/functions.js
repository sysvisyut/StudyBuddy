import { inngest } from "./client";
import { db } from "@/configs/db";
import { USER_TABLE, STUDY_MATERIAL_TABLE, CHAPTER_NOTES_TABLE, STUDY_TYPE_CONTENT_TABLE } from "@/configs/schema";
import { generateNotesAiModel, generateStudyTypeContentAiModel } from "@/configs/AiModel";
import { eq } from "drizzle-orm";

export const helloWorld = inngest.createFunction(
    { id: "hello-world", name: "Hello World" },
    { event: "test/hello.world" },
    async ({ event, step }) => {
        await step.sleep("wait-a-moment", "1s");
        return { message: `Hello ${event.data.email}!` };
    },
);

export const CreateNewUser = inngest.createFunction(
    { id: 'create-user', name: 'Create User' },
    { event: 'user.created' },
    async ({ event, step }) => {
        const { user } = event.data;
        await step.run('Check user and create new if not in DB', async () => {
            const result = await db.select().from(USER_TABLE)
                .where(eq(USER_TABLE.email, user?.primaryEmailAddress?.emailAddress));
            console.log(result);

            if (result?.length == 0) {
                const userResp = await db.insert(USER_TABLE).values({
                    name: user?.fullName,
                    email: user?.primaryEmailAddress?.emailAddress,
                }).returning({ id: USER_TABLE.id });
                return userResp;
            }
            return result;
        });

        return 'Success';
    }
);

export const GenerateNotes = inngest.createFunction(
    { id: 'generate-notes', name: 'Generate Notes' },
    { event: 'notes.generate' },
    async ({ event, step }) => {
        const { course } = event.data;

        if (!course?.courseId) {
            console.error('GenerateNotes: Missing courseId in event data', event.data);
            throw new Error('Missing courseId — cannot generate notes');
        }

        const chapters = course?.courseLayout?.chapters;

        if (!chapters || chapters.length === 0) {
            console.error('GenerateNotes: No chapters found in courseLayout', course?.courseLayout);
            throw new Error('No chapters found in courseLayout');
        }

        console.log(`GenerateNotes: Starting for courseId=${course.courseId}, ${chapters.length} chapters`);

        // Generate notes for each chapter individually (one step per chapter for resilience)
        await step.run('Generate Chapter Notes', async () => {
            let successCount = 0;

            for (let index = 0; index < chapters.length; index++) {
                const chapter = chapters[index];
                try {
                    const PROMPT = `Generate exam material detail content for each chapter, make sure to include all topic point in the content, make sure to give content in HTML format (Do not add HTML, head, body, title tag). The chapter: ${JSON.stringify(chapter)}`;

                    const result = await generateNotesAiModel.sendMessage(PROMPT);
                    const aiResp = result.response.text();

                    if (!aiResp || aiResp.trim() === '') {
                        console.warn(`Chapter ${index}: AI returned empty response, skipping insert.`);
                        continue;
                    }

                    await db.insert(CHAPTER_NOTES_TABLE).values({
                        chapterId: index,
                        courseId: course.courseId,
                        notes: aiResp,
                    });

                    successCount++;
                    console.log(`Chapter ${index} generated and saved successfully.`);
                } catch (err) {
                    console.error(`Chapter ${index} generation failed:`, err.message);
                    // Continue to next chapter instead of aborting the whole job
                }
            }

            console.log(`GenerateNotes: ${successCount}/${chapters.length} chapters generated.`);
            return `Completed: ${successCount}/${chapters.length}`;
        });

        // Update course status to Ready regardless (partial notes are better than none)
        await step.run('Update Course Status to Ready', async () => {
            await db.update(STUDY_MATERIAL_TABLE).set({
                status: 'Ready'
            }).where(eq(STUDY_MATERIAL_TABLE.courseId, course.courseId));
            console.log(`Course ${course.courseId} status updated to Ready.`);
            return 'Success';
        });

        return 'Success';
    }
);

// used to generate flashcards
export const GenerateStudyTypeContent = inngest.createFunction(
    { id: 'generate-study-type-content', name: 'Generate Study Type Content' },
    {event:'studyType.content'},

    async({event,step})=>{
        const {studyType,prompt,courseId,recordId} = event.data;

        const FlashcardAiResult = await step.run('Generating Flashcard using AI',async()=>{
            const result = await generateStudyTypeContentAiModel.sendMessage(prompt);
            const aiResp = JSON.parse(result.response.text());
            
            return aiResp
        })

        const dbResult = await step.run('Save Result to DB', async()=>{
            const result = await db.update(STUDY_TYPE_CONTENT_TABLE).set({
                content:FlashcardAiResult,
                status:'Ready'
            }).where(eq(STUDY_TYPE_CONTENT_TABLE.id,recordId))
           
            

            return 'Data Inserted'
        })

        return 'Success'
    }
)