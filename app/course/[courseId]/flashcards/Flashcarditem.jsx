'use client'
import React, { useState } from 'react'
import ReactCardFlip from 'react-card-flip'

function FlashcardItem({ flashcard, resetKey }) {
    // Each card manages its own flip state independently
    const [isFlipped, setIsFlipped] = useState(false);

    // When the parent signals a slide change (via resetKey), reset the flip
    React.useEffect(() => {
        setIsFlipped(false);
    }, [resetKey]);

    return (
        <div className='flex items-center justify-center w-full px-4'>
            <ReactCardFlip isFlipped={isFlipped} flipDirection="vertical">
                {/* Front of the card (Question) */}
                <div
                    className='w-[300px] sm:w-[400px] md:w-[500px] h-[350px] p-6 sm:p-8 bg-slate-800 text-white flex flex-col items-center justify-center border border-slate-700/60 shadow-[6px_6px_0_0_rgba(15,23,42,1)] rounded-2xl cursor-pointer hover:scale-[1.02] transition-transform text-center relative'
                    onClick={() => setIsFlipped(true)}
                >
                    <span className='absolute top-4 right-4 text-[10px] font-bold text-indigo-300 bg-indigo-500/15 border border-indigo-500/25 px-2.5 py-1 rounded-full uppercase tracking-widest'>
                        Question
                    </span>
                    <h2 className='text-xl md:text-2xl font-black text-slate-200 leading-relaxed'>
                        {flashcard?.front}
                    </h2>
                    <p className='absolute bottom-4 text-xs font-medium text-slate-500'>Click to reveal answer</p>
                </div>

                {/* Back of the card (Answer) */}
                <div
                    className='w-[300px] sm:w-[400px] md:w-[500px] h-[350px] p-6 sm:p-8 bg-indigo-600 text-white flex flex-col items-center justify-center border border-indigo-800 shadow-[6px_6px_0_0_rgba(15,23,42,1)] rounded-2xl cursor-pointer hover:scale-[1.02] transition-transform text-center relative'
                    onClick={() => setIsFlipped(false)}
                >
                    <span className='absolute top-4 right-4 text-[10px] font-bold text-indigo-100 bg-indigo-900/30 border border-indigo-300/30 px-2.5 py-1 rounded-full uppercase tracking-widest'>
                        Answer
                    </span>
                    <h2 className='text-lg md:text-xl font-bold text-white leading-relaxed'>
                        {flashcard?.back}
                    </h2>
                    <p className='absolute bottom-4 text-xs font-medium text-indigo-300'>Click to flip back</p>
                </div>
            </ReactCardFlip>
        </div>
    )
}

export default FlashcardItem