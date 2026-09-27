import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/configs/db";
import { STUDY_MATERIAL_TABLE } from "@/configs/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function getAuthEmail() {
    const user = await currentUser();
    return user?.primaryEmailAddress?.emailAddress;
}

export async function requireCourseOwnership(courseId) {
    const userEmail = await getAuthEmail();
    
    if (!userEmail) {
        return { errorResponse: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
    }

    if (!courseId) {
        return { errorResponse: NextResponse.json({ error: "Missing courseId" }, { status: 400 }) };
    }

    const course = await db.select().from(STUDY_MATERIAL_TABLE)
        .where(eq(STUDY_MATERIAL_TABLE.courseId, courseId));

    if (!course || course.length === 0) {
        return { errorResponse: NextResponse.json({ error: "Not found" }, { status: 404 }) };
    }

    if (course[0].createdBy !== userEmail) {
        console.error(`[Auth] User ${userEmail} attempted unauthorized access to course ${courseId}`);
        return { errorResponse: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
    }

    return { course: course[0], userEmail };
}
