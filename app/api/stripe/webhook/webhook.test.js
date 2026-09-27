import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route.js';

// Mock DB
const mockUpdate = vi.fn();
const mockSet = vi.fn();
const mockWhere = vi.fn();

mockUpdate.mockReturnValue({ set: mockSet });
mockSet.mockReturnValue({ where: mockWhere });
mockWhere.mockResolvedValue([{ id: 1 }]);

vi.mock('@/configs/db', () => ({
    db: {
        update: mockUpdate
    }
}));

// Mock Stripe
const mockConstructEvent = vi.fn();
vi.mock('stripe', () => {
    return {
        default: vi.fn().mockImplementation(() => ({
            webhooks: {
                constructEvent: mockConstructEvent
            }
        }))
    };
});

// Mock headers
vi.mock('next/headers', () => ({
    headers: vi.fn().mockResolvedValue({
        get: vi.fn().mockReturnValue('fake-signature')
    })
}));

describe('Stripe Webhook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.env.STRIPE_SECRET_KEY = 'sk_test_123';
        process.env.STRIPE_WEBHOOK_SECRET = 'whsec_123';
    });

    const createMockRequest = (body) => ({
        text: vi.fn().mockResolvedValue(JSON.stringify(body))
    });

    it('downgrades user on valid customer.subscription.deleted event', async () => {
        const mockEvent = {
            type: 'customer.subscription.deleted',
            data: {
                object: { id: 'sub_123' }
            }
        };
        mockConstructEvent.mockReturnValue(mockEvent);

        const req = createMockRequest(mockEvent);
        const res = await POST(req);
        
        expect(res.status).toBe(200);
        expect(mockUpdate).toHaveBeenCalled();
        expect(mockSet).toHaveBeenCalledWith({
            isMember: false,
            stripeSubscriptionId: null
        });
        expect(mockWhere).toHaveBeenCalled();
    });

    it('returns 200 (no-op) for unknown stripeSubscriptionId (handled by DB where clause)', async () => {
        const mockEvent = {
            type: 'customer.subscription.deleted',
            data: {
                object: { id: 'sub_unknown' }
            }
        };
        mockConstructEvent.mockReturnValue(mockEvent);
        mockWhere.mockResolvedValue([]); // No rows affected

        const req = createMockRequest(mockEvent);
        const res = await POST(req);
        
        expect(res.status).toBe(200);
        expect(mockSet).toHaveBeenCalledWith({
            isMember: false,
            stripeSubscriptionId: null
        });
    });

    it('returns 400 when subscription.id is missing', async () => {
        const mockEvent = {
            type: 'customer.subscription.deleted',
            data: {
                object: { } // Missing ID
            }
        };
        mockConstructEvent.mockReturnValue(mockEvent);

        const req = createMockRequest(mockEvent);
        const res = await POST(req);
        
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error).toBe('Missing subscription.id');
        expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('returns 500 when DB update fails', async () => {
        const mockEvent = {
            type: 'customer.subscription.deleted',
            data: {
                object: { id: 'sub_fail' }
            }
        };
        mockConstructEvent.mockReturnValue(mockEvent);
        mockWhere.mockRejectedValue(new Error('DB connection lost'));

        const req = createMockRequest(mockEvent);
        const res = await POST(req);
        
        expect(res.status).toBe(500);
        const json = await res.json();
        expect(json.error).toBe('DB update failed');
    });
});
