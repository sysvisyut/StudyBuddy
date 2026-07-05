"use client"
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'
import axios from 'axios'
import {
    Loader2, Plus, AlertCircle, CheckCircle2, XCircle,
    ChevronLeft, ChevronRight, Trophy, RotateCcw, BookOpen,
    Target, Zap, HelpCircle, RefreshCw, ArrowLeft
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

// ── Polling config ────────────────────────────────────────────────────────────
const POLL_INTERVAL_MS = 4000;
const MAX_POLL_ATTEMPTS = 30; // stop after 2 minutes

// ── Option chip ───────────────────────────────────────────────────────────────
function OptionChip({ label, text, correct, incorrect, disabled, onClick }) {
    const base =
        'w-full flex items-center gap-3 text-left p-4 rounded-xl border-2 font-semibold text-sm transition-all duration-200';

    let style;
    if (correct) {
        style = 'border-emerald-500 bg-emerald-500/15 text-emerald-300 shadow-[0_0_0_1px_rgba(16,185,129,0.3)] cursor-default';
    } else if (incorrect) {
        style = 'border-red-500 bg-red-500/15 text-red-300 shadow-[0_0_0_1px_rgba(239,68,68,0.3)] cursor-default';
    } else if (disabled) {
        style = 'border-slate-700/40 bg-slate-800/30 text-slate-500 cursor-not-allowed';
    } else {
        style = 'border-slate-700 bg-slate-800/60 text-slate-300 hover:border-indigo-500/60 hover:bg-slate-700/60 hover:text-white cursor-pointer';
    }

    return (
        <button onClick={onClick} disabled={disabled} className={`${base} ${style}`}>
            <span
                className={`w-7 h-7 shrink-0 rounded-lg flex items-center justify-center text-xs font-black border
                    ${correct ? 'border-emerald-500 bg-emerald-500/30 text-emerald-200'
                        : incorrect ? 'border-red-500 bg-red-500/30 text-red-200'
                            : 'border-slate-600 bg-slate-700 text-slate-300'}`}
            >
                {label}
            </span>
            <span className='flex-1 leading-snug'>{text}</span>
            {correct && <CheckCircle2 className='w-5 h-5 text-emerald-400 shrink-0' />}
            {incorrect && <XCircle className='w-5 h-5 text-red-400 shrink-0' />}
        </button>
    );
}

// ── Results screen ────────────────────────────────────────────────────────────
function ResultsScreen({ questions, userAnswers, onRestart, onRegenerate, canRegenerate }) {
    const total = questions.length;
    const score = userAnswers.filter((ans, i) => ans === questions[i]?.correctAnswer).length;
    const pct = total > 0 ? Math.round((score / total) * 100) : 0;

    const grade =
        pct >= 90 ? { label: 'Outstanding!', color: 'text-emerald-400', icon: Trophy }
            : pct >= 70 ? { label: 'Great Job!', color: 'text-indigo-400', icon: Target }
                : pct >= 50 ? { label: 'Keep Going!', color: 'text-amber-400', icon: Zap }
                    : { label: 'Needs Work', color: 'text-red-400', icon: BookOpen };

    const GradeIcon = grade.icon;

    return (
        <div className='flex flex-col items-center gap-8 py-4 max-w-2xl mx-auto'>
            {/* Score card */}
            <div className='w-full border border-slate-700/60 bg-slate-800 rounded-2xl p-8 shadow-[4px_4px_0_0_rgba(15,23,42,1)] text-center'>
                <div className='w-20 h-20 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center mx-auto mb-4'>
                    <GradeIcon className={`w-10 h-10 ${grade.color}`} />
                </div>
                <h2 className={`text-3xl font-black mb-1 ${grade.color}`}>{grade.label}</h2>
                <p className='text-slate-400 text-sm mb-6'>Quiz complete — here's how you did</p>

                <div className='flex items-end justify-center gap-2 mb-6'>
                    <span className='text-7xl font-black text-white'>{pct}</span>
                    <span className='text-3xl font-bold text-slate-400 pb-2'>%</span>
                </div>

                <div className='bg-slate-900/60 rounded-xl p-4 inline-block mb-6'>
                    <p className='text-slate-300 font-bold text-lg'>
                        <span className='text-emerald-400'>{score}</span>
                        <span className='text-slate-500'> / </span>
                        <span>{total}</span>
                        <span className='text-slate-400 font-normal text-sm ml-2'>correct</span>
                    </p>
                </div>

                <Progress value={pct} className='h-2.5 bg-slate-700 [&>div]:bg-indigo-500 [&>div]:rounded-full' />
            </div>

            {/* CTA buttons */}
            <div className='flex flex-wrap gap-3 justify-center'>
                <Button
                    onClick={onRestart}
                    className='bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl px-6 py-3 shadow-md border border-indigo-700 transition-all gap-2'
                >
                    <RotateCcw className='w-4 h-4' />
                    Retake Quiz
                </Button>
                {canRegenerate && (
                    <Button
                        onClick={onRegenerate}
                        variant='outline'
                        className='border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white font-bold rounded-xl px-6 py-3 gap-2'
                    >
                        <RefreshCw className='w-4 h-4' />
                        New Questions
                    </Button>
                )}
            </div>

            {/* Per-question review */}
            <div className='w-full'>
                <h3 className='font-black text-lg text-white mb-4'>Question Review</h3>
                <div className='flex flex-col gap-3'>
                    {questions.map((q, i) => {
                        const isCorrect = userAnswers[i] === q.correctAnswer;
                        return (
                            <div
                                key={i}
                                className={`border rounded-xl p-4 ${isCorrect
                                    ? 'border-emerald-700/50 bg-emerald-950/30'
                                    : 'border-red-700/50 bg-red-950/30'}`}
                            >
                                <div className='flex items-start gap-3'>
                                    {isCorrect
                                        ? <CheckCircle2 className='w-5 h-5 text-emerald-400 mt-0.5 shrink-0' />
                                        : <XCircle className='w-5 h-5 text-red-400 mt-0.5 shrink-0' />
                                    }
                                    <div className='flex-1 min-w-0'>
                                        <p className='text-sm font-semibold text-white leading-snug mb-2'>
                                            Q{i + 1}. {q.question}
                                        </p>
                                        {!isCorrect && (
                                            <p className='text-xs text-slate-400 mb-1'>
                                                <span className='text-red-400 font-bold'>Your answer: </span>
                                                {userAnswers[i] ?? 'Not answered'}
                                            </p>
                                        )}
                                        <p className='text-xs text-slate-400'>
                                            <span className='text-emerald-400 font-bold'>Correct: </span>
                                            {q.correctAnswer}
                                        </p>
                                        {q.explanation && (
                                            <p className='text-xs text-slate-500 mt-2 italic leading-relaxed'>
                                                {q.explanation}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// ── Shared header ─────────────────────────────────────────────────────────────
function QuizHeader({ courseId, extra }) {
    return (
        <div>
            {courseId && (
                <div className='mb-4'>
                    <Link href={`/course/${courseId}`}>
                        <Button variant="outline" className="border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white rounded-full">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Course
                        </Button>
                    </Link>
                </div>
            )}
            <div className='mb-6 flex items-center justify-between flex-wrap gap-4'>
                <div className='flex items-center gap-3'>
                    <div className='w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center'>
                        <HelpCircle className='w-6 h-6 text-emerald-400' />
                    </div>
                    <div>
                        <h2 className='font-black text-2xl text-white'>Quiz</h2>
                        <p className='text-slate-400 text-sm mt-0.5'>Test your knowledge</p>
                    </div>
                </div>
                {extra}
            </div>
        </div>
    );
}

// ── Main quiz page ────────────────────────────────────────────────────────────
const LABELS = ['A', 'B', 'C', 'D'];

function Quiz() {
    const { courseId } = useParams();

    const [quizData, setQuizData] = useState(null);
    const [loadState, setLoadState] = useState('loading'); // 'loading'|'generating'|'ready'|'empty'|'failed'|'error'
    const [generating, setGenerating] = useState(false);
    const [course, setCourse] = useState(null);

    // Quiz interaction state
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState([]);
    const [showResults, setShowResults] = useState(false);

    const pollRef = useRef(null);
    const pollAttempts = useRef(0);

    useEffect(() => {
        if (courseId) {
            fetchQuiz();
            fetchCourse();
        }
        return () => stopPolling();
    }, [courseId]);

    const stopPolling = () => {
        if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
        }
        pollAttempts.current = 0;
    };

    const startPolling = useCallback(() => {
        if (pollRef.current) return;
        pollAttempts.current = 0;
        pollRef.current = setInterval(async () => {
            pollAttempts.current += 1;
            if (pollAttempts.current > MAX_POLL_ATTEMPTS) {
                stopPolling();
                setLoadState('failed');
                return;
            }
            try {
                const result = await axios.post('/api/study-type', {
                    courseId,
                    studyType: 'quiz',
                });
                const data = result?.data;
                if (!data) return;

                if (data.status === 'Ready') {
                    stopPolling();
                    setQuizData(data);
                    setLoadState(data.content?.length > 0 ? 'ready' : 'empty');
                } else if (data.status === 'Failed') {
                    stopPolling();
                    setLoadState('failed');
                }
            } catch (err) {
                console.warn('[Quiz] Polling error:', err.message);
            }
        }, POLL_INTERVAL_MS);
    }, [courseId]);

    const fetchQuiz = async () => {
        setLoadState('loading');
        try {
            const result = await axios.post('/api/study-type', {
                courseId,
                studyType: 'quiz',
            });
            const data = result?.data;

            if (!data) {
                setLoadState('empty');
                return;
            }

            setQuizData(data);
            if (data.status === 'Ready') {
                setLoadState(data.content?.length > 0 ? 'ready' : 'empty');
            } else if (data.status === 'Generating') {
                setLoadState('generating');
                startPolling();
            } else if (data.status === 'Failed') {
                setLoadState('failed');
            } else {
                setLoadState('empty');
            }
        } catch (err) {
            console.error('[Quiz] Fetch error:', err);
            setLoadState('error');
        }
    };

    const fetchCourse = async () => {
        try {
            const result = await axios.get(`/api/courses?courseId=${courseId}`);
            setCourse(result?.data?.result);
        } catch (err) {
            console.warn('[Quiz] Course fetch error:', err.message);
        }
    };

    const GenerateQuiz = async () => {
        if (!course) return;
        setGenerating(true);

        const chapters = (course?.courseLayout?.chapters ?? [])
            .map(ch => ch?.chapter_title || ch?.chapterTitle || ch?.title || ch?.name || ch?.chapter_name || '')
            .filter(Boolean)
            .join(', ');

        try {
            toast.loading('Generating quiz… this usually takes ~15 seconds');
            await axios.post('/api/study-type-content', {
                courseId,
                type: 'quiz',
                chapters,
                topic: course?.topic || ''
            });
            toast.dismiss();
            toast.success('Quiz generated! 🎉');
            // Reset interaction state, then reload
            resetQuizState();
            await fetchQuiz();
        } catch (err) {
            toast.dismiss();
            const msg = err?.response?.data?.error ?? 'Generation failed. Please try again.';
            toast.error(msg);
            console.error('[Quiz] Generate error:', err);
            setLoadState('failed');
        } finally {
            setGenerating(false);
        }
    };

    const resetQuizState = () => {
        setCurrentIndex(0);
        setUserAnswers([]);
        setShowResults(false);
    };

    const handleSelectAnswer = (answer) => {
        if (userAnswers[currentIndex] !== undefined) return;
        const updated = [...userAnswers];
        updated[currentIndex] = answer;
        setUserAnswers(updated);
    };

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(i => i + 1);
        } else {
            setShowResults(true);
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) setCurrentIndex(i => i - 1);
    };

    // ── Render states ─────────────────────────────────────────────────────────

    if (loadState === 'loading') {
        return (
            <div className='flex flex-col items-center justify-center min-h-[60vh] gap-4'>
                <Loader2 className='w-10 h-10 text-indigo-400 animate-spin' />
                <p className='text-slate-400 text-sm font-medium'>Loading quiz…</p>
            </div>
        );
    }

    if (loadState === 'generating') {
        return (
            <div className='flex flex-col items-center justify-center min-h-[60vh] gap-5'>
                <div className='w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center'>
                    <RefreshCw className='w-8 h-8 text-amber-400 animate-spin' />
                </div>
                <div className='text-center'>
                    <h2 className='text-xl font-bold text-white mb-1'>Generating Quiz</h2>
                    <p className='text-slate-400 text-sm'>AI is crafting 15 questions for you — hang tight</p>
                </div>
                <div className='w-48'>
                    <Progress className='h-1.5 bg-slate-800 [&>div]:bg-amber-400 [&>div]:animate-pulse' value={65} />
                </div>
            </div>
        );
    }

    if (loadState === 'error') {
        return (
            <div className='flex flex-col items-center justify-center min-h-[60vh] gap-4 p-10'>
                <div className='w-16 h-16 rounded-2xl bg-red-500/15 border border-red-500/25 flex items-center justify-center'>
                    <AlertCircle className='w-8 h-8 text-red-400' />
                </div>
                <h2 className='text-xl font-bold text-white'>Connection Error</h2>
                <p className='text-slate-400 text-sm text-center max-w-xs'>
                    Could not load the quiz. Check your connection and try again.
                </p>
                <Button onClick={fetchQuiz} className='bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl'>
                    Try Again
                </Button>
            </div>
        );
    }

    if (loadState === 'failed') {
        return (
            <div className='p-6 md:p-10 max-w-4xl mx-auto'>
                <QuizHeader courseId={courseId} />
                <div className='flex flex-col items-center justify-center min-h-[40vh] gap-5 p-10 mt-4 border border-red-700/40 rounded-2xl bg-slate-800 shadow-[4px_4px_0_0_rgba(15,23,42,1)]'>
                    <div className='w-16 h-16 rounded-2xl bg-red-500/15 border border-red-500/25 flex items-center justify-center'>
                        <AlertCircle className='w-8 h-8 text-red-400' />
                    </div>
                    <div className='text-center'>
                        <h2 className='text-xl font-bold text-white mb-2'>Generation Failed</h2>
                        <p className='text-slate-400 text-sm max-w-xs leading-relaxed'>
                            The AI could not produce valid quiz questions. Try regenerating — it usually succeeds on the next attempt.
                        </p>
                    </div>
                    <Button
                        onClick={GenerateQuiz}
                        disabled={generating || !course}
                        className='bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl border border-indigo-700 px-6 py-2.5 shadow-md'
                    >
                        {generating
                            ? <><Loader2 className='w-4 h-4 mr-2 animate-spin' />Generating…</>
                            : <><RefreshCw className='w-4 h-4 mr-2' />Try Again</>
                        }
                    </Button>
                </div>
            </div>
        );
    }

    if (loadState === 'empty') {
        return (
            <div className='p-6 md:p-10 max-w-4xl mx-auto'>
                <QuizHeader courseId={courseId} />
                <div className='flex flex-col items-center justify-center min-h-[40vh] gap-5 p-10 mt-4 border border-slate-700/60 rounded-2xl bg-slate-800 shadow-[4px_4px_0_0_rgba(15,23,42,1)]'>
                    <div className='w-16 h-16 rounded-2xl bg-slate-700 border border-slate-600/60 flex items-center justify-center'>
                        <HelpCircle className='w-8 h-8 text-slate-500' />
                    </div>
                    <div className='text-center'>
                        <h2 className='text-xl font-bold text-white mb-2'>No Quiz Yet</h2>
                        <p className='text-slate-400 text-sm max-w-sm leading-relaxed'>
                            Generate an AI quiz with up to 15 questions to test your understanding of this course.
                        </p>
                    </div>
                    <Button
                        onClick={GenerateQuiz}
                        disabled={generating || !course}
                        className='bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl border border-indigo-700 px-6 py-2.5 shadow-md transition-all'
                    >
                        {generating
                            ? <><Loader2 className='w-4 h-4 mr-2 animate-spin' />Generating…</>
                            : <><Plus className='w-4 h-4 mr-2' />Generate Quiz</>
                        }
                    </Button>
                </div>
            </div>
        );
    }

    // ── Ready ─────────────────────────────────────────────────────────────────
    const questions = Array.isArray(quizData?.content) ? quizData.content : [];

    if (showResults) {
        return (
            <div className='p-6 md:p-10 max-w-4xl mx-auto'>
                <QuizHeader courseId={courseId} extra={
                    <div className='flex items-center gap-1 text-sm font-bold text-slate-400'>
                        <Trophy className='w-4 h-4 text-amber-400' />
                        Results
                    </div>
                } />
                <ResultsScreen
                    questions={questions}
                    userAnswers={userAnswers}
                    onRestart={resetQuizState}
                    onRegenerate={GenerateQuiz}
                    canRegenerate={!!course}
                />
            </div>
        );
    }

    const q = questions[currentIndex];
    const selectedAnswer = userAnswers[currentIndex];
    const answered = selectedAnswer !== undefined;
    const progressPct = ((currentIndex + 1) / questions.length) * 100;
    const answeredCount = userAnswers.filter(a => a !== undefined).length;
    const isLastQuestion = currentIndex === questions.length - 1;

    return (
        <div className='p-6 md:p-10 max-w-4xl mx-auto'>
            <QuizHeader courseId={courseId} extra={
                <div className='flex items-center gap-2 text-sm font-bold'>
                    <span className='text-slate-400'>{answeredCount}</span>
                    <span className='text-slate-600'>/</span>
                    <span className='text-white'>{questions.length} answered</span>
                </div>
            } />

            {/* Progress */}
            <div className='mb-2 flex items-center justify-between text-xs font-bold text-slate-500'>
                <span>Question {currentIndex + 1} of {questions.length}</span>
                <span>{Math.round(progressPct)}%</span>
            </div>
            <Progress
                value={progressPct}
                className='h-2 mb-8 bg-slate-800 border border-slate-700 [&>div]:bg-indigo-500 [&>div]:transition-all [&>div]:duration-500 [&>div]:rounded-full'
            />

            {/* Question card */}
            <div className='border border-slate-700/60 bg-slate-800 rounded-2xl p-6 md:p-8 shadow-[4px_4px_0_0_rgba(15,23,42,1)] mb-6'>
                <div className='flex items-start gap-4 mb-8'>
                    <span className='shrink-0 w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 text-sm font-black'>
                        {currentIndex + 1}
                    </span>
                    <h3 className='text-lg md:text-xl font-bold text-white leading-relaxed pt-1'>
                        {q?.question}
                    </h3>
                </div>

                {/* Options */}
                <div className='flex flex-col gap-3'>
                    {(q?.options ?? []).map((option, idx) => {
                        const isSelected = selectedAnswer === option;
                        const isCorrect = answered && option === q.correctAnswer;
                        const isWrong = answered && isSelected && option !== q.correctAnswer;
                        const isDimmed = answered && !isCorrect && !isSelected;

                        return (
                            <OptionChip
                                key={idx}
                                label={LABELS[idx]}
                                text={option}
                                correct={isCorrect}
                                incorrect={isWrong}
                                disabled={isDimmed || answered}
                                onClick={() => !answered && handleSelectAnswer(option)}
                            />
                        );
                    })}
                </div>

                {/* Explanation */}
                {answered && q?.explanation && (
                    <div className='mt-6 p-4 rounded-xl bg-slate-900/60 border border-slate-700/50'>
                        <p className='text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1'>
                            Explanation
                        </p>
                        <p className='text-sm text-slate-300 leading-relaxed'>{q.explanation}</p>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <div className='flex items-center justify-between gap-4'>
                <Button
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                    variant='outline'
                    className='border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white rounded-xl font-bold shadow-[4px_4px_0_0_rgba(15,23,42,1)] hover:shadow-[2px_2px_0_0_rgba(15,23,42,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0'
                >
                    <ChevronLeft className='w-4 h-4 mr-1' />
                    Previous
                </Button>

                {!answered ? (
                    <p className='text-slate-500 text-xs font-medium text-center'>Select an answer to continue</p>
                ) : (
                    <p className='text-xs font-bold text-center'>
                        {selectedAnswer === q.correctAnswer
                            ? <span className='text-emerald-400'>✓ Correct!</span>
                            : <span className='text-red-400'>✗ Incorrect</span>
                        }
                    </p>
                )}

                <Button
                    onClick={handleNext}
                    disabled={!answered}
                    className='bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl border border-indigo-700 shadow-[4px_4px_0_0_rgba(15,23,42,1)] hover:shadow-[2px_2px_0_0_rgba(15,23,42,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0'
                >
                    {isLastQuestion
                        ? <><Trophy className='w-4 h-4 mr-1' />See Results</>
                        : <>Next <ChevronRight className='w-4 h-4 ml-1' /></>
                    }
                </Button>
            </div>
        </div>
    );
}

export default Quiz