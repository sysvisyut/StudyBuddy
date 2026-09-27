import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { db } from '@/configs/db';

// Mock dependencies
vi.mock('@/configs/db', () => ({
    db: {
        insert: vi.fn(),
        select: vi.fn(),
    }
}));

function createMockRequest(body) {
    return {
        json: vi.fn().mockResolvedValue(body)
    };
}

describe('POST /api/create-user', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should insert a new user and return it if email is not taken', async () => {
        const mockUser = {
            id: 1,
            name: 'Test User',
            email: 'test@example.com'
        };

        const mockReturning = vi.fn().mockResolvedValue([mockUser]);
        const mockOnConflict = vi.fn().mockReturnValue({ returning: mockReturning });
        const mockValues = vi.fn().mockReturnValue({ onConflictDoNothing: mockOnConflict });
        db.insert.mockReturnValue({ values: mockValues });

        const req = createMockRequest({
            user: {
                fullName: 'Test User',
                primaryEmailAddress: { emailAddress: 'test@example.com' }
            }
        });

        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toEqual({ result: mockUser });
        expect(db.insert).toHaveBeenCalledTimes(1);
        expect(db.select).not.toHaveBeenCalled();
    });

    it('should return existing user if email already exists (conflict)', async () => {
        const mockUser = {
            id: 1,
            name: 'Test User',
            email: 'test@example.com'
        };

        // Insert returns empty array due to conflict
        const mockReturning = vi.fn().mockResolvedValue([]);
        const mockOnConflict = vi.fn().mockReturnValue({ returning: mockReturning });
        const mockValues = vi.fn().mockReturnValue({ onConflictDoNothing: mockOnConflict });
        db.insert.mockReturnValue({ values: mockValues });

        // Select returns existing user
        const mockWhere = vi.fn().mockResolvedValue([mockUser]);
        const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
        db.select.mockReturnValue({ from: mockFrom });

        const req = createMockRequest({
            user: {
                fullName: 'Test User',
                primaryEmailAddress: { emailAddress: 'test@example.com' }
            }
        });

        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toEqual({ result: mockUser });
        expect(db.insert).toHaveBeenCalledTimes(1);
        expect(db.select).toHaveBeenCalledTimes(1);
    });

    it('should return 400 if email is missing', async () => {
        const req = createMockRequest({
            user: {
                fullName: 'Test User'
                // missing primaryEmailAddress
            }
        });

        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data).toEqual({ error: 'User email address is missing or invalid' });
        expect(db.insert).not.toHaveBeenCalled();
    });
    
    it('should return 400 if body is malformed (not JSON)', async () => {
        const req = {
            json: vi.fn().mockRejectedValue(new Error('Invalid JSON'))
        };

        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data).toEqual({ error: 'Invalid JSON body' });
        expect(db.insert).not.toHaveBeenCalled();
    });
});
