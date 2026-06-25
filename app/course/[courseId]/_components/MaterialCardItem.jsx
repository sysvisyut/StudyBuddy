import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import axios from 'axios'
import { toast } from 'sonner'

function MaterialCardItem({ item, studyTypeContent, course,refreshData}) {

    const [loading,setLoading]=useState(false);
    

    const GenerateContent=async()=>{

        setLoading(true);
        let chapters = '';
        course?.courseLayout.chapters.forEach((chapter)=>{

            chapters = (chapter.chapter_title||chapter.chapterTitle)+', '+chapters
        })

        const result = await axios.post('/api/study-type-content',{
            courseId:course?.courseId,
            type:item.value,
            chapters: chapters
        });
        setLoading(false);
        refreshData(true)
        toast('Your Flashcard has been generated successfully')
    }
    return (
        <Link href={item.path}>
            <div className={`group relative border border-slate-700/60 bg-gradient-to-br ${item.color || 'from-slate-700/20 to-slate-800/10'} rounded-2xl p-5 flex flex-col items-center gap-3 cursor-pointer hover:scale-105 hover:border-slate-500/80 transition-all duration-200 shadow-md hover:shadow-xl overflow-hidden`}>
                {/* Glow effect */}
                <div className='absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/[0.02] rounded-2xl' />
                
                {/* Status badge */}
                <div className='self-start flex items-center gap-1.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-500/30'>
                    <span className='w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse'></span>
                    Ready
                </div>

                {/* Icon */}
                <div className={`${item.iconBg || 'bg-slate-700/40'} p-3 rounded-2xl mt-1`}>
                    <Image src={item.icon} alt={item.name} width={40} height={40} />
                </div>

                {/* Text */}
                <h2 className='text-base font-bold text-white text-center leading-tight'>{item.name}</h2>
                <p className='text-xs text-slate-400 text-center line-clamp-2 leading-relaxed'>{item.desc}</p>

                {/* CTA */}
                <div className='mt-2 flex items-center gap-1.5 text-xs font-bold text-slate-300 group-hover:text-white transition-colors'>
                    Open
                    <ArrowRight className='w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-200' />
                </div>
            </div>
        </Link>
    )
}

export default MaterialCardItem