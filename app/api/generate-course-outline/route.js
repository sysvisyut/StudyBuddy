import { NextResponse } from "next/server";
import { courseOutlineAIModel } from "@/configs/AiModel";
import { db } from "@/configs/db";
import { STUDY_MATERIAL_TABLE } from "@/configs/schema";
import { inngest } from "@/inngest/client";

export async function POST(req) {
    try {
        const { courseId, topic, courseType, difficultyLevel, createdBy } = await req.json();

        const prompt = `Create a study material for ${topic} with ${difficultyLevel} difficulty level for ${courseType} course, with summary of course, List of chapters along with summary and emoji for each chapter,topic list in each chapter in complete json format `;

        // Generate course layout using AI
        const aiResp = await courseOutlineAIModel.generateContent(prompt);
        const aiResult = JSON.parse(aiResp.response.text());

        // Insert into DB and return the full inserted row
        const dbResult = await db.insert(STUDY_MATERIAL_TABLE).values({
            courseId: courseId,
            courseType: courseType,
            topic: topic,
            difficultyLevel: difficultyLevel,
            courseLayout: aiResult,
            createdBy: createdBy
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
        console.log("DB Inserted:", insertedCourse);

        // Trigger Inngest background job with the actual inserted course row
        const inngestResult = await inngest.send({
            name: 'notes.generate',
            data: {
                course: insertedCourse
            }
        });
        console.log("Inngest triggered:", inngestResult);

        return NextResponse.json({ result: insertedCourse });
    } catch (error) {
        console.error("Error in generate-course-outline:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}