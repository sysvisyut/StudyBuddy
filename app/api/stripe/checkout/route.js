import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';

export async function POST(req) {
    // Lazy import: prevents build-time crash if STRIPE_SECRET_KEY is not set
    const Stripe = (await import('stripe')).default;

    if (!process.env.STRIPE_SECRET_KEY) {
        return NextResponse.json(
            { error: 'Stripe is not configured. Add STRIPE_SECRET_KEY to your environment.' },
            { status: 503 }
        );
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2024-11-20.acacia',
    });

    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const email = user.emailAddresses[0]?.emailAddress;
        if (!email) {
            return NextResponse.json({ error: 'No email found on user account' }, { status: 400 });
        }

        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card'],
            customer_email: email,
            line_items: [
                {
                    price: process.env.STRIPE_PRICE_ID,
                    quantity: 1,
                },
            ],
            metadata: {
                // Store user email so the webhook can find the DB record
                userEmail: email,
            },
            success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgraded=true`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/upgrade?cancelled=true`,
        });

        return NextResponse.json({ url: session.url });
    } catch (err) {
        console.error('[Stripe Checkout] Error:', err);
        return NextResponse.json(
            { error: err.message || 'Failed to create checkout session' },
            { status: 500 }
        );
    }
}
