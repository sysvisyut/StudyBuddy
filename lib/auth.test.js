import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requireCourseOwnership } from '@/lib/auth';
import { db } from '@/configs/db';
import { currentUser } from '@clerk/nextjs/server';

vi.mock('@clerk/nextjs/server', () => ({
    currentUser: vi.fn(),
}));
vi.mock('@/configs/db', () => ({
    db: {
        select: vi.fn(),
    }
}));

// We must mock NextResponse for our test environment
vi.mock('next/server', () => ({
    NextResponse: {
        json: vi.fn((body, init) => ({
            ...body,
            status: init?.status || 200
        }))
    }
}));

describe('requireCourseOwnership', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns 401 if unauthenticated', async () => {
        currentUser.mockResolvedValue(null);
        const { errorResponse } = await requireCourseOwnership('course-123');
        expect(errorResponse.status).toBe(401);
        expect(errorResponse.error).toBe('Unauthorized');
    });

    it('returns 400 if courseId is missing', async () => {
        currentUser.mockResolvedValue({ primaryEmailAddress: { emailAddress: 'user@test.com' } });
        const { errorResponse } = await requireCourseOwnership(null);
        expect(errorResponse.status).toBe(400);
        expect(errorResponse.error).toBe('Missing courseId');
    });

    it('returns 404 if course does not exist (prevents enumeration)', async () => {
        currentUser.mockResolvedValue({ primaryEmailAddress: { emailAddress: 'user@test.com' } });
        const mockWhere = vi.fn().mockResolvedValue([]);
        db.select.mockReturnValue({ from: vi.fn().mockReturnValue({ where: mockWhere }) });
        
        const { errorResponse } = await requireCourseOwnership('course-123');
        expect(errorResponse.status).toBe(404);
        expect(errorResponse.error).toBe('Not found');
    });

    it('returns 403 if course is owned by someone else (prevents unauthorized access)', async () => {
        currentUser.mockResolvedValue({ primaryEmailAddress: { emailAddress: 'attacker@test.com' } });
        const mockWhere = vi.fn().mockResolvedValue([{ createdBy: 'victim@test.com' }]);
        db.select.mockReturnValue({ from: vi.fn().mockReturnValue({ where: mockWhere }) });
        
        const { errorResponse } = await requireCourseOwnership('course-123');
        expect(errorResponse.status).toBe(403);
        expect(errorResponse.error).toBe('Forbidden');
    });

    it('returns course and userEmail if owned by legitimate user', async () => {
        currentUser.mockResolvedValue({ primaryEmailAddress: { emailAddress: 'owner@test.com' } });
        const mockWhere = vi.fn().mockResolvedValue([{ createdBy: 'owner@test.com', id: 1 }]);
        db.select.mockReturnValue({ from: vi.fn().mockReturnValue({ where: mockWhere }) });
        
        const result = await requireCourseOwnership('course-123');
        expect(result.errorResponse).toBeUndefined();
        expect(result.course.id).toBe(1);
        expect(result.userEmail).toBe('owner@test.com');
    });
});
