import { NextResponse } from "next/server";
import { courseOutlineAIModel } from "@/configs/AiModel";
import { db } from "@/configs/db";
import { STUDY_MATERIAL_TABLE } from "@/configs/schema";
import { inngest } from "@/inngest/client";



import { validate as uuidValidate } from 'uuid';

export async function POST(req) {
    try {
        let body;
        try {
            body = await req.json();
        } catch (_e) {
            return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
        }

        const { courseId, topic, courseType, difficultyLevel, createdBy } = body;

        if (!courseId || typeof courseId !== 'string' || !uuidValidate(courseId)) {
            return NextResponse.json({ error: "Valid courseId is required" }, { status: 400 });
        }

        if (!topic || typeof topic !== 'string' || topic.trim() === '') {
            return NextResponse.json({ error: "Topic is required" }, { status: 400 });
        }
        if (topic.length > 300) {
            return NextResponse.json({ error: "Topic must be under 300 characters" }, { status: 400 });
        }

        const emailRegex = /^\S+@\S+\.\S+$/;
        if (!createdBy || typeof createdBy !== 'string' || !emailRegex.test(createdBy)) {
            return NextResponse.json({ error: "Valid createdBy email is required" }, { status: 400 });
        }

        const allowedCourseTypes = ['Exam', 'Job Interview', 'Practice', 'Coding Prep', 'Others', 'Standard'];
        if (!courseType || !allowedCourseTypes.includes(courseType)) {
            return NextResponse.json({ error: "Invalid courseType" }, { status: 400 });
        }

        const allowedDifficulties = ['Easy', 'Medium', 'Hard'];
        if (!difficultyLevel || !allowedDifficulties.includes(difficultyLevel)) {
            return NextResponse.json({ error: "Invalid difficultyLevel" }, { status: 400 });
        }

        // Sanitize topic to mitigate prompt injection risk (strip < > { } | \)
        const sanitizedTopic = topic.replace(/[<>{}|\\]/g, '').trim();

        const prompt = `Create a study material for ${sanitizedTopic} with ${difficultyLevel} difficulty level for ${courseType} course, with summary of course, List of chapters along with summary and emoji for each chapter, topic list in each chapter in complete json format`;

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

        // 3. Trigger notes generation via Inngest durable event
        try {
            await inngest.send({ 
                name: 'notes.generate', 
                data: { course: insertedCourse } 
            });
            console.log(`[Outline] Sent notes.generate event for courseId=${insertedCourse.courseId}`);
        } catch (err) {
            // Log loudly but still return success since the outline saved.
            // Notes generation is deferred/failed but course exists.
            console.error('[Notes] Failed to send Inngest event:', err.message);
        }

        return NextResponse.json({ result: insertedCourse });
    } catch (error) {
        console.error('[Outline] Error:', error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}