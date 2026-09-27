import { describe, it, expect, vi, beforeEach } from 'vitest';

// All vi.mock factories must be self-contained (hoisted before module scope).
vi.mock('@/configs/db', () => ({
    db: { execute: vi.fn() }
}));

vi.mock('drizzle-orm', () => ({
    sql: vi.fn()
}));

vi.mock('next/server', () => ({
    NextResponse: {
        json: vi.fn((body, init) => ({ body, status: init?.status ?? 200 }))
    }
}));

describe('GET /api/health', () => {
    let GET;
    let db;

    beforeEach(async () => {
        vi.clearAllMocks();
        vi.resetModules();
        const mod = await import('./route.js');
        GET = mod.GET;
        const dbMod = await import('@/configs/db');
        db = dbMod.db;
    });

    it('returns 200 with status:ok when DB is reachable', async () => {
        db.execute.mockResolvedValue([{ '?column?': 1 }]);

        const res = await GET();

        expect(res.status).toBe(200);
        expect(res.body.status).toBe('ok');
        expect(res.body.services.database.status).toBe('ok');
        expect(typeof res.body.services.database.latencyMs).toBe('number');
        expect(res.body.services.database.latencyMs).toBeGreaterThanOrEqual(0);
        expect(res.body.timestamp).toBeDefined();
        expect(typeof res.body.uptime).toBe('number');
        expect(typeof res.body.responseTimeMs).toBe('number');
    });

    it('returns 503 with status:degraded when DB throws', async () => {
        db.execute.mockRejectedValue(new Error('Connection refused — host unreachable'));

        const res = await GET();

        expect(res.status).toBe(503);
        expect(res.body.status).toBe('degraded');
        expect(res.body.services.database.status).toBe('error');
        expect(res.body.services.database.latencyMs).toBeNull();
    });

    it('does not leak DB error details in the response body on failure', async () => {
        db.execute.mockRejectedValue(new Error('postgresql://user:password@host:5432/db'));

        const res = await GET();

        // Stringify the entire body and check no sensitive fragments appear
        const bodyStr = JSON.stringify(res.body);
        expect(bodyStr).not.toContain('postgresql://');
        expect(bodyStr).not.toContain('password');
        expect(bodyStr).not.toContain('Connection refused');
    });

    it('always returns a valid JSON body even on DB failure (never throws)', async () => {
        db.execute.mockRejectedValue(new Error('timeout'));

        // Should not throw — the try/catch inside the handler prevents unhandled rejections
        await expect(GET()).resolves.toBeDefined();
    });

    it('includes all required fields in a success response', async () => {
        db.execute.mockResolvedValue([]);

        const res = await GET();

        expect(res.body).toHaveProperty('status');
        expect(res.body).toHaveProperty('timestamp');
        expect(res.body).toHaveProperty('uptime');
        expect(res.body).toHaveProperty('services');
        expect(res.body).toHaveProperty('responseTimeMs');
        expect(res.body.services).toHaveProperty('database');
    });
});
