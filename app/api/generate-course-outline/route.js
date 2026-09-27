import { NextResponse } from "next/server";
import { courseOutlineAIModel } from "@/configs/AiModel";
import { db } from "@/configs/db";
import { STUDY_MATERIAL_TABLE, USER_TABLE } from "@/configs/schema";
import { inngest } from "@/inngest/client";
import { currentUser } from '@clerk/nextjs/server';
import { eq, count, sql } from 'drizzle-orm';
import { FREE_LIMIT } from '@/lib/constants';
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

        // --- Quota enforcement (server-side, authenticated identity) ---
        // Use Clerk's server-side currentUser() — never trust client-supplied createdBy for quota checks.
        const clerkUser = await currentUser();
        if (!clerkUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const authenticatedEmail = clerkUser.emailAddresses[0]?.emailAddress;

        // Fetch membership status and course count in parallel
        const [userRows, courseCountRows] = await Promise.all([
            db.select({ isMember: USER_TABLE.isMember })
                .from(USER_TABLE)
                .where(eq(USER_TABLE.email, authenticatedEmail)),
            db.select({ value: count() })
                .from(STUDY_MATERIAL_TABLE)
                .where(eq(STUDY_MATERIAL_TABLE.createdBy, authenticatedEmail)),
        ]);

        if (!userRows.length) {
            // DB row missing for a valid Clerk session — defensive fallback.
            console.error(`[Outline] No DB user found for authenticated email: ${authenticatedEmail}`);
            return NextResponse.json(
                { error: 'Account setup incomplete. Please sign out and sign in again.' },
                { status: 403 }
            );
        }

        const isMember = userRows[0].isMember;
        const coursesCreated = courseCountRows[0]?.value ?? 0;

        if (!isMember && coursesCreated >= FREE_LIMIT) {
            // At or over quota — reject before any AI call or DB insert.
            console.warn(`[Outline] Quota exceeded for ${authenticatedEmail}: ${coursesCreated}/${FREE_LIMIT} courses`);
            return NextResponse.json(
                { error: `Free plan limit reached (${coursesCreated}/${FREE_LIMIT} courses). Upgrade to Pro for unlimited courses.` },
                { status: 403 }
            );
        }
        // The pre-check above is an optimization only — it avoids an unnecessary AI call
        // for users already clearly over the limit. The authoritative enforcement happens
        // inside the db.transaction() below via a per-user advisory lock.

        const prompt = `Create a study material for ${sanitizedTopic} with ${difficultyLevel} difficulty level for ${courseType} course, with summary of course, List of chapters along with summary and emoji for each chapter, topic list in each chapter in complete json format`;

        // 1. Generate course outline via AI
        const aiResp = await courseOutlineAIModel.generateContent(prompt);
        const aiResult = JSON.parse(aiResp.response.text());

        // 2. Insert course into DB — protected by a per-user advisory lock.
        //
        //    pg_advisory_xact_lock(hashtext(email)) serialises all concurrent
        //    course-creation requests for the same user. The lock is released
        //    automatically when the transaction commits or rolls back.
        //
        //    The AI call above happens OUTSIDE the transaction so we don't hold
        //    the DB lock while waiting on Gemini. Once the lock is acquired we
        //    re-count — this is authoritative: no other transaction for this user
        //    can INSERT between our count and our insert.
        const dbResult = await db.transaction(async (tx) => {
            // Acquire user-scoped advisory lock.
            // hashtext() maps the email to a stable int4; collisions across different
            // users are theoretically possible but only cause extra serialisation,
            // never data corruption — acceptable at this scale.
            await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${authenticatedEmail}))`);

            // Re-count under the lock — this is the authoritative quota check.
            const lockedCountRows = await tx
                .select({ value: count() })
                .from(STUDY_MATERIAL_TABLE)
                .where(eq(STUDY_MATERIAL_TABLE.createdBy, authenticatedEmail));

            const lockedCount = lockedCountRows[0]?.value ?? 0;

            if (!isMember && lockedCount >= FREE_LIMIT) {
                // Race condition caught — another concurrent request snuck in first.
                console.warn(`[Outline] Quota exceeded (locked recount) for ${authenticatedEmail}: ${lockedCount}/${FREE_LIMIT}`);
                return null; // signals quota-exceeded to the outer scope
            }

            return tx.insert(STUDY_MATERIAL_TABLE).values({
                courseId,
                courseType,
                topic,
                difficultyLevel,
                courseLayout: aiResult,
                createdBy: authenticatedEmail, // always server-side identity, never client-supplied
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
        });

        if (!dbResult) {
            return NextResponse.json(
                { error: `Free plan limit reached (${FREE_LIMIT}/${FREE_LIMIT} courses). Upgrade to Pro for unlimited courses.` },
                { status: 403 }
            );
        }

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