import { NextResponse } from 'next/server';
import { db } from '@/configs/db';
import { USER_TABLE, STUDY_MATERIAL_TABLE } from '@/configs/schema';
import { eq, count } from 'drizzle-orm';
import { FREE_LIMIT } from '@/lib/constants';

/**
 * GET /api/user?email=...
 * Returns the user's membership status and real course credit usage
 * so the sidebar, upgrade page, and quota enforcement can reflect
 * actual subscription and usage state.
 */
export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get('email');

        if (!email) {
            return NextResponse.json({ error: 'Missing email parameter' }, { status: 400 });
        }

        // Fetch user row and course count in parallel
        const [userResult, courseCountResult] = await Promise.all([
            db.select().from(USER_TABLE).where(eq(USER_TABLE.email, email)),
            db.select({ value: count() }).from(STUDY_MATERIAL_TABLE).where(eq(STUDY_MATERIAL_TABLE.createdBy, email)),
        ]);

        if (!userResult.length) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const { isMember, stripeCustomerId, stripeSubscriptionId } = userResult[0];
        const coursesCreated = courseCountResult[0]?.value ?? 0;
        const creditsRemaining = Math.max(0, FREE_LIMIT - coursesCreated);

        return NextResponse.json({
            isMember,
            stripeCustomerId,
            stripeSubscriptionId,
            coursesCreated,
            freeLimit: FREE_LIMIT,
            creditsRemaining,
        });
    } catch (err) {
        console.error('[GET /api/user] Error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
