import { db } from "@/configs/db";
import { STUDY_TYPE_CONTENT_TABLE } from "@/configs/schema";
import { eq } from "drizzle-orm";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);

export async function POST(req) {
    const { chapters, courseId, type } = await req.json();

    if (!courseId || !type || !chapters) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const PROMPT = `Generate 12 flashcards on the topic: "${chapters}".
Return ONLY a valid JSON array in this exact format, with no markdown, no explanation:
[
  { "front": "Question here", "back": "Answer here" }
]`;

    // 1. Insert a placeholder row with status 'Generating'
    const inserted = await db.insert(STUDY_TYPE_CONTENT_TABLE).values({
        courseId: courseId,
        type: type,
        content: [],
        status: 'Generating'
    }).returning({ id: STUDY_TYPE_CONTENT_TABLE.id });

    const recordId = inserted[0].id;

    // 2. Call Gemini AI directly (no Inngest background job)
    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.7,
                maxOutputTokens: 4096,
            }
        });

        const result = await model.generateContent(PROMPT);
        const rawText = result.response.text();

        // Strip any markdown fences just in case
        const cleaned = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

        let parsedContent;
        try {
            parsedContent = JSON.parse(cleaned);
            // Unwrap if nested like { "flashcards": [...] }
            if (!Array.isArray(parsedContent)) {
                const firstKey = Object.keys(parsedContent)[0];
                parsedContent = Array.isArray(parsedContent[firstKey]) ? parsedContent[firstKey] : [];
            }
        } catch (e) {
            console.error("AI JSON parse error:", cleaned);
            return NextResponse.json({ error: "AI returned invalid JSON" }, { status: 500 });
        }

        // 3. Update the DB row with the content and mark as Ready
        await db.update(STUDY_TYPE_CONTENT_TABLE).set({
            content: parsedContent,
            status: 'Ready'
        }).where(eq(STUDY_TYPE_CONTENT_TABLE.id, recordId));

        return NextResponse.json({ id: recordId, content: parsedContent, status: 'Ready' });

    } catch (err) {
        console.error("Gemini generation error:", err);
        // Mark as Failed so the UI doesn't get stuck on Generating
        await db.update(STUDY_TYPE_CONTENT_TABLE).set({ status: 'Failed' })
            .where(eq(STUDY_TYPE_CONTENT_TABLE.id, recordId));

        return NextResponse.json({ error: "AI generation failed: " + err.message }, { status: 500 });
    }
}