import { describe, it, expect } from 'vitest';
import {
    normalizeType,
    validateFlashcards,
    validateQuiz,
    extractJsonArray,
} from './studyContent.js';

// ── normalizeType ─────────────────────────────────────────────────────────────

describe('normalizeType', () => {
    it('normalizes flashcard aliases case-insensitively', () => {
        expect(normalizeType('Flashcard')).toBe('flashcard');
        expect(normalizeType('FLASHCARD')).toBe('flashcard');
        expect(normalizeType('flashcards')).toBe('flashcard');
        expect(normalizeType('flashcard')).toBe('flashcard');
    });

    it('normalizes quiz', () => {
        expect(normalizeType('Quiz')).toBe('quiz');
        expect(normalizeType('QUIZ')).toBe('quiz');
    });

    it('normalizes notes aliases', () => {
        expect(normalizeType('NOTES')).toBe('notes');
        expect(normalizeType('note')).toBe('notes');
        expect(normalizeType('Notes')).toBe('notes');
    });

    it('normalizes qa aliases', () => {
        expect(normalizeType('qa')).toBe('qa');
        expect(normalizeType('Q&A')).toBe('qa');
    });

    it('passes through unknown types (lowercased)', () => {
        expect(normalizeType('CUSTOM')).toBe('custom');
        expect(normalizeType('random')).toBe('random');
    });

    it('returns null for non-string input', () => {
        expect(normalizeType(null)).toBeNull();
        expect(normalizeType(undefined)).toBeNull();
        expect(normalizeType(42)).toBeNull();
        expect(normalizeType({})).toBeNull();
    });

    it('returns null for empty string', () => {
        expect(normalizeType('')).toBeNull();
    });
});

// ── validateFlashcards ────────────────────────────────────────────────────────

describe('validateFlashcards', () => {
    it('accepts a valid array of flashcards', () => {
        const input = [
            { front: 'What is 2+2?', back: '4' },
            { front: 'Capital of France?', back: 'Paris' },
        ];
        const { valid, errors } = validateFlashcards(input);
        expect(valid).toHaveLength(2);
        expect(errors).toHaveLength(0);
        expect(valid[0]).toEqual({ front: 'What is 2+2?', back: '4' });
    });

    it('trims whitespace from front and back', () => {
        const { valid } = validateFlashcards([{ front: '  Q  ', back: '  A  ' }]);
        expect(valid[0]).toEqual({ front: 'Q', back: 'A' });
    });

    it('rejects non-array input', () => {
        const { valid, errors } = validateFlashcards('not an array');
        expect(valid).toHaveLength(0);
        expect(errors).toContain('Expected an array of flashcards');
    });

    it('rejects null input', () => {
        const { valid, errors } = validateFlashcards(null);
        expect(valid).toHaveLength(0);
        expect(errors).toContain('Expected an array of flashcards');
    });

    it('rejects empty array with a "no valid items" error', () => {
        const { valid, errors } = validateFlashcards([]);
        expect(valid).toHaveLength(0);
        expect(errors).toContain('No valid flashcard items found');
    });

    it('rejects items with empty front', () => {
        const { valid, errors } = validateFlashcards([{ front: '', back: 'Answer' }]);
        expect(valid).toHaveLength(0);
        expect(errors.length).toBeGreaterThan(0);
    });

    it('rejects items with missing back', () => {
        const { valid, errors } = validateFlashcards([{ front: 'Question' }]);
        expect(valid).toHaveLength(0);
        expect(errors.length).toBeGreaterThan(0);
    });

    it('filters mixed valid/invalid — keeps only valid', () => {
        const input = [
            { front: 'Good Q', back: 'Good A' },
            { front: '', back: 'No front' },
            { front: 'Also good', back: 'Also good A' },
        ];
        const { valid, errors } = validateFlashcards(input);
        expect(valid).toHaveLength(2);
        expect(errors).toHaveLength(1); // one malformed item
    });

    it('rejects non-string front/back gracefully', () => {
        const { valid } = validateFlashcards([{ front: 123, back: null }]);
        expect(valid).toHaveLength(0);
    });
});

// ── validateQuiz ──────────────────────────────────────────────────────────────

describe('validateQuiz', () => {
    const validQuestion = {
        question: 'What is the capital of France?',
        options: ['Berlin', 'London', 'Paris', 'Madrid'],
        correctAnswer: 'Paris',
        explanation: 'Paris is the capital.',
    };

    it('accepts a valid quiz question', () => {
        const { valid, errors } = validateQuiz([validQuestion]);
        expect(valid).toHaveLength(1);
        expect(errors).toHaveLength(0);
        expect(valid[0].question).toBe('What is the capital of France?');
        expect(valid[0].correctAnswer).toBe('Paris');
    });

    it('accepts quiz question without explanation', () => {
        const { valid } = validateQuiz([{ ...validQuestion, explanation: undefined }]);
        expect(valid).toHaveLength(1);
        expect(valid[0].explanation).toBe('');
    });

    it('rejects non-array input', () => {
        const { valid, errors } = validateQuiz('not an array');
        expect(valid).toHaveLength(0);
        expect(errors).toContain('Expected an array of quiz questions');
    });

    it('rejects empty array', () => {
        const { valid, errors } = validateQuiz([]);
        expect(valid).toHaveLength(0);
        expect(errors).toContain('No valid quiz questions found');
    });

    it('rejects question with empty question string', () => {
        const { valid } = validateQuiz([{ ...validQuestion, question: '' }]);
        expect(valid).toHaveLength(0);
    });

    it('rejects question with fewer than 4 options', () => {
        const { valid } = validateQuiz([{ ...validQuestion, options: ['A', 'B', 'C'] }]);
        expect(valid).toHaveLength(0);
    });

    it('rejects question with more than 4 options', () => {
        const { valid } = validateQuiz([{ ...validQuestion, options: ['A', 'B', 'C', 'D', 'E'] }]);
        expect(valid).toHaveLength(0);
    });

    it('rejects question where correctAnswer is not in options', () => {
        const { valid } = validateQuiz([{ ...validQuestion, correctAnswer: 'Rome' }]);
        expect(valid).toHaveLength(0);
    });

    it('rejects question with missing correctAnswer', () => {
        const { valid } = validateQuiz([{ ...validQuestion, correctAnswer: undefined }]);
        expect(valid).toHaveLength(0);
    });

    it('rejects question with an empty option string', () => {
        const { valid } = validateQuiz([{ ...validQuestion, options: ['Berlin', '', 'Paris', 'Madrid'] }]);
        expect(valid).toHaveLength(0);
    });

    it('filters mixed valid/invalid questions', () => {
        const { valid, errors } = validateQuiz([validQuestion, { question: '', options: [], correctAnswer: '' }]);
        expect(valid).toHaveLength(1);
        expect(errors).toHaveLength(1);
    });
});

// ── extractJsonArray ──────────────────────────────────────────────────────────

describe('extractJsonArray', () => {
    it('parses a clean JSON array string', () => {
        const result = extractJsonArray('[{"a":1},{"b":2}]');
        expect(result).toEqual([{ a: 1 }, { b: 2 }]);
    });

    it('strips markdown json fences', () => {
        const fenced = '```json\n[{"front":"Q","back":"A"}]\n```';
        const result = extractJsonArray(fenced);
        expect(result).toEqual([{ front: 'Q', back: 'A' }]);
    });

    it('strips plain ``` fences without language tag', () => {
        const fenced = '```\n[1,2,3]\n```';
        expect(extractJsonArray(fenced)).toEqual([1, 2, 3]);
    });

    it('unwraps single-key wrapper object', () => {
        const wrapped = '{"flashcards":[{"front":"Q","back":"A"}]}';
        expect(extractJsonArray(wrapped)).toEqual([{ front: 'Q', back: 'A' }]);
    });

    it('unwraps single-key wrapper with different key name', () => {
        const wrapped = JSON.stringify({ questions: [{ q: 1 }, { q: 2 }] });
        expect(extractJsonArray(wrapped)).toEqual([{ q: 1 }, { q: 2 }]);
    });

    it('extracts JSON array embedded in surrounding prose', () => {
        const prose = 'Here is the result:\n[{"a":1}]\nEnd of output.';
        expect(extractJsonArray(prose)).toEqual([{ a: 1 }]);
    });

    it('returns null for completely unparseable input', () => {
        expect(extractJsonArray('this is not JSON at all')).toBeNull();
    });

    it('returns null for null input', () => {
        expect(extractJsonArray(null)).toBeNull();
    });

    it('returns null for non-string input', () => {
        expect(extractJsonArray(42)).toBeNull();
        expect(extractJsonArray({})).toBeNull();
        expect(extractJsonArray(undefined)).toBeNull();
    });

    it('returns null for a JSON object with no array values', () => {
        expect(extractJsonArray('{"key":"value","num":42}')).toBeNull();
    });

    it('returns null for a malformed fenced block', () => {
        expect(extractJsonArray('```json\nnot valid json\n```')).toBeNull();
    });
});
