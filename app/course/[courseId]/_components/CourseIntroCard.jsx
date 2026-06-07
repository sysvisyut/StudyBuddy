import React from 'react'
import Image from 'next/image'
import { BookOpen, Layers } from 'lucide-react'

function CourseIntroCard({ course }) {
    const chapters = course?.courseLayout?.chapters;

    return (
        <div className='flex flex-col sm:flex-row gap-5 items-start p-6 border border-slate-700/60 bg-slate-800 rounded-2xl shadow-[4px_4px_0_0_rgba(15,23,42,1)]'>
            <div className='shrink-0 w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center'>
                <Image src={'/knowledge.png'} alt='course' width={40} height={40} className='mix-blend-screen' />
            </div>
            <div className='flex-1 min-w-0'>
                <h1 className='font-black text-2xl text-white leading-tight mb-1'>
                    {course?.courseLayout?.course_title || 'Untitled Course'}
                </h1>
                <p className='text-slate-400 text-sm leading-relaxed line-clamp-3 mb-4'>
                    {course?.courseLayout?.summary || 'No summary available.'}
                </p>
                <div className='flex flex-wrap gap-3'>
                    <div className='flex items-center gap-1.5 text-xs font-bold text-indigo-300 bg-indigo-500/15 border border-indigo-500/25 px-3 py-1.5 rounded-full'>
                        <Layers className='w-3.5 h-3.5' />
                        {chapters?.length ?? 0} Chapters
                    </div>
                    <div className='flex items-center gap-1.5 text-xs font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-500/25 px-3 py-1.5 rounded-full'>
                        <span className='w-2 h-2 rounded-full bg-emerald-400 animate-pulse' />
                        {course?.status || 'Generating'}
                    </div>
                    {course?.difficultyLevel && (
                        <div className='flex items-center gap-1.5 text-xs font-bold text-amber-300 bg-amber-500/15 border border-amber-500/25 px-3 py-1.5 rounded-full'>
                            <BookOpen className='w-3.5 h-3.5' />
                            {course.difficultyLevel}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default CourseIntroCard