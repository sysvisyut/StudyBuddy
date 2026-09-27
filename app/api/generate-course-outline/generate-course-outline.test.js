import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';

vi.mock('@/configs/AiModel', () => ({
    courseOutlineAIModel: {
        generateContent: vi.fn().mockResolvedValue({
            response: { text: () => JSON.stringify({ chapters: [] }) }
        })
    }
}));

vi.mock('@/configs/db', () => ({
    db: {
        insert: vi.fn().mockReturnValue({
            values: vi.fn().mockReturnValue({
                returning: vi.fn().mockResolvedValue([{
                    courseId: '123e4567-e89b-12d3-a456-426614174000'
                }])
            })
        })
    }
}));

vi.mock('next/server', () => ({
    NextResponse: {
        json: vi.fn((body, init) => ({
            ...body,
            status: init?.status || 200
        }))
    }
}));

function createMockRequest(body) {
    return {
        json: vi.fn().mockResolvedValue(body)
    };
}

describe('POST /api/generate-course-outline', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns 400 if body is malformed', async () => {
        const req = {
            json: vi.fn().mockRejectedValue(new Error('Invalid JSON'))
        };
        const response = await POST(req);
        expect(response.status).toBe(400);
        expect(response.error).toBe('Invalid JSON body');
    });

    it('returns 400 if courseId is missing or invalid', async () => {
        const req = createMockRequest({
            courseId: 'invalid-uuid',
            topic: 'Math',
            createdBy: 'test@example.com',
            courseType: 'Standard',
            difficultyLevel: 'Easy'
        });
        const response = await POST(req);
        expect(response.status).toBe(400);
        expect(response.error).toBe('Valid courseId is required');
    });

    it('returns 400 if topic is missing', async () => {
        const req = createMockRequest({
            courseId: '123e4567-e89b-12d3-a456-426614174000',
            topic: '   ',
            createdBy: 'test@example.com',
            courseType: 'Standard',
            difficultyLevel: 'Easy'
        });
        const response = await POST(req);
        expect(response.status).toBe(400);
        expect(response.error).toBe('Topic is required');
    });

    it('returns 400 if topic is too long', async () => {
        const req = createMockRequest({
            courseId: '123e4567-e89b-12d3-a456-426614174000',
            topic: 'a'.repeat(301),
            createdBy: 'test@example.com',
            courseType: 'Standard',
            difficultyLevel: 'Easy'
        });
        const response = await POST(req);
        expect(response.status).toBe(400);
        expect(response.error).toBe('Topic must be under 300 characters');
    });

    it('returns 400 if createdBy is not a valid email', async () => {
        const req = createMockRequest({
            courseId: '123e4567-e89b-12d3-a456-426614174000',
            topic: 'Math',
            createdBy: 'invalid-email',
            courseType: 'Standard',
            difficultyLevel: 'Easy'
        });
        const response = await POST(req);
        expect(response.status).toBe(400);
        expect(response.error).toBe('Valid createdBy email is required');
    });

    it('returns 400 if courseType is invalid', async () => {
        const req = createMockRequest({
            courseId: '123e4567-e89b-12d3-a456-426614174000',
            topic: 'Math',
            createdBy: 'test@example.com',
            courseType: 'InvalidType',
            difficultyLevel: 'Easy'
        });
        const response = await POST(req);
        expect(response.status).toBe(400);
        expect(response.error).toBe('Invalid courseType');
    });

    it('returns 400 if difficultyLevel is invalid', async () => {
        const req = createMockRequest({
            courseId: '123e4567-e89b-12d3-a456-426614174000',
            topic: 'Math',
            createdBy: 'test@example.com',
            courseType: 'Standard',
            difficultyLevel: 'Extreme'
        });
        const response = await POST(req);
        expect(response.status).toBe(400);
        expect(response.error).toBe('Invalid difficultyLevel');
    });

    it('succeeds with valid payload and sanitizes topic', async () => {
        const req = createMockRequest({
            courseId: '123e4567-e89b-12d3-a456-426614174000',
            topic: 'Math <script>',
            createdBy: 'test@example.com',
            courseType: 'Exam',
            difficultyLevel: 'Hard'
        });
        
        const response = await POST(req);
        expect(response.status).toBe(200);
        expect(response.result.courseId).toBe('123e4567-e89b-12d3-a456-426614174000');
    });
});
