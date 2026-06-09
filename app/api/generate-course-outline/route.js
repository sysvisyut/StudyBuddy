import { NextResponse } from "next/server";
import { courseOutlineAIModel, generateNotesAiModel } from "@/configs/AiModel";
import { db } from "@/configs/db";
import { STUDY_MATERIAL_TABLE, CHAPTER_NOTES_TABLE } from "@/configs/schema";
import { eq } from "drizzle-orm";

/**
 * Generates chapter notes in the background after responding to the client.
 * Runs fully async — does not block the HTTP response.
 */
async function generateNotesInBackground(insertedCourse) {
    const { courseId, courseLayout } = insertedCourse;
    const chapters = courseLayout?.chapters;

    if (!chapters || chapters.length === 0) {
        console.warn(`[Notes] No chapters found for courseId=${courseId}`);
        return;
    }

    console.log(`[Notes] Starting background generation for courseId=${courseId} (${chapters.length} chapters)`);
    let successCount = 0;

    for (let index = 0; index < chapters.length; index++) {
        const chapter = chapters[index];
        try {
            const PROMPT = `Generate exam material detail content for each chapter, make sure to include all topic points in the content, make sure to give content in HTML format (Do not add HTML, head, body, title tag). The chapter: ${JSON.stringify(chapter)}`;

            const result = await generateNotesAiModel.sendMessage(PROMPT);
            const aiResp = result.response.text();

            if (!aiResp || aiResp.trim() === '') {
                console.warn(`[Notes] Chapter ${index}: AI returned empty response, skipping.`);
                continue;
            }

            await db.insert(CHAPTER_NOTES_TABLE).values({
                chapterId: index,
                courseId: courseId,
                notes: aiResp,
            });

            successCount++;
            console.log(`[Notes] Chapter ${index} saved. (${successCount}/${chapters.length})`);
        } catch (err) {
            console.error(`[Notes] Chapter ${index} failed:`, err.message);
        }
    }

    // Update course status to Ready
    try {
        await db.update(STUDY_MATERIAL_TABLE)
            .set({ status: 'Ready' })
            .where(eq(STUDY_MATERIAL_TABLE.courseId, courseId));
        console.log(`[Notes] courseId=${courseId} marked Ready. (${successCount}/${chapters.length} chapters)`);
    } catch (err) {
        console.error(`[Notes] Failed to update status for courseId=${courseId}:`, err.message);
    }
}

export async function POST(req) {
    try {
        const { courseId, topic, courseType, difficultyLevel, createdBy } = await req.json();

        const prompt = `Create a study material for ${topic} with ${difficultyLevel} difficulty level for ${courseType} course, with summary of course, List of chapters along with summary and emoji for each chapter, topic list in each chapter in complete json format`;

        // 1. Generate course outline via AI
        const aiResp = await courseOutlineAIModel.generateContent(prompt);
        const aiResult = JSON.parse(aiResp.response.text());

        // 2. Insert course into DB
        const dbResult = await db.insert(STUDY_MATERIAL_TABLE).values({
            courseId,
            courseType,
            topic,
            difficultyLevel,
            courseLayout: aiResult,
            createdBy,
        }).returning({
            id: STUDY_MATERIAL_TABLE.id,
            courseId: STUDY_MATERIAL_TABLE.courseId,
            courseType: STUDY_MATERIAL_TABLE.courseType,
            topic: STUDY_MATERIAL_TABLE.topic,
            difficultyLevel: STUDY_MATERIAL_TABLE.difficultyLevel,
            courseLayout: STUDY_MATERIAL_TABLE.courseLayout,
            createdBy: STUDY_MATERIAL_TABLE.createdBy,
            status: STUDY_MATERIAL_TABLE.status,
        });

        const insertedCourse = dbResult[0];
        console.log(`[Outline] Course inserted: courseId=${insertedCourse.courseId}`);

        // 3. Fire-and-forget: generate chapter notes in the background
        //    Response returns immediately; notes are generated async.
        generateNotesInBackground(insertedCourse).catch((err) => {
            console.error('[Notes] Unhandled error in background generation:', err.message);
        });

        return NextResponse.json({ result: insertedCourse });
    } catch (error) {
        console.error('[Outline] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}