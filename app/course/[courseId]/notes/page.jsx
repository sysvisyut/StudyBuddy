"use client";
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, BookOpen, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function ViewNotes() {
    const { courseId } = useParams();
    const [notes, setNotes] = useState([]);
    const [stepCount, setStepCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const router = useRouter();

    useEffect(() => {
        if (courseId) {
            GetNotes();
        }
    }, [courseId]);

    const GetNotes = async () => {
        setLoading(true);
        try {
            const result = await axios.post('/api/study-type', {
                courseId: courseId,
                studyType: 'NOTES',
            });
            setNotes(result?.data || []);
        } catch (error) {
            console.error('Failed to fetch notes:', error.message);
        } finally {
            setLoading(false);
        }
    };

    const Previous = () => {
        setStepCount((prev) => Math.max(0, prev - 1));
    };

    const Next = () => {
        setStepCount((prev) => Math.min(notes.length - 1, prev + 1));
    };

    if (loading) {
        return (
            <div className='flex flex-col items-center justify-center min-h-[60vh] gap-4'>
                <Loader2 className='w-10 h-10 text-indigo-400 animate-spin' />
                <p className='text-slate-400 text-sm font-medium'>Loading notes...</p>
            </div>
        );
    }

    if (notes.length === 0) {
        return (
            <div className='flex flex-col items-center justify-center min-h-[60vh] gap-4 p-10'>
                <div className='w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700/60 flex items-center justify-center'>
                    <BookOpen className='w-8 h-8 text-slate-500' />
                </div>
                <h2 className='text-xl font-bold text-white'>No Notes Yet</h2>
                <p className='text-slate-400 text-sm text-center max-w-xs'>
                    Notes haven&apos;t been generated for this course yet. Check back soon!
                </p>
            </div>
        );
    }

    const currentNote = notes[stepCount];

    return (
        <div className='p-6 md:p-10 max-w-4xl mx-auto'>

            {/* Header */}
            <div className='mb-4'>
                <Link href={`/course/${courseId}`}>
                    <Button variant="outline" className="border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white rounded-full">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Course
                    </Button>
                </Link>
            </div>
            
            <div className='mb-6'>
                <div className='flex items-center gap-2 mb-1'>
                    <BookOpen className='w-5 h-5 text-indigo-400' />
                    <h1 className='text-xl font-bold text-white'>Notes</h1>
                </div>
                <p className='text-slate-400 text-sm'>
                    Chapter {stepCount + 1} of {notes.length}
                </p>
            </div>

            {/* Note content card */}
            {currentNote && (
                <div className='border border-slate-700/60 rounded-2xl bg-slate-800 shadow-[4px_4px_0_0_rgba(15,23,42,1)] overflow-hidden'>
                    {/* Chapter label */}
                    <div className='flex items-center justify-between px-6 py-4 border-b border-slate-700/60 bg-slate-800/80'>
                        <div className='flex items-center gap-2'>
                            <span className='w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 text-xs font-black'>
                                {currentNote.chapterId + 1}
                            </span>
                            <h2 className='text-sm font-bold text-slate-300 uppercase tracking-widest'>
                                Chapter {currentNote.chapterId + 1}
                            </h2>
                        </div>
                        <span className='text-[10px] font-bold text-indigo-300 bg-indigo-500/15 border border-indigo-500/25 px-2.5 py-1 rounded-full uppercase tracking-widest'>
                            Notes
                        </span>
                    </div>

                    {/* HTML content */}
                    <div
                        className='px-6 py-6 text-slate-200 leading-relaxed prose-notes'
                        dangerouslySetInnerHTML={{ __html: currentNote.notes }}
                    />
                </div>
            )}

            {/* Progress bar + navigation */}
            <div className='flex gap-3 items-center mt-8'>
                <Button
                    variant='outline'
                    size='sm'
                    onClick={Previous}
                    disabled={stepCount === 0}
                    className='flex items-center gap-1.5 border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all'
                >
                    <ChevronLeft className='w-4 h-4' />
                    Prev
                </Button>

                <div className='flex flex-1 gap-1.5 items-center'>
                    {notes.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setStepCount(index)}
                            className={`flex-1 h-2 rounded-full transition-all duration-300 cursor-pointer ${
                                index < stepCount
                                    ? 'bg-indigo-500'
                                    : index === stepCount
                                    ? 'bg-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.6)]'
                                    : 'bg-slate-700'
                            }`}
                            title={`Chapter ${index + 1}`}
                        />
                    ))}
                </div>

                <Button
                    variant='outline'
                    size='sm'
                    onClick={Next}
                    disabled={stepCount === notes.length - 1}
                    className='flex items-center gap-1.5 border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all'
                >
                    Next
                    <ChevronRight className='w-4 h-4' />
                </Button>
            </div>

            {/* End-of-notes message */}
            {stepCount === notes.length - 1 && (
                <div className='mt-6 flex flex-col items-center gap-3 py-6 border border-dashed border-slate-700/60 rounded-2xl text-center'>
                    <span className='text-2xl'>🎉</span>
                    <h3 className='text-base font-bold text-white'>You&apos;ve reached the end!</h3>
                    <p className='text-slate-400 text-sm'>You&apos;ve reviewed all the notes for this course.</p>
                    <Button onClick={() => router.back()}>Go to course page</Button>
                </div>
            )}
        </div>
    );
}

export default ViewNotes;