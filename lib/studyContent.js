/**
 * lib/studyContent.js
 *
 * Shared schema validation and normalization for study content.
 * All type values are canonicalized to lowercase here.
 * Nothing downstream needs to handle case variants.
 */

// ── Canonical type names ──────────────────────────────────────────────────────

/** Normalizes any incoming type string to a canonical lowercase key. */
export function normalizeType(raw) {
    if (!raw || typeof raw !== 'string') return null;
    const t = raw.toLowerCase().trim();
    // Accept any common alias
    if (t === 'flashcard' || t === 'flashcards') return 'flashcard';
    if (t === 'quiz') return 'quiz';
    if (t === 'qa' || t === 'q&a') return 'qa';
    if (t === 'notes' || t === 'note') return 'notes';
    return t; // pass through unknowns
}

// ── Flashcard validator ───────────────────────────────────────────────────────

/**
 * Validates a single flashcard item.
 * Returns a cleaned item or null if it is structurally invalid.
 */
function validateFlashcardItem(item) {
    if (!item || typeof item !== 'object') return null;
    const front = typeof item.front === 'string' ? item.front.trim() : '';
    const back = typeof item.back === 'string' ? item.back.trim() : '';
    if (!front || !back) return null;
    return { front, back };
}

/**
 * Validates and filters a flashcard array.
 * Returns { valid: Array, errors: string[] }
 */
export function validateFlashcards(arr) {
    if (!Array.isArray(arr)) {
        return { valid: [], errors: ['Expected an array of flashcards'] };
    }
    const errors = [];
    const valid = [];
    arr.forEach((item, i) => {
        const cleaned = validateFlashcardItem(item);
        if (cleaned) {
            valid.push(cleaned);
        } else {
            errors.push(`Item ${i} is malformed (needs "front" and "back" strings)`);
        }
    });
    if (valid.length === 0) {
        errors.push('No valid flashcard items found');
    }
    return { valid, errors };
}

// ── Quiz validator ────────────────────────────────────────────────────────────

/**
 * Validates a single quiz question.
 * Returns a cleaned item or null if structurally invalid.
 */
function validateQuizItem(item) {
    if (!item || typeof item !== 'object') return null;

    const question = typeof item.question === 'string' ? item.question.trim() : '';
    if (!question) return null;

    // options must be an array of exactly 4 non-empty strings
    if (!Array.isArray(item.options) || item.options.length !== 4) return null;
    const options = item.options.map((o) => (typeof o === 'string' ? o.trim() : ''));
    if (options.some((o) => !o)) return null;

    // correctAnswer must exactly match one of the options
    const correctAnswer = typeof item.correctAnswer === 'string' ? item.correctAnswer.trim() : '';
    if (!correctAnswer || !options.includes(correctAnswer)) return null;

    const explanation =
        typeof item.explanation === 'string' ? item.explanation.trim() : '';

    return { question, options, correctAnswer, explanation };
}

/**
 * Validates and filters a quiz array.
 * Returns { valid: Array, errors: string[] }
 */
export function validateQuiz(arr) {
    if (!Array.isArray(arr)) {
        return { valid: [], errors: ['Expected an array of quiz questions'] };
    }
    const errors = [];
    const valid = [];
    arr.forEach((item, i) => {
        const cleaned = validateQuizItem(item);
        if (cleaned) {
            valid.push(cleaned);
        } else {
            errors.push(
                `Question ${i} is malformed (needs question, 4 unique options, and a matching correctAnswer)`
            );
        }
    });
    if (valid.length === 0) {
        errors.push('No valid quiz questions found');
    }
    return { valid, errors };
}

// ── Generic dispatcher ────────────────────────────────────────────────────────

/**
 * Routes validation to the correct validator based on type.
 * @param {string} type  - canonical type ('flashcard' | 'quiz')
 * @param {any}    arr   - raw parsed JSON from AI
 * @returns {{ valid: any[], errors: string[] }}
 */
export function validateStudyContent(type, arr) {
    const t = normalizeType(type);
    if (t === 'flashcard') return validateFlashcards(arr);
    if (t === 'quiz') return validateQuiz(arr);
    // Unknown types — accept as-is, treat as generic content
    if (Array.isArray(arr)) return { valid: arr, errors: [] };
    return { valid: [], errors: [`Unknown type "${type}" and content is not an array`] };
}

// ── JSON extraction helpers ───────────────────────────────────────────────────

/**
 * Strips markdown fences and attempts to extract a JSON array from a raw AI string.
 * Handles:
 *  - Clean JSON arrays
 *  - JSON objects with a single array value (e.g. { "questions": [...] })
 *  - Fenced code blocks (```json ... ```)
 */
export function extractJsonArray(rawText) {
    if (typeof rawText !== 'string') return null;

    // Strip markdown fences
    let cleaned = rawText
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();

    let parsed;
    try {
        parsed = JSON.parse(cleaned);
    } catch {
        // Try to find a JSON array embedded in surrounding prose
        const match = cleaned.match(/\[[\s\S]*\]/);
        if (match) {
            try {
                parsed = JSON.parse(match[0]);
            } catch {
                return null;
            }
        } else {
            return null;
        }
    }

    if (Array.isArray(parsed)) return parsed;

    // Unwrap single-key objects: { "flashcards": [...] } → [...]
    if (parsed && typeof parsed === 'object') {
        const keys = Object.keys(parsed);
        for (const key of keys) {
            if (Array.isArray(parsed[key])) return parsed[key];
        }
    }

    return null;
}
