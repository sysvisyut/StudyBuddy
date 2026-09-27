import { inngest } from "./client";
import { db } from "@/configs/db";
import { STUDY_MATERIAL_TABLE, CHAPTER_NOTES_TABLE } from "@/configs/schema";
import { generateNotesAiModel } from "@/configs/AiModel";
import { eq, and } from "drizzle-orm";

export const helloWorld = inngest.createFunction(
    { id: "hello-world", name: "Hello World" },
    { event: "test/hello.world" },
    async ({ event, step }) => {
        await step.sleep("wait-a-moment", "1s");
        return { message: `Hello ${event.data.email}!` };
    },
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

                    // Idempotency guard: check if chapter notes already exist before inserting
                    const existing = await db.select().from(CHAPTER_NOTES_TABLE)
                        .where(and(
                            eq(CHAPTER_NOTES_TABLE.courseId, course.courseId),
                            eq(CHAPTER_NOTES_TABLE.chapterId, index)
                        ));

                    if (existing.length === 0) {
                        await db.insert(CHAPTER_NOTES_TABLE).values({
                            chapterId: index,
                            courseId: course.courseId,
                            notes: aiResp,
                        });
                        successCount++;
                        console.log(`Chapter ${index} generated and saved successfully.`);
                    } else {
                        console.log(`Chapter ${index} already exists, skipping insert.`);
                        successCount++;
                    }
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
