import { describe, it, expect, vi, beforeEach } from 'vitest';

// Stripe is used as `new Stripe(key, opts)` in the route, so the mock must be
// a real function (not an arrow fn) to be callable with `new`.
// constructEvent is shared via a module-level ref so beforeEach can reconfigure it.
const mockConstructEvent = vi.fn();

vi.mock('stripe', () => ({
    default: function MockStripe() {
        return { webhooks: { constructEvent: mockConstructEvent } };
    }
}));

vi.mock('@/configs/db', () => ({
    db: {
        update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({
                where: vi.fn().mockResolvedValue([{ id: 1 }])
            })
        })
    }
}));

vi.mock('@/configs/schema', () => ({
    USER_TABLE: { stripeSubscriptionId: 'stripeSubscriptionId', email: 'email' }
}));

vi.mock('drizzle-orm', () => ({ eq: vi.fn() }));

vi.mock('next/headers', () => ({
    headers: vi.fn().mockResolvedValue({
        get: vi.fn().mockReturnValue('fake-signature')
    })
}));

vi.mock('next/server', () => ({
    NextResponse: {
        json: vi.fn((body, init) => ({ ...body, status: init?.status || 200 }))
    }
}));

describe('Stripe Webhook', () => {
    let POST;
    let db;

    beforeEach(async () => {
        vi.clearAllMocks();
        process.env.STRIPE_SECRET_KEY = 'sk_test_123';
        process.env.STRIPE_WEBHOOK_SECRET = 'whsec_123';

        // Re-import after clearing to get fresh module state
        vi.resetModules();
        const mod = await import('./route.js');
        POST = mod.POST;
        const dbMod = await import('@/configs/db');
        db = dbMod.db;

        // Re-wire the chain mocks after resetModules
        const mockWhere = vi.fn().mockResolvedValue([{ id: 1 }]);
        const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
        db.update.mockReturnValue({ set: mockSet });
    });

    const createMockRequest = (body) => ({
        text: vi.fn().mockResolvedValue(JSON.stringify(body))
    });

    it('downgrades user on valid customer.subscription.deleted event', async () => {
        mockConstructEvent.mockReturnValue({
            type: 'customer.subscription.deleted',
            data: { object: { id: 'sub_123' } }
        });

        const req = createMockRequest({});
        const res = await POST(req);

        expect(res.status).toBe(200);
        expect(db.update).toHaveBeenCalled();
        const setMock = db.update.mock.results[0].value.set;
        expect(setMock).toHaveBeenCalledWith({ isMember: false, stripeSubscriptionId: null });
    });

    it('returns 200 (no-op) for unknown stripeSubscriptionId', async () => {
        mockConstructEvent.mockReturnValue({
            type: 'customer.subscription.deleted',
            data: { object: { id: 'sub_unknown' } }
        });
        // Override: where returns empty (0 rows affected — no-op)
        db.update.mockReturnValue({
            set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) })
        });

        const res = await POST(createMockRequest({}));
        expect(res.status).toBe(200);
    });

    it('returns 400 when subscription.id is missing', async () => {
        mockConstructEvent.mockReturnValue({
            type: 'customer.subscription.deleted',
            data: { object: {} } // no id
        });

        const res = await POST(createMockRequest({}));
        expect(res.status).toBe(400);
        expect(res.error).toBe('Missing subscription.id');
        expect(db.update).not.toHaveBeenCalled();
    });

    it('returns 500 when DB update fails so Stripe retries', async () => {
        mockConstructEvent.mockReturnValue({
            type: 'customer.subscription.deleted',
            data: { object: { id: 'sub_fail' } }
        });
        db.update.mockReturnValue({
            set: vi.fn().mockReturnValue({
                where: vi.fn().mockRejectedValue(new Error('DB connection lost'))
            })
        });

        const res = await POST(createMockRequest({}));
        expect(res.status).toBe(500);
        expect(res.error).toBe('DB update failed');
    });
});
