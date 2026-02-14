import { inngest } from "./client";
import { db } from "@/db";
import { USER_TABLE } from "@/db/schema";
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
        const result = await step.run('Check user and create new if not in DB', async () => {
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