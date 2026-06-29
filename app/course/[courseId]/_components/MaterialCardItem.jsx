import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, RefreshCw, Plus } from 'lucide-react'
import axios from 'axios'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

function MaterialCardItem({ item, studyTypeContent, course, refreshData }) {
    const [loading, setLoading] = useState(false);
    
    // Check generation status
    const isNotes = item.type === 'notes';
    const contentList = studyTypeContent?.[item.type];
    
    let status = 'Not Generated';
    if (isNotes) {
        status = 'Ready';
    } else if (contentList && contentList.length > 0) {
        status = contentList[0].status; // 'Generating' or 'Ready'
    }

    const GenerateContent = async () => {
        setLoading(true);
        let chapters = '';
        course?.courseLayout?.chapters?.forEach((chapter) => {
            chapters = (chapter.chapter_title || chapter.chapterTitle) + ', ' + chapters;
        });

        try {
            toast.loading('Generating ' + item.name + '... this may take ~15 seconds');
            await axios.post('/api/study-type-content', {
                courseId: course?.courseId,
                type: item.type,
                chapters: chapters
            });
            toast.dismiss();
            toast.success(item.name + ' generated successfully! 🎉');
            refreshData();
        } catch (e) {
            toast.dismiss();
            console.error("Failed to generate content:", e);
            toast.error("Generation failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Card UI
    const cardContent = (
        <div className={`group relative border-[3px] border-slate-700/60 bg-slate-800 rounded-2xl p-5 flex flex-col items-center gap-3 cursor-pointer hover:scale-[1.02] hover:border-slate-500/80 transition-all duration-200 shadow-[4px_4px_0_0_rgba(15,23,42,1)] hover:shadow-[6px_6px_0_0_rgba(15,23,42,1)] overflow-hidden h-full flex-1`}>
            {/* Glow effect */}
            <div className='absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/[0.02] rounded-2xl pointer-events-none' />
            
            {/* Status badges */}
            {status === 'Not Generated' && (
                <div className='self-start flex items-center gap-1.5 bg-slate-500/20 text-slate-400 text-[10px] font-bold px-2.5 py-1 rounded-full border border-slate-500/30'>
                    Not Generated
                </div>
            )}
            {status === 'Generating' && (
                <div className='self-start flex items-center gap-1.5 bg-amber-500/20 text-amber-400 text-[10px] font-bold px-2.5 py-1 rounded-full border border-amber-500/30'>
                    <RefreshCw className='w-3 h-3 animate-spin' />
                    Generating...
                </div>
            )}
            {status === 'Ready' && (
                <div className='self-start flex items-center gap-1.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-500/30'>
                    <span className='w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse'></span>
                    Ready
                </div>
            )}

            {/* Icon */}
            <div className={`${item.iconBg || 'bg-slate-700/40'} p-3 rounded-2xl mt-1 border border-slate-700/50`}>
                <Image src={item.icon} alt={item.name} width={40} height={40} className="drop-shadow-md" />
            </div>

            {/* Text */}
            <h2 className='text-base font-black text-white text-center leading-tight mt-1'>{item.name}</h2>
            <p className='text-xs text-slate-400 text-center line-clamp-2 leading-relaxed flex-1'>{item.desc}</p>

            {/* Action Buttons */}
            <div className='mt-3 w-full'>
                {status === 'Ready' ? (
                    <Button className='w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl border border-indigo-700 shadow-md group-hover:shadow-lg transition-all'>
                        Open
                        <ArrowRight className='w-4 h-4 ml-1.5 group-hover:translate-x-1 transition-transform' />
                    </Button>
                ) : status === 'Generating' || loading ? (
                    <Button disabled className='w-full bg-slate-700 text-slate-400 font-bold rounded-xl border border-slate-600'>
                        <RefreshCw className='w-4 h-4 mr-2 animate-spin' />
                        Generating
                    </Button>
                ) : (
                    <Button 
                        onClick={(e) => {
                            e.preventDefault();
                            GenerateContent();
                        }}
                        className='w-full bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl border border-slate-600 shadow-md transition-colors'
                    >
                        <Plus className='w-4 h-4 mr-2' />
                        Generate
                    </Button>
                )}
            </div>
        </div>
    );

    // If ready, wrap in a link. Otherwise, it's just a div so the Generate button can be clicked without navigating.
    if (status === 'Ready') {
        return (
            <Link href={item.path} className="flex flex-col h-full w-full">
                {cardContent}
            </Link>
        );
    }

    return (
        <div className="flex flex-col h-full w-full">
            {cardContent}
        </div>
    );
}

export default MaterialCardItem