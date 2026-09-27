import { describe, it, expect, vi, beforeEach } from 'vitest';

// All vi.mock factories must be self-contained (no external vars) due to hoisting.

vi.mock('@/configs/AiModel', () => ({
    courseOutlineAIModel: {
        generateContent: vi.fn().mockResolvedValue({
            response: { text: () => JSON.stringify({ chapters: [{ title: 'Ch1' }] }) }
        })
    }
}));

vi.mock('@/configs/db', () => ({
    db: {
        select: vi.fn(),
        transaction: vi.fn(),
    }
}));

vi.mock('@/configs/schema', () => ({
    STUDY_MATERIAL_TABLE: {
        id: 'id', courseId: 'courseId', courseType: 'courseType',
        topic: 'topic', difficultyLevel: 'difficultyLevel',
        courseLayout: 'courseLayout', createdBy: 'createdBy',
        status: 'status',
    },
    USER_TABLE: { isMember: 'isMember', email: 'email' }
}));

vi.mock('@/inngest/client', () => ({
    inngest: { send: vi.fn().mockResolvedValue(true) }
}));

vi.mock('@/lib/constants', () => ({ FREE_LIMIT: 5 }));

vi.mock('drizzle-orm', () => ({
    eq: vi.fn(),
    count: vi.fn().mockReturnValue('count()'),
    sql: vi.fn(),
}));

vi.mock('uuid', () => ({
    validate: vi.fn((id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(id))
}));

vi.mock('@clerk/nextjs/server', () => ({
    currentUser: vi.fn()
}));

vi.mock('next/server', () => ({
    NextResponse: {
        json: vi.fn((body, init) => ({ ...body, status: init?.status || 200 }))
    }
}));

function createMockRequest(body) {
    return { json: vi.fn().mockResolvedValue(body) };
}

const VALID_UUID = '123e4567-e89b-12d3-a456-426614174000';

describe('POST /api/generate-course-outline', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns 400 if body is malformed', async () => {
        const { POST } = await import('./route');
        const req = { json: vi.fn().mockRejectedValue(new Error('Invalid JSON')) };
        const response = await POST(req);
        expect(response.status).toBe(400);
        expect(response.error).toBe('Invalid JSON body');
    });

    it('returns 400 if courseId is missing or invalid', async () => {
        const { POST } = await import('./route');
        const req = createMockRequest({ courseId: 'invalid-uuid', topic: 'Math', createdBy: 'test@example.com', courseType: 'Standard', difficultyLevel: 'Easy' });
        const response = await POST(req);
        expect(response.status).toBe(400);
        expect(response.error).toBe('Valid courseId is required');
    });

    it('returns 400 if topic is missing', async () => {
        const { POST } = await import('./route');
        const req = createMockRequest({ courseId: VALID_UUID, topic: '   ', createdBy: 'test@example.com', courseType: 'Standard', difficultyLevel: 'Easy' });
        const response = await POST(req);
        expect(response.status).toBe(400);
        expect(response.error).toBe('Topic is required');
    });

    it('returns 400 if topic is too long', async () => {
        const { POST } = await import('./route');
        const req = createMockRequest({ courseId: VALID_UUID, topic: 'a'.repeat(301), createdBy: 'test@example.com', courseType: 'Standard', difficultyLevel: 'Easy' });
        const response = await POST(req);
        expect(response.status).toBe(400);
        expect(response.error).toBe('Topic must be under 300 characters');
    });

    it('returns 400 if createdBy is not a valid email', async () => {
        const { POST } = await import('./route');
        const req = createMockRequest({ courseId: VALID_UUID, topic: 'Math', createdBy: 'invalid-email', courseType: 'Standard', difficultyLevel: 'Easy' });
        const response = await POST(req);
        expect(response.status).toBe(400);
        expect(response.error).toBe('Valid createdBy email is required');
    });

    it('returns 400 if courseType is invalid', async () => {
        const { POST } = await import('./route');
        const req = createMockRequest({ courseId: VALID_UUID, topic: 'Math', createdBy: 'test@example.com', courseType: 'InvalidType', difficultyLevel: 'Easy' });
        const response = await POST(req);
        expect(response.status).toBe(400);
        expect(response.error).toBe('Invalid courseType');
    });

    it('returns 400 if difficultyLevel is invalid', async () => {
        const { POST } = await import('./route');
        const req = createMockRequest({ courseId: VALID_UUID, topic: 'Math', createdBy: 'test@example.com', courseType: 'Standard', difficultyLevel: 'Extreme' });
        const response = await POST(req);
        expect(response.status).toBe(400);
        expect(response.error).toBe('Invalid difficultyLevel');
    });

    it('returns 401 if no authenticated user', async () => {
        const { currentUser } = await import('@clerk/nextjs/server');
        currentUser.mockResolvedValue(null);

        const { POST } = await import('./route');
        const req = createMockRequest({ courseId: VALID_UUID, topic: 'Math', createdBy: 'test@example.com', courseType: 'Exam', difficultyLevel: 'Hard' });
        const response = await POST(req);
        expect(response.status).toBe(401);
    });

    it('returns 403 if free user is at quota limit', async () => {
        const { currentUser } = await import('@clerk/nextjs/server');
        currentUser.mockResolvedValue({ emailAddresses: [{ emailAddress: 'test@example.com' }] });

        const { db } = await import('@/configs/db');
        // First select: user row (not a member). Second select: course count at limit.
        db.select
            .mockReturnValueOnce({ from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([{ isMember: false }]) }) })
            .mockReturnValueOnce({ from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([{ value: 5 }]) }) });

        const { POST } = await import('./route');
        const req = createMockRequest({ courseId: VALID_UUID, topic: 'Math', createdBy: 'test@example.com', courseType: 'Exam', difficultyLevel: 'Hard' });
        const response = await POST(req);
        expect(response.status).toBe(403);
        expect(response.error).toContain('Free plan limit reached');
        expect(db.transaction).not.toHaveBeenCalled();
    });

    it('succeeds and sends inngest event for pro member regardless of count', async () => {
        const { currentUser } = await import('@clerk/nextjs/server');
        currentUser.mockResolvedValue({ emailAddresses: [{ emailAddress: 'pro@example.com' }] });

        const { db } = await import('@/configs/db');
        // User is a member → bypass quota
        db.select
            .mockReturnValueOnce({ from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([{ isMember: true }]) }) })
            .mockReturnValueOnce({ from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([{ value: 99 }]) }) });

        // Transaction mock: returns inserted course
        db.transaction.mockImplementation(async (fn) => fn({
            execute: vi.fn().mockResolvedValue({}),
            select: vi.fn().mockReturnValue({ from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([{ value: 99 }]) }) }),
            insert: vi.fn().mockReturnValue({ values: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([{ courseId: VALID_UUID, courseLayout: { chapters: [] } }]) }) }),
        }));

        const { POST } = await import('./route');
        const { inngest } = await import('@/inngest/client');

        const req = createMockRequest({ courseId: VALID_UUID, topic: 'Math', createdBy: 'pro@example.com', courseType: 'Exam', difficultyLevel: 'Hard' });
        const response = await POST(req);

        expect(response.status).toBe(200);
        expect(inngest.send).toHaveBeenCalledWith(expect.objectContaining({ name: 'notes.generate' }));
    });
});
