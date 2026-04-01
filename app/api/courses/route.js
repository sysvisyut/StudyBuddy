import { db } from "@/configs/db";
import { STUDY_MATERIAL_TABLE } from "@/configs/schema";
import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";


export async function POST(req) { // export makes the fn available outside the file
    
    const {createdBy} = await req.json();

    if (!createdBy) {
        return NextResponse.json({ error: "Missing createdBy parameter" }, { status: 400 });
    }

    const result = await db.select().from(STUDY_MATERIAL_TABLE)
    .where(eq(STUDY_MATERIAL_TABLE.createdBy,createdBy))
    .orderBy(desc(STUDY_MATERIAL_TABLE.id));

    return NextResponse.json({result: result});
}