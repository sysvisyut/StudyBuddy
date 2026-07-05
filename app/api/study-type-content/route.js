import { db } from "@/configs/db";
import { STUDY_TYPE_CONTENT_TABLE } from "@/configs/schema";
import { eq, and } from "drizzle-orm";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import {
    normalizeType,
    extractJsonArray,
    validateStudyContent,
} from "@/lib/studyContent";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);

// ── Prompts ───────────────────────────────────────────────────────────────────

function buildFlashcardPrompt(topic) {
    return `You are an expert educator. Generate 12 concise, educational flashcards for the topic: "${topic}".

Return ONLY a valid JSON array. No markdown fences, no explanation text, no surrounding prose.

Schema (strict):
[
  { "front": "Short question or key concept", "back": "Concise correct answer or definition" }
]

Requirements:
- Each card must have both "front" and "back" as non-empty strings.
- Keep "back" under 40 words for readability.
- Cover diverse sub-topics within the main topic.
- Return exactly the JSON array, nothing else.`;
}

function buildQuizPrompt(topic) {
    return `You are an expert educator. Generate exactly 15 multiple-choice quiz questions for the topic: "${topic}".

Return ONLY a valid JSON array. No markdown fences, no explanation text, no surrounding prose.

Schema (strict):
[
  {
    "question": "The full question text",
    "options": ["Exact option A", "Exact option B", "Exact option C", "Exact option D"],
    "correctAnswer": "Exact option A",
    "explanation": "Brief explanation under 50 words"
  }
]

Rules (must be followed):
1. options must be an array of EXACTLY 4 unique, non-empty strings.
2. correctAnswer must EXACTLY match one of the 4 option strings (character-for-character).
3. explanation is required and must be under 50 words.
4. No numbered prefixes on options (e.g. "A.", "1." are forbidden).
5. All 15 questions must be present.
6. Return exactly the JSON array, nothing else.`;
}

function buildRetryPrompt(topic, type) {
    // Stricter version used on the second attempt
    if (type === 'flashcard') {
        return `Generate 10 flashcards on "${topic}". 
Respond with ONLY this JSON, no other text:
[{"front":"...","back":"..."},{"front":"...","back":"..."}]`;
    }
    return `Generate 10 quiz questions on "${topic}".
Respond with ONLY this JSON, no other text:
[{"question":"...","options":["A","B","C","D"],"correctAnswer":"A","explanation":"..."}]`;
}

// ── AI call helper ────────────────────────────────────────────────────────────

async function callGemini(prompt) {
    const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash", // Fast, stable model
        generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.5,
            maxOutputTokens: 8192,
        },
    });
    const result = await model.generateContent(prompt);
    return result.response.text();
}

// ── Main handler ──────────────────────────────────────────────────────────────

export async function POST(req) {
    let body;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { chapters, courseId, type, topic: frontendTopic } = body;

    if (!courseId || !type) {
        return NextResponse.json({ error: "Missing required fields: courseId, type" }, { status: 400 });
    }
    // Context for AI: prefer frontend topic + chapters, otherwise whatever we have
    const aiTopicContext = [frontendTopic, chapters].filter(Boolean).join(' - ') || type;

    const normalizedType = normalizeType(type);
    if (!normalizedType || !['flashcard', 'quiz'].includes(normalizedType)) {
        return NextResponse.json({ error: `Unsupported content type: "${type}"` }, { status: 400 });
    }


    // ── Upsert: one record per (courseId, type) ───────────────────────────────
    // Delete any existing record first so we never accumulate stale duplicates.
    try {
        await db.delete(STUDY_TYPE_CONTENT_TABLE).where(
            and(
                eq(STUDY_TYPE_CONTENT_TABLE.courseId, courseId),
                eq(STUDY_TYPE_CONTENT_TABLE.type, normalizedType)
            )
        );
        // Also delete legacy capitalised rows (e.g. "Quiz", "Flashcard")
        const legacyType = normalizedType.charAt(0).toUpperCase() + normalizedType.slice(1);
        if (legacyType !== normalizedType) {
            await db.delete(STUDY_TYPE_CONTENT_TABLE).where(
                and(
                    eq(STUDY_TYPE_CONTENT_TABLE.courseId, courseId),
                    eq(STUDY_TYPE_CONTENT_TABLE.type, legacyType)
                )
            );
        }
    } catch (deleteErr) {
        console.warn('[study-type-content] Could not clean up old rows:', deleteErr.message);
        // Non-fatal; continue
    }

    // Insert placeholder row so the UI can show "Generating..."
    const inserted = await db
        .insert(STUDY_TYPE_CONTENT_TABLE)
        .values({
            courseId,
            type: normalizedType,
            content: [],
            status: 'Generating',
        })
        .returning({ id: STUDY_TYPE_CONTENT_TABLE.id });

    const recordId = inserted[0].id;

    // ── AI generation with retry ──────────────────────────────────────────────
    const primaryPrompt =
        normalizedType === 'flashcard'
            ? buildFlashcardPrompt(aiTopicContext)
            : buildQuizPrompt(aiTopicContext);

    let parsedContent = null;
    let validationErrors = [];

    for (let attempt = 1; attempt <= 2; attempt++) {
        const prompt =
            attempt === 1 ? primaryPrompt : buildRetryPrompt(aiTopicContext, normalizedType);

        try {
            const rawText = await callGemini(prompt);
            const arr = extractJsonArray(rawText);

            if (!arr) {
                console.warn(`[study-type-content] Attempt ${attempt}: could not extract JSON array`);
                validationErrors = ['AI returned non-JSON output'];
                continue;
            }

            const { valid, errors } = validateStudyContent(normalizedType, arr);

            if (valid.length > 0) {
                parsedContent = valid;
                validationErrors = errors; // may have some item-level errors but enough valid items
                break;
            } else {
                console.warn(`[study-type-content] Attempt ${attempt} failed validation:`, errors);
                validationErrors = errors;
            }
        } catch (genErr) {
            console.error(`[study-type-content] Attempt ${attempt} Gemini error:`, genErr.message);
            validationErrors = [genErr.message];
        }
    }

    // ── Persist result ────────────────────────────────────────────────────────
    if (!parsedContent || parsedContent.length === 0) {
        await db
            .update(STUDY_TYPE_CONTENT_TABLE)
            .set({ status: 'Failed' })
            .where(eq(STUDY_TYPE_CONTENT_TABLE.id, recordId));

        console.error('[study-type-content] Generation failed after retries:', validationErrors);
        return NextResponse.json(
            {
                error: 'AI could not produce valid content after 2 attempts.',
                details: validationErrors,
            },
            { status: 500 }
        );
    }

    await db
        .update(STUDY_TYPE_CONTENT_TABLE)
        .set({ content: parsedContent, status: 'Ready' })
        .where(eq(STUDY_TYPE_CONTENT_TABLE.id, recordId));

    return NextResponse.json({
        id: recordId,
        courseId,
        type: normalizedType,
        status: 'Ready',
        content: parsedContent,
    });
}