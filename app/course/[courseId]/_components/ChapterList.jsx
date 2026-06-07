import React from 'react'

function ChapterList({ course }) {
    const chapters = course?.courseLayout?.chapters;

    if (!chapters?.length) return null;

    return (
        <div className='mt-10'>
            <h2 className='font-bold text-2xl text-white mb-1'>Chapters</h2>
            <p className='text-slate-400 text-sm mb-5'>Overview of all chapters in this course</p>
            <div className='flex flex-col gap-3'>
                {chapters.map((chapter, index) => (
                    <div
                        key={index}
                        className='flex gap-4 items-start p-5 border border-slate-700/60 bg-slate-800 rounded-2xl hover:border-slate-600/80 hover:bg-slate-800/80 transition-all duration-200'
                    >
                        {/* Index badge */}
                        <div className='shrink-0 w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-black text-sm'>
                            {index + 1}
                        </div>
                        <div className='flex-1 min-w-0'>
                            <div className='flex items-center gap-2 mb-0.5'>
                                {chapter?.emoji && (
                                    <span className='text-xl leading-none'>{chapter.emoji}</span>
                                )}
                                <h3 className='font-bold text-base text-white truncate'>
                                    {chapter.chapter_title}
                                </h3>
                            </div>
                            <p className='text-slate-400 text-sm leading-relaxed line-clamp-2'>
                                {chapter?.summary}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default ChapterList