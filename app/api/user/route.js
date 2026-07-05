import { NextResponse } from 'next/server';
import { db } from '@/configs/db';
import { USER_TABLE } from '@/configs/schema';
import { eq } from 'drizzle-orm';

/**
 * GET /api/user?email=...
 * Returns the user's membership status so the sidebar and upgrade page
 * can reflect real subscription state.
 */
export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get('email');

        if (!email) {
            return NextResponse.json({ error: 'Missing email parameter' }, { status: 400 });
        }

        const result = await db.select().from(USER_TABLE).where(eq(USER_TABLE.email, email));

        if (!result.length) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const { isMember, stripeCustomerId, stripeSubscriptionId } = result[0];
        return NextResponse.json({ isMember, stripeCustomerId, stripeSubscriptionId });
    } catch (err) {
        console.error('[GET /api/user] Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
