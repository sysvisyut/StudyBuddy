import { NextResponse } from "next/server";
import { courseOutlineAIModel } from "@/configs/AiModel";
import { db } from "@/configs/db";
import { STUDY_MATERIAL_TABLE } from "@/configs/schema";
import { inngest } from "@/inngest/client";

export async function POST(req) {
    try {
        const { courseId, topic, courseType, difficultyLevel, createdBy } = await req.json();

        const prompt = `Create a study material for ${topic} with ${difficultyLevel} difficulty level for ${courseType} course, with summary of course, List of chapters along with summary for each chapter,topic list in each chapter in complete json format `;
        //genate course layout using AI
        const aiResp = await courseOutlineAIModel.generateContent(prompt);
        const aiResult = JSON.parse(aiResp.response.text());

        const dbResult = await db.insert(STUDY_MATERIAL_TABLE).values({
            courseId: courseId,
            courseType: courseType,
            topic: topic,
            difficultyLevel: difficultyLevel,
            courseLayout: aiResult,
            createdBy: createdBy
        }).returning({ resp: STUDY_MATERIAL_TABLE});

        //save the result along with user Input
        const result =  await inngest.send({
            name:'notes.generate',
            data:{
                course:dbResult[0].resp
            }
        });
        console.log(result);
        console.log("DB Inserted:", dbResult);
        return NextResponse.json({ result: dbResult[0] });
    } catch (error) {
        console.error("Error in generate-course-outline:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

}