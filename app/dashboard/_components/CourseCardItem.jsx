import React from 'react'
import Image from 'next/image'
import { RefreshCw } from 'lucide-react'

function CourseCardItem({ course }) {
  return (
    <div className='border-[3px] border-slate-700/60 rounded-2xl p-4 bg-slate-800 hover:scale-105 transition-all cursor-pointer shadow-[4px_4px_0_0_rgba(15,23,42,1)] hover:shadow-[6px_6px_0_0_rgba(15,23,42,1)]'>
        <div>
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
                {course?.status === 'Generating' && (
                    <div className='flex items-center gap-1.5 text-[11px] font-bold text-slate-300 bg-slate-700/50 px-2 py-1 rounded-full shrink-0'>
                        <RefreshCw className='w-3 h-3 animate-spin text-indigo-400' />
                        Generating...
                    </div>
                )}
            </div>
        </div>
    </div>
  )
}

export default CourseCardItem