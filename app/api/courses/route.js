import { db } from "@/configs/db";
import { STUDY_MATERIAL_TABLE, CHAPTER_NOTES_TABLE } from "@/configs/schema";
import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireCourseOwnership, getAuthEmail } from "@/lib/auth";

export async function DELETE(req) {
    try {
        const { searchParams } = new URL(req.url);
        const courseId = searchParams.get('courseId');

        if (!courseId) {
            return NextResponse.json({ error: "Missing courseId" }, { status: 400 });
        }

        const { errorResponse } = await requireCourseOwnership(courseId);
        if (errorResponse) return errorResponse;

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


export async function POST(_req) {
    const userEmail = await getAuthEmail();
    if (!userEmail) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await db.select().from(STUDY_MATERIAL_TABLE)
        .where(eq(STUDY_MATERIAL_TABLE.createdBy, userEmail))
        .orderBy(desc(STUDY_MATERIAL_TABLE.id));

    return NextResponse.json({ result });
}

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');

    const { errorResponse, course } = await requireCourseOwnership(courseId);
    if (errorResponse) return errorResponse;

    return NextResponse.json({ result: course });
}