import { db } from "@/configs/db";
import { CHAPTER_NOTES_TABLE, STUDY_TYPE_CONTENT_TABLE } from "@/configs/schema";
import { eq, and, or } from "drizzle-orm";
import { NextResponse } from "next/server";
import { normalizeType, validateStudyContent } from "@/lib/studyContent";

/**
 * Normalizes a row fetched from the DB:
 * - canonicalizes the type string
 * - validates + filters content items so no broken data reaches the UI
 * - returns a predictable shape
 */
function normalizeRow(row) {
    if (!row) return null;
    const type = normalizeType(row.type);
    const rawContent = Array.isArray(row.content) ? row.content : [];

    // Only validate Ready rows — Generating/Failed rows have empty content anyway
    let content = rawContent;
    if (row.status === 'Ready' && rawContent.length > 0) {
        const { valid } = validateStudyContent(type, rawContent);
        content = valid; // silently drop any malformed items
    }

    return {
        id: row.id,
        courseId: row.courseId,
        type,
        status: row.status,
        content,
    };
}

/**
 * Finds a content row for a given courseId + canonical type,
 * covering legacy capitalized variants in one DB query.
 */
async function findContentRow(courseId, canonicalType) {
    // Build the legacy variant (e.g. 'quiz' → 'Quiz')
    const legacyType =
        canonicalType.charAt(0).toUpperCase() + canonicalType.slice(1);

    const rows = await db
        .select()
        .from(STUDY_TYPE_CONTENT_TABLE)
        .where(
            and(
                eq(STUDY_TYPE_CONTENT_TABLE.courseId, courseId),
                or(
                    eq(STUDY_TYPE_CONTENT_TABLE.type, canonicalType),
                    eq(STUDY_TYPE_CONTENT_TABLE.type, legacyType)
                )
            )
        );

    if (!rows.length) return null;

    // If multiple rows (shouldn't happen after the upsert fix, but be safe),
    // prefer Ready > Generating > the most recent by id descending
    const sorted = rows.sort((a, b) => {
        if (a.status === 'Ready' && b.status !== 'Ready') return -1;
        if (b.status === 'Ready' && a.status !== 'Ready') return 1;
        return b.id - a.id;
    });

    return normalizeRow(sorted[0]);
}

export async function POST(req) {
    let body;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { courseId, studyType } = body;

    if (!courseId || !studyType) {
        return NextResponse.json(
            { error: "Missing required fields: courseId, studyType" },
            { status: 400 }
        );
    }

    // ── ALL: return everything for the course dashboard ───────────────────────
    if (studyType === 'ALL') {
        const [notes, allContent] = await Promise.all([
            db
                .select()
                .from(CHAPTER_NOTES_TABLE)
                .where(eq(CHAPTER_NOTES_TABLE.courseId, courseId)),
            db
                .select()
                .from(STUDY_TYPE_CONTENT_TABLE)
                .where(eq(STUDY_TYPE_CONTENT_TABLE.courseId, courseId)),
        ]);

        // Group by canonical type, picking the best row per type
        const grouped = {};
        for (const row of allContent) {
            const canon = normalizeType(row.type) ?? row.type;
            const existing = grouped[canon];
            // Prefer Ready over Generating/Failed; prefer higher id for ties
            if (
                !existing ||
                (row.status === 'Ready' && existing.status !== 'Ready') ||
                (row.status === existing.status && row.id > existing.id)
            ) {
                grouped[canon] = row;
            }
        }

        return NextResponse.json({
            notes,
            flashcard: grouped['flashcard'] ? [normalizeRow(grouped['flashcard'])] : [],
            quiz: grouped['quiz'] ? [normalizeRow(grouped['quiz'])] : [],
            qa: grouped['qa'] ? [normalizeRow(grouped['qa'])] : [],
        });
    }

    // ── NOTES: chapter notes list ─────────────────────────────────────────────
    if (studyType === 'NOTES') {
        const notes = await db
            .select()
            .from(CHAPTER_NOTES_TABLE)
            .where(eq(CHAPTER_NOTES_TABLE.courseId, courseId));
        return NextResponse.json(notes);
    }

    // ── Single type: flashcard, quiz, qa, etc. ────────────────────────────────
    const canonicalType = normalizeType(studyType);
    if (!canonicalType) {
        return NextResponse.json(
            { error: `Unrecognized studyType: "${studyType}"` },
            { status: 400 }
        );
    }

    const row = await findContentRow(courseId, canonicalType);
    return NextResponse.json(row ?? null);
}
