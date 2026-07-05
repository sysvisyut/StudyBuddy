import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, RefreshCw, Plus } from 'lucide-react'
import axios from 'axios'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

function MaterialCardItem({ item, studyTypeContent, course, refreshData }) {
    const [loading, setLoading] = useState(false);

    // ── Determine status ───────────────────────────────────────────────────────
    const isNotes = item.type === 'notes';
    // studyTypeContent keys are now always lowercase (normalized server-side)
    const contentList = studyTypeContent?.[item.type];

    let status = 'Not Generated';
    if (isNotes) {
        status = 'Ready';
    } else if (item.type === null) {
        // Items with null type (e.g. "Record and Learn") have no generation flow
        status = 'Not Generated';
    } else if (contentList && contentList.length > 0) {
        status = contentList[0].status; // 'Generating' | 'Ready' | 'Failed'
    }

    // ── Generate handler ───────────────────────────────────────────────────────
    const GenerateContent = async () => {
        setLoading(true);

        // Build topic string from all chapter titles — append order (not prepend)
        const chapters = (course?.courseLayout?.chapters ?? [])
            .map((ch) => ch?.chapter_title || ch?.chapterTitle || ch?.title || ch?.name || ch?.chapter_name || '')
            .filter(Boolean)
            .join(', ');

        try {
            toast.loading(`Generating ${item.name}… this may take ~20 seconds`);
            await axios.post('/api/study-type-content', {
                courseId: course?.courseId,
                type: item.type,   // already lowercase from MaterialList
                chapters,
                topic: course?.topic || ''
            });
            toast.dismiss();
            toast.success(`${item.name} generated successfully! 🎉`);
            refreshData();
        } catch (err) {
            toast.dismiss();
            const msg = err?.response?.data?.error ?? 'Generation failed. Please try again.';
            toast.error(msg);
            console.error('[MaterialCardItem] Generate error:', err);
        } finally {
            setLoading(false);
        }
    };

    // ── Card body ──────────────────────────────────────────────────────────────
    const isBusy = status === 'Generating' || loading;
    const canGenerate = item.type !== null && !isNotes;

    const cardContent = (
        <div
            className={`group relative border-[3px] ${
                status === 'Ready'
                    ? 'border-slate-700/60 hover:border-indigo-500/50'
                    : status === 'Generating'
                    ? 'border-amber-500/40'
                    : 'border-slate-700/60'
            } bg-slate-800 rounded-2xl p-5 flex flex-col items-center gap-3 transition-all duration-200 shadow-[4px_4px_0_0_rgba(15,23,42,1)] hover:shadow-[6px_6px_0_0_rgba(15,23,42,1)] overflow-hidden h-full flex-1`}
        >
            {/* Hover glow */}
            <div className='absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/[0.02] rounded-2xl pointer-events-none' />

            {/* Status badge */}
            {status === 'Not Generated' && canGenerate && (
                <div className='self-start flex items-center gap-1.5 bg-slate-500/20 text-slate-400 text-[10px] font-bold px-2.5 py-1 rounded-full border border-slate-500/30'>
                    Not Generated
                </div>
            )}
            {status === 'Generating' && (
                <div className='self-start flex items-center gap-1.5 bg-amber-500/20 text-amber-400 text-[10px] font-bold px-2.5 py-1 rounded-full border border-amber-500/30'>
                    <RefreshCw className='w-3 h-3 animate-spin' />
                    Generating…
                </div>
            )}
            {status === 'Failed' && (
                <div className='self-start flex items-center gap-1.5 bg-red-500/20 text-red-400 text-[10px] font-bold px-2.5 py-1 rounded-full border border-red-500/30'>
                    Failed — Retry
                </div>
            )}
            {status === 'Ready' && (
                <div className='self-start flex items-center gap-1.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-500/30'>
                    <span className='w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse' />
                    Ready
                </div>
            )}

            {/* Icon */}
            <div className={`${item.iconBg || 'bg-slate-700/40'} p-3 rounded-2xl mt-1 border border-slate-700/50 flex items-center justify-center`}>
                {typeof item.icon === 'string' ? (
                    <Image src={item.icon} alt={item.name} width={40} height={40} className='drop-shadow-md' />
                ) : (
                    item.icon
                )}
            </div>

            {/* Text */}
            <h2 className='text-base font-black text-white text-center leading-tight mt-1'>{item.name}</h2>
            <p className='text-xs text-slate-400 text-center line-clamp-2 leading-relaxed flex-1'>{item.desc}</p>

            {/* Action button */}
            <div className='mt-3 w-full'>
                {status === 'Ready' ? (
                    <Button className='w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl border border-indigo-700 shadow-md group-hover:shadow-lg transition-all'>
                        Open
                        <ArrowRight className='w-4 h-4 ml-1.5 group-hover:translate-x-1 transition-transform' />
                    </Button>
                ) : isBusy ? (
                    <Button disabled className='w-full bg-slate-700 text-slate-400 font-bold rounded-xl border border-slate-600'>
                        <RefreshCw className='w-4 h-4 mr-2 animate-spin' />
                        Generating…
                    </Button>
                ) : canGenerate ? (
                    <Button
                        onClick={(e) => {
                            e.preventDefault();
                            GenerateContent();
                        }}
                        className='w-full bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl border border-slate-600 shadow-md transition-colors'
                    >
                        <Plus className='w-4 h-4 mr-2' />
                        {status === 'Failed' ? 'Retry' : 'Generate'}
                    </Button>
                ) : (
                    /* null-type cards like "Record and Learn" */
                    <Button disabled className='w-full bg-slate-700/50 text-slate-500 font-bold rounded-xl border border-slate-700/30'>
                        Coming Soon
                    </Button>
                )}
            </div>
        </div>
    );

    if (status === 'Ready' && item.path) {
        return (
            <Link href={item.path} className='flex flex-col h-full w-full'>
                {cardContent}
            </Link>
        );
    }

    return (
        <div className='flex flex-col h-full w-full'>
            {cardContent}
        </div>
    );
}

export default MaterialCardItem