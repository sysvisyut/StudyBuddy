import { inngest } from "./client";
import { db } from "@/configs/db";
import { USER_TABLE, STUDY_MATERIAL_TABLE, CHAPTER_NOTES_TABLE } from "@/configs/schema";
import { generateNotesAiModel } from "@/configs/AiModel";
import { eq } from "drizzle-orm";

export const helloWorld = inngest.createFunction(
    { id: "hello-world" },
    { event: "test/hello.world" },
    async ({ event, step }) => {
        await step.sleep("wait-a-moment", "1s");
        return { message: `Hello ${event.data.email}!` };
    },
);

export const CreateNewUser = inngest.createFunction(
    { id: 'create-user' },
    { event: 'user.created' },
    async ({ event, step }) => {
        // get event data
        const {user} = event.data; 
        await step.run('Check user and create new if not in DB', async () => {
            const result = await db.select().from(USER_TABLE)
                .where(eq(USER_TABLE.email, user?.primaryEmailAddress?.emailAddress))
            console.log(result);

            if (result?.length == 0) {
                const userResp = await db.insert(USER_TABLE).values({
                    name: user?.fullName,
                    email: user?.primaryEmailAddress?.emailAddress,
                }).returning({ id: USER_TABLE.id })
                return userResp;
            }
            return result;
        })

        return 'Success';
    }
    // send email notification to the user
)

export const GenerateNotes = inngest.createFunction(
    {id: 'generate-notes'},
    {event:'notes.generate'},
    async({event,step})=>{
        const {course} = event.data; // all the record are stored here

        //generate notes for each chapter
        await step.run('Generate Chapter Notes',async()=>{
            const Chapters = course?.courseLayout?.chapters;
            let index = 0;
            for (const chapter of Chapters) {
                const PROMPT = 'Generate exam material detail content for each chapter, make sure to include all topic point in the content, make sure to give content in HTML format(Do not add HTMLKL,head, body,title tag), the chapters :'+JSON.stringify(chapter);
                const result = await generateNotesAiModel.sendMessage(PROMPT);
                const aiResp = result.response.text();

                await db.insert(CHAPTER_NOTES_TABLE).values({
                    chapterId: index,
                    courseId: course?.courseId,
                    notes: aiResp,
                });
                index = index + 1;
            }
            return 'Completed';
        })

        //update course status to ready
        await step.run('Update Course Status to Ready',async()=>{
            await db.update(STUDY_MATERIAL_TABLE).set({
                status: 'Ready'
            }).where(eq(STUDY_MATERIAL_TABLE.courseId, course?.courseId));
            return 'Success';
        });

        return 'Success';
    }
)