import { NextResponse } from 'next/server';
import { db } from '@/configs/db';
import { sql } from 'drizzle-orm';

// Never cache health checks — always reflects live state.
export const dynamic = 'force-dynamic';

/**
 * GET /api/health
 *
 * Liveness + DB connectivity probe.
 * Safe to call without authentication — intentionally public (standard practice
 * for uptime monitors and load balancers). Confirmed: middleware.js only protects
 * /dashboard, /create, /course — this route needs no explicit exclusion.
 *
 * Response shape:
 *   200  { status: 'ok',       timestamp, uptime, services: { database: { status: 'ok',    latencyMs: <number> } }, responseTimeMs }
 *   503  { status: 'degraded', timestamp, uptime, services: { database: { status: 'error', latencyMs: null     } }, responseTimeMs }
 *
 * Security: no connection strings, hostnames, or stack traces are included in
 * the response body — failure details are logged server-side only.
 */
export async function GET() {
    const requestStart = Date.now();

    let dbStatus = 'error';
    let dbLatencyMs = null;

    try {
        const dbStart = Date.now();
        // Cheapest possible query — single round-trip, no table scan.
        await db.execute(sql`SELECT 1`);
        dbLatencyMs = Date.now() - dbStart;
        dbStatus = 'ok';
    } catch (err) {
        // Log full details server-side; never echo them into the response.
        console.error('[Health] Database connectivity check failed:', err.message);
    }

    const overallStatus = dbStatus === 'ok' ? 'ok' : 'degraded';
    const httpStatus = dbStatus === 'ok' ? 200 : 503;

    return NextResponse.json(
        {
            status: overallStatus,
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            services: {
                database: {
                    status: dbStatus,
                    latencyMs: dbLatencyMs,
                },
            },
            responseTimeMs: Date.now() - requestStart,
        },
        { status: httpStatus }
    );
}
