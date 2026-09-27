import { describe, it, expect } from 'vitest';
import * as AiModel from '@/configs/AiModel';

describe('AiModel configs (for Inngest)', () => {
    it('exports GenerateQuizAiModel', () => {
        expect(AiModel.GenerateQuizAiModel).toBeDefined();
        expect(typeof AiModel.GenerateQuizAiModel.sendMessage).toBe('function');
    });

    it('exports generateNotesAiModel', () => {
        expect(AiModel.generateNotesAiModel).toBeDefined();
        expect(typeof AiModel.generateNotesAiModel.sendMessage).toBe('function');
    });
});
