import { db } from "@/configs/db";
import { CHAPTER_NOTES_TABLE, STUDY_TYPE_CONTENT_TABLE } from "@/configs/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(req) {
    const { courseId, studyType } = await req.json();

    if (!courseId || !studyType) {
        return NextResponse.json({ error: "Missing courseId or studyType" }, { status: 400 });
    }

    if (studyType === 'ALL') {
        const notes = await db.select().from(CHAPTER_NOTES_TABLE)
            .where(eq(CHAPTER_NOTES_TABLE.courseId, courseId));

        const contentList = await db.select().from(STUDY_TYPE_CONTENT_TABLE)
            .where(eq(STUDY_TYPE_CONTENT_TABLE.courseId, courseId))

        const result = {
            notes: notes,
            flashcard: contentList?.filter((item)=>item.type==='flashcard'),
            quiz: null,
            qa: null
        };

        return NextResponse.json(result);
    }
    else if (studyType === 'NOTES') {
        const notes = await db.select().from(CHAPTER_NOTES_TABLE)
            .where(eq(CHAPTER_NOTES_TABLE.courseId, courseId));

        return NextResponse.json(notes);
    }

    else{
         const result = await db.select().from(STUDY_TYPE_CONTENT_TABLE)
            .where(and(eq(STUDY_TYPE_CONTENT_TABLE?.courseId, courseId),
            eq(STUDY_TYPE_CONTENT_TABLE?.type,studyType)));

        return NextResponse.json(result[0] ?? null);
    }
}
