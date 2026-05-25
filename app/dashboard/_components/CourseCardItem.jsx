import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { RefreshCw, BookOpen } from 'lucide-react'

function CourseCardItem({ course }) {
  const isReady = course?.status === 'Ready';
  const isGenerating = course?.status === 'Generating';

  return (
    <div className='border-[3px] border-slate-700/60 rounded-2xl p-4 bg-slate-800 hover:scale-105 transition-all shadow-[4px_4px_0_0_rgba(15,23,42,1)] hover:shadow-[6px_6px_0_0_rgba(15,23,42,1)] flex flex-col'>
        <div className='flex-1'>
            <div className='flex justify-between items-center'>
                <Image src={'/knowledge-new.png'} alt='knowledge' 
                width={75} height={75} className='mix-blend-screen -ml-2'/>
                <h2 className='text-[10px] p-1 px-3 rounded-full bg-slate-700 text-slate-300 font-black uppercase tracking-widest'>20 Mar</h2>
            </div>
            <div className='mt-4 flex items-center justify-between gap-3'>
                <h2 className='font-black text-xl text-white truncate'>{course?.topic || "New Topic"}</h2>
                <div className='flex items-center gap-2 shrink-0' title="75% Completed">
                    <div className='w-12 h-2.5 rounded-full bg-slate-900 border-2 border-slate-700 overflow-hidden'>
                        <div className='h-full bg-emerald-400 rounded-full' style={{ width: '75%' }}></div>
                    </div>
                </div>
            </div>
            <div className='flex items-center justify-between mt-1'>
                <p className='text-sm text-slate-400 line-clamp-1 font-medium'>{course?.courseType || "Standard Course"}</p>
                {isGenerating && (
                    <div className='flex items-center gap-1.5 text-[11px] font-bold text-slate-300 bg-slate-700/50 px-2 py-1 rounded-full shrink-0'>
                        <RefreshCw className='w-3 h-3 animate-spin text-indigo-400' />
                        Generating...
                    </div>
                )}
                {isReady && (
                    <div className='flex items-center gap-1.5 text-[11px] font-bold text-emerald-300 bg-emerald-700/30 px-2 py-1 rounded-full shrink-0'>
                        <span className='w-2 h-2 rounded-full bg-emerald-400 animate-pulse'></span>
                        Ready
                    </div>
                )}
            </div>
        </div>

        {/* Open Button — only shown when course is Ready */}
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
  )
}

export default CourseCardItem