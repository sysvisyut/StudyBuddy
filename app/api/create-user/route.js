import { NextResponse } from "next/server";
import { db } from "@/configs/db";
import { USER_TABLE } from "@/configs/schema";
import { eq } from "drizzle-orm";

export async function POST(req) {
    try {
        const { user } = await req.json();

        // Check if user already exists
        const result = await db.select().from(USER_TABLE)
            .where(eq(USER_TABLE.email, user?.primaryEmailAddress?.emailAddress));

        if (result?.length === 0) {
            // If not, insert new user
            const userResp = await db.insert(USER_TABLE).values({
                name: user?.fullName,
                email: user?.primaryEmailAddress?.emailAddress,
            }).returning({ id: USER_TABLE.id });

            return NextResponse.json({ result: userResp[0] });
        }

        return NextResponse.json({ result: result[0] });
    } catch (error) {
        console.error("Error in create-user API:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
