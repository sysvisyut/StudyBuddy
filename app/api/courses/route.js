import { db } from "@/configs/db";
import { STUDY_MATERIAL_TABLE, CHAPTER_NOTES_TABLE } from "@/configs/schema";
import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function DELETE(req) {
    try {
        const { searchParams } = new URL(req.url);
        const courseId = searchParams.get('courseId');

        if (!courseId) {
            return NextResponse.json({ error: "Missing courseId" }, { status: 400 });
        }

        // Delete all chapter notes for this course first (foreign key safety)
        await db.delete(CHAPTER_NOTES_TABLE)
            .where(eq(CHAPTER_NOTES_TABLE.courseId, courseId));

        // Delete the course itself
        const deleted = await db.delete(STUDY_MATERIAL_TABLE)
            .where(eq(STUDY_MATERIAL_TABLE.courseId, courseId))
            .returning({ courseId: STUDY_MATERIAL_TABLE.courseId });

        if (!deleted.length) {
            return NextResponse.json({ error: "Course not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, courseId });
    } catch (error) {
        console.error("[Delete Course] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}


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

export async function GET(req){
    const reqUrl = req.url;
    const{searchParams} = new URL(reqUrl);
    const courseId = searchParams?.get('courseId');

    const course = await db.select().from(STUDY_MATERIAL_TABLE).where(eq(STUDY_MATERIAL_TABLE?.courseId,courseId));

    return NextResponse.json({result:course[0]})
}