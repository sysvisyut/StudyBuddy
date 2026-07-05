"use client"
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'
import axios from 'axios'
import FlashcardItem from './Flashcarditem'
import { Loader2, Zap, Plus, AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel"
import Link from 'next/link'

// ── Polling config ────────────────────────────────────────────────────────────
const POLL_INTERVAL_MS = 4000;
const MAX_POLL_ATTEMPTS = 30; // stop after 2 minutes

function Flashcards() {
    const { courseId } = useParams();

    const [flashCards, setFlashCards] = useState(null);
    const [api, setApi] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [resetKey, setResetKey] = useState(0);
    const [loadState, setLoadState] = useState('loading'); // 'loading' | 'generating' | 'ready' | 'empty' | 'failed' | 'error'
    const [generating, setGenerating] = useState(false);
    const [course, setCourse] = useState(null);

    const pollRef = useRef(null);
    const pollAttempts = useRef(0);

    // ── Carousel slide listener ───────────────────────────────────────────────
    useEffect(() => {
        if (!api) return;
        const onSelect = () => {
            setCurrentIndex(api.selectedScrollSnap());
            setResetKey(k => k + 1);
        };
        api.on('select', onSelect);
        return () => api.off('select', onSelect);
    }, [api]);

    // ── Initial data load ─────────────────────────────────────────────────────
    useEffect(() => {
        if (courseId) {
            fetchFlashCards();
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
        if (pollRef.current) return; // already running
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
                    studyType: 'flashcard',
                });
                const data = result?.data;
                if (!data) return;

                if (data.status === 'Ready') {
                    stopPolling();
                    setFlashCards(data);
                    setLoadState(data.content?.length > 0 ? 'ready' : 'empty');
                } else if (data.status === 'Failed') {
                    stopPolling();
                    setFlashCards(null);
                    setLoadState('failed');
                }
                // If still 'Generating', keep polling
            } catch (err) {
                console.warn('[Flashcards] Polling error:', err.message);
                // Don't stop on transient network errors
            }
        }, POLL_INTERVAL_MS);
    }, [courseId]);

    const fetchFlashCards = async () => {
        setLoadState('loading');
        try {
            const result = await axios.post('/api/study-type', {
                courseId,
                studyType: 'flashcard',
            });
            const data = result?.data;

            if (!data) {
                setLoadState('empty');
                return;
            }

            setFlashCards(data);

            if (data.status === 'Ready') {
                setLoadState(data.content?.length > 0 ? 'ready' : 'empty');
            } else if (data.status === 'Generating') {
                setLoadState('generating');
                startPolling();
            } else if (data.status === 'Failed') {
                setLoadState('failed');
            } else {
                // null row — nothing generated yet
                setLoadState('empty');
            }
        } catch (err) {
            console.error('[Flashcards] Fetch error:', err);
            setLoadState('error');
        }
    };

    const fetchCourse = async () => {
        try {
            const result = await axios.get(`/api/courses?courseId=${courseId}`);
            setCourse(result?.data?.result);
        } catch (err) {
            console.warn('[Flashcards] Course fetch error:', err.message);
        }
    };

    const GenerateFlashcards = async () => {
        if (!course) return;
        setGenerating(true);

        const chapters = (course?.courseLayout?.chapters ?? [])
            .map(ch => ch?.chapter_title || ch?.chapterTitle || ch?.title || ch?.name || ch?.chapter_name || '')
            .filter(Boolean)
            .join(', ');

        try {
            toast.loading('Generating flashcards… this usually takes ~10 seconds');
            await axios.post('/api/study-type-content', {
                courseId,
                type: 'flashcard',
                chapters,
                topic: course?.topic || ''
            });
            toast.dismiss();
            toast.success('Flashcards generated! 🎉');
            await fetchFlashCards();
        } catch (err) {
            toast.dismiss();
            const msg = err?.response?.data?.error ?? 'Generation failed. Please try again.';
            toast.error(msg);
            console.error('[Flashcards] Generate error:', err);
            setLoadState('failed');
        } finally {
            setGenerating(false);
        }
    };

    // ── Render states ─────────────────────────────────────────────────────────

    if (loadState === 'loading') {
        return (
            <div className='flex flex-col items-center justify-center min-h-[60vh] gap-4'>
                <Loader2 className='w-10 h-10 text-indigo-400 animate-spin' />
                <p className='text-slate-400 text-sm font-medium'>Loading flashcards…</p>
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
                    <h2 className='text-xl font-bold text-white mb-1'>Generating Flashcards</h2>
                    <p className='text-slate-400 text-sm'>AI is crafting your cards — this takes about 15 seconds</p>
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
                    Could not load flashcards. Check your connection and try again.
                </p>
                <Button onClick={fetchFlashCards} className='bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl'>
                    Try Again
                </Button>
            </div>
        );
    }

    if (loadState === 'failed') {
        return (
            <div className='p-6 md:p-10 max-w-4xl mx-auto'>
                <PageHeader courseId={courseId} />
                <div className='flex flex-col items-center justify-center min-h-[40vh] gap-5 p-10 mt-4 border border-red-700/40 rounded-2xl bg-slate-800 shadow-[4px_4px_0_0_rgba(15,23,42,1)]'>
                    <div className='w-16 h-16 rounded-2xl bg-red-500/15 border border-red-500/25 flex items-center justify-center'>
                        <AlertCircle className='w-8 h-8 text-red-400' />
                    </div>
                    <div className='text-center'>
                        <h2 className='text-xl font-bold text-white mb-2'>Generation Failed</h2>
                        <p className='text-slate-400 text-sm max-w-xs leading-relaxed'>
                            The AI could not produce valid flashcards. Try regenerating — it usually works on the next attempt.
                        </p>
                    </div>
                    <Button
                        onClick={GenerateFlashcards}
                        disabled={generating || !course}
                        className='bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl border border-indigo-700 px-6 py-2.5 shadow-md transition-all'
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
                <PageHeader courseId={courseId} />
                <EmptyState
                    generating={generating}
                    canGenerate={!!course}
                    onGenerate={GenerateFlashcards}
                />
            </div>
        );
    }

    // ── Ready: show carousel ──────────────────────────────────────────────────
    const cards = flashCards?.content ?? [];
    const progressPct = cards.length > 0 ? ((currentIndex + 1) / cards.length) * 100 : 0;

    return (
        <div className='p-6 md:p-10 max-w-4xl mx-auto'>
            <PageHeader courseId={courseId} />

            {/* Card counter + progress */}
            <div className='mb-2 flex items-center justify-between text-xs font-bold text-slate-500 mt-6'>
                <span>Card {currentIndex + 1} of {cards.length}</span>
                <span>{Math.round(progressPct)}%</span>
            </div>
            <Progress
                value={progressPct}
                className='h-1.5 mb-8 bg-slate-800 border border-slate-700/50 [&>div]:bg-indigo-500 [&>div]:transition-all [&>div]:duration-500 [&>div]:rounded-full'
            />

            <div className='flex items-center justify-center w-full'>
                <Carousel setApi={setApi} className='w-full max-w-xl'>
                    <CarouselContent>
                        {cards.map((flashcard, index) => (
                            <CarouselItem key={index} className='flex items-center justify-center p-2'>
                                <FlashcardItem
                                    flashcard={flashcard}
                                    resetKey={resetKey}
                                />
                            </CarouselItem>
                        ))}
                    </CarouselContent>

                    <div className='flex justify-center gap-6 mt-10'>
                        <CarouselPrevious className='static transform-none border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 shadow-[4px_4px_0_0_rgba(15,23,42,1)] hover:shadow-[2px_2px_0_0_rgba(15,23,42,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all h-10 w-10 flex items-center justify-center rounded-xl' />
                        <CarouselNext className='static transform-none border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 shadow-[4px_4px_0_0_rgba(15,23,42,1)] hover:shadow-[2px_2px_0_0_rgba(15,23,42,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all h-10 w-10 flex items-center justify-center rounded-xl' />
                    </div>
                </Carousel>
            </div>

            {/* Regenerate button */}
            <div className='flex justify-center mt-10'>
                <Button
                    variant='ghost'
                    size='sm'
                    disabled={generating || !course}
                    onClick={GenerateFlashcards}
                    className='text-slate-500 hover:text-slate-300 text-xs gap-1.5'
                >
                    <RefreshCw className='w-3 h-3' />
                    Regenerate
                </Button>
            </div>
        </div>
    );
}

// ── Shared sub-components ─────────────────────────────────────────────────────

function PageHeader({ courseId }) {
    return (
        <div>
            <div className='mb-4'>
                <Link href={`/course/${courseId}`}>
                    <Button variant="outline" className="border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white rounded-full">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Course
                    </Button>
                </Link>
            </div>
            <div className='mb-6 flex items-center gap-3'>
                <div className='w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center'>
                    <Zap className='w-6 h-6 text-indigo-400' />
                </div>
                <div>
                    <h2 className='font-black text-2xl text-white'>Flashcards</h2>
                    <p className='text-slate-400 text-sm mt-0.5'>The Ultimate Tool to Lock in Concepts</p>
                </div>
            </div>
        </div>
    );
}

function EmptyState({ generating, canGenerate, onGenerate }) {
    return (
        <div className='flex flex-col items-center justify-center min-h-[40vh] gap-5 p-10 mt-4 border border-slate-700/60 rounded-2xl bg-slate-800 shadow-[4px_4px_0_0_rgba(15,23,42,1)]'>
            <div className='w-16 h-16 rounded-2xl bg-slate-700 border border-slate-600/60 flex items-center justify-center'>
                <Zap className='w-8 h-8 text-slate-500' />
            </div>
            <div className='text-center'>
                <h2 className='text-xl font-bold text-white mb-2'>No Flashcards Yet</h2>
                <p className='text-slate-400 text-sm max-w-xs leading-relaxed'>
                    Generate AI-powered flashcards for this course to start studying smarter.
                </p>
            </div>
            <Button
                onClick={onGenerate}
                disabled={generating || !canGenerate}
                className='bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl border border-indigo-700 px-6 py-2.5 shadow-md transition-all'
            >
                {generating
                    ? <><Loader2 className='w-4 h-4 mr-2 animate-spin' />Generating…</>
                    : <><Plus className='w-4 h-4 mr-2' />Generate Flashcards</>
                }
            </Button>
        </div>
    );
}

export default Flashcards