import { NextResponse } from 'next/server';
import { db } from '@/configs/db';
import { USER_TABLE } from '@/configs/schema';
import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';

// Next.js App Router requires the raw body for Stripe signature verification.
export const dynamic = 'force-dynamic';

export async function POST(req) {
    // Lazy import to avoid build-time crash if STRIPE_SECRET_KEY is not set
    const Stripe = (await import('stripe')).default;

    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
        return NextResponse.json(
            { error: 'Stripe is not configured.' },
            { status: 503 }
        );
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2024-11-20.acacia',
    });

    const body = await req.text();
    const headersList = await headers();
    const sig = headersList.get('stripe-signature');

    let event;
    try {
        event = stripe.webhooks.constructEvent(
            body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error('[Stripe Webhook] Signature verification failed:', err.message);
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    // Handle the event
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const userEmail = session.metadata?.userEmail;
        const customerId = session.customer;
        const subscriptionId = session.subscription;

        if (!userEmail) {
            console.error('[Stripe Webhook] No userEmail in session metadata');
            return NextResponse.json({ error: 'Missing user email metadata' }, { status: 400 });
        }

        try {
            await db.update(USER_TABLE)
                .set({
                    isMember: true,
                    stripeCustomerId: customerId?.toString() ?? null,
                    stripeSubscriptionId: subscriptionId?.toString() ?? null,
                })
                .where(eq(USER_TABLE.email, userEmail));

            console.log(`[Stripe Webhook] Upgraded user: ${userEmail}`);
        } catch (dbErr) {
            console.error('[Stripe Webhook] DB update failed:', dbErr);
            return NextResponse.json({ error: 'DB update failed' }, { status: 500 });
        }
    }

    // Acknowledge all other event types gracefully
    return NextResponse.json({ received: true });
}
