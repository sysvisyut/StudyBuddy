import { NextResponse } from "next/server";
import { db } from "@/configs/db";
import { USER_TABLE } from "@/configs/schema";
import { eq } from "drizzle-orm";

export async function POST(req) {
    try {
        let body;
        try {
            body = await req.json();
        } catch (_e) {
            return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
        }

        const { user } = body;
        const email = user?.primaryEmailAddress?.emailAddress;
        
        if (!email || typeof email !== 'string' || email.trim() === '') {
            return NextResponse.json({ error: "User email address is missing or invalid" }, { status: 400 });
        }
        
        const name = user?.fullName ?? '';

        // Atomic upsert: try to insert, do nothing if conflict on email
        const userResp = await db.insert(USER_TABLE).values({
            name,
            email,
        })
        .onConflictDoNothing({ target: USER_TABLE.email })
        .returning();

        if (userResp.length === 0) {
            // Conflict occurred, the user already exists. Fetch the existing row.
            const existingUser = await db.select().from(USER_TABLE)
                .where(eq(USER_TABLE.email, email));
            return NextResponse.json({ result: existingUser[0] });
        }

        return NextResponse.json({ result: userResp[0] });
    } catch (error) {
        console.error("Error in create-user API:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
