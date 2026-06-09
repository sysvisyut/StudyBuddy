'use client'
import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { RefreshCw, BookOpen, Trash2, AlertTriangle, X } from 'lucide-react'
import axios from 'axios'
import { toast } from 'sonner'

function DeleteConfirmModal({ courseName, onConfirm, onCancel, deleting }) {
    return (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
            {/* Backdrop */}
            <div
                className='absolute inset-0 bg-black/70 backdrop-blur-sm'
                onClick={onCancel}
            />
            {/* Modal */}
            <div className='relative w-full max-w-sm border border-red-500/30 bg-slate-900 rounded-2xl p-6 shadow-2xl shadow-red-900/30 animate-in fade-in slide-in-from-bottom-4 duration-200'>
                <button
                    onClick={onCancel}
                    className='absolute top-4 right-4 text-slate-500 hover:text-white transition-colors'
                >
                    <X className='w-4 h-4' />
                </button>

                <div className='flex flex-col items-center text-center gap-4'>
                    <div className='w-14 h-14 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center'>
                        <AlertTriangle className='w-7 h-7 text-red-400' />
                    </div>

                    <div>
                        <h3 className='font-black text-lg text-white'>Delete Course?</h3>
                        <p className='text-slate-400 text-sm mt-1 leading-relaxed'>
                            <span className='text-white font-semibold'>"{courseName}"</span> and all its notes will be permanently deleted. This cannot be undone.
                        </p>
                    </div>

                    <div className='flex gap-3 w-full mt-2'>
                        <button
                            onClick={onCancel}
                            disabled={deleting}
                            className='flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 font-bold text-sm hover:bg-slate-800 transition-all disabled:opacity-50'
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={deleting}
                            className='flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2'
                        >
                            {deleting ? (
                                <RefreshCw className='w-4 h-4 animate-spin' />
                            ) : (
                                <Trash2 className='w-4 h-4' />
                            )}
                            {deleting ? 'Deleting...' : 'Delete'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

function CourseCardItem({ course, onDelete }) {
    const isReady = course?.status === 'Ready';
    const isGenerating = course?.status === 'Generating';
    const [showConfirm, setShowConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const handleDeleteConfirm = async () => {
        setDeleting(true);
        try {
            await axios.delete(`/api/courses?courseId=${course.courseId}`);
            toast.success(`"${course.topic}" deleted successfully.`);
            setShowConfirm(false);
            onDelete?.(course.courseId);
        } catch (error) {
            toast.error('Failed to delete course. Please try again.');
            console.error('[Delete]', error.message);
        } finally {
            setDeleting(false);
        }
    };

    return (
        <>
            {showConfirm && (
                <DeleteConfirmModal
                    courseName={course?.topic}
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => !deleting && setShowConfirm(false)}
                    deleting={deleting}
                />
            )}

            <div className='border-[3px] border-slate-700/60 rounded-2xl p-4 bg-slate-800 hover:scale-105 transition-all shadow-[4px_4px_0_0_rgba(15,23,42,1)] hover:shadow-[6px_6px_0_0_rgba(15,23,42,1)] flex flex-col group'>
                <div className='flex-1'>
                    <div className='flex justify-between items-start'>
                        <Image
                            src={'/knowledge-new.png'}
                            alt='knowledge'
                            width={75}
                            height={75}
                            className='mix-blend-screen -ml-2'
                        />
                        <div className='flex items-center gap-2'>
                            <h2 className='text-[10px] p-1 px-3 rounded-full bg-slate-700 text-slate-300 font-black uppercase tracking-widest'>
                                20 Mar
                            </h2>
                            {/* Delete button — always visible on hover */}
                            <button
                                onClick={(e) => { e.preventDefault(); setShowConfirm(true); }}
                                title='Delete course'
                                className='opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg bg-red-500/15 border border-red-500/25 flex items-center justify-center text-red-400 hover:bg-red-500/30 hover:border-red-500/50 transition-all duration-200'
                            >
                                <Trash2 className='w-3.5 h-3.5' />
                            </button>
                        </div>
                    </div>

                    <div className='mt-4 flex items-center justify-between gap-3'>
                        <h2 className='font-black text-xl text-white truncate'>{course?.topic || 'New Topic'}</h2>
                        <div className='flex items-center gap-2 shrink-0' title='75% Completed'>
                            <div className='w-12 h-2.5 rounded-full bg-slate-900 border-2 border-slate-700 overflow-hidden'>
                                <div className='h-full bg-emerald-400 rounded-full' style={{ width: '75%' }} />
                            </div>
                        </div>
                    </div>

                    <div className='flex items-center justify-between mt-1'>
                        <p className='text-sm text-slate-400 line-clamp-1 font-medium'>{course?.courseType || 'Standard Course'}</p>
                        {isGenerating && (
                            <div className='flex items-center gap-1.5 text-[11px] font-bold text-slate-300 bg-slate-700/50 px-2 py-1 rounded-full shrink-0'>
                                <RefreshCw className='w-3 h-3 animate-spin text-indigo-400' />
                                Generating...
                            </div>
                        )}
                        {isReady && (
                            <div className='flex items-center gap-1.5 text-[11px] font-bold text-emerald-300 bg-emerald-700/30 px-2 py-1 rounded-full shrink-0'>
                                <span className='w-2 h-2 rounded-full bg-emerald-400 animate-pulse' />
                                Ready
                            </div>
                        )}
                    </div>
                </div>

                {/* Action buttons */}
                <div className='mt-4'>
                    {isReady ? (
                        <Link href={`/course/${course?.courseId}`}>
                            <button className='w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold text-sm py-2.5 rounded-xl transition-all duration-200 shadow-lg shadow-indigo-900/40 hover:shadow-indigo-700/50 cursor-pointer'>
                                <BookOpen className='w-4 h-4' />
                                Open Course
                            </button>
                        </Link>
                    ) : isGenerating ? (
                        <button disabled className='w-full flex items-center justify-center gap-2 bg-slate-700/50 text-slate-500 font-bold text-sm py-2.5 rounded-xl cursor-not-allowed'>
                            <RefreshCw className='w-4 h-4 animate-spin' />
                            Generating...
                        </button>
                    ) : null}
                </div>
            </div>
        </>
    )
}

export default CourseCardItem