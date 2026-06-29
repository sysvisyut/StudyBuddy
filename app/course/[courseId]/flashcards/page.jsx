"use client"
import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import axios from 'axios'
import Flashcarditem from './Flashcarditem'
import { Loader2, Zap } from 'lucide-react'

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

function Flashcards() {

    const {courseId} = useParams(); // object destructuring 

    const[flashCards,setFlashCards]=useState();
    const [isFlipped, setIsFlipped] = useState(false);
    const [api, setApi] = useState();
    const [loading, setLoading] = useState(true);

    
    useEffect(()=>{
        if(!api) return;

        api.on('select',()=>{
            setIsFlipped(false);
        })

    },[api])

    useEffect(()=>{
        GetFlashCards();
    },[])

    const GetFlashCards=async()=>{
        setLoading(true);
        try {
            const result=await axios.post('/api/study-type',{
                courseId:courseId,
                studyType:'flashcard'
            });
            setFlashCards(result?.data);
            console.log('Flashcard', result.data);
        } catch (error) {
            console.error('Failed to fetch flashcards:', error);
        } finally {
            setLoading(false);
        }
    }

    const handleClick=()=>{
        setIsFlipped(!isFlipped);
    }

    if (loading) {
        return (
            <div className='flex flex-col items-center justify-center min-h-[60vh] gap-4'>
                <Loader2 className='w-10 h-10 text-indigo-400 animate-spin' />
                <p className='text-slate-400 text-sm font-medium'>Loading flashcards...</p>
            </div>
        );
    }

    const hasFlashcards = flashCards?.content && flashCards.content.length > 0;

    return (
        <div className='p-6 md:p-10 max-w-4xl mx-auto'>
            {/* Header matching the neo-brutalist style */}
            <div className='mb-8 flex items-center gap-3'>
                <div className='w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center'>
                    <Zap className='w-6 h-6 text-indigo-400' />
                </div>
                <div>
                    <h2 className='font-black text-2xl text-white'>Flashcards</h2>
                    <p className='text-slate-400 text-sm mt-1'>The Ultimate Tool to Lock in Concepts</p>
                </div>
            </div>

            {hasFlashcards ? (
                <div className ='flex items-center justify-center mt-10 w-full'>
                    <Carousel setApi={setApi} className="w-full max-w-xl">
                        <CarouselContent>
                            {flashCards.content.map((flashcard,index)=>( 
                                <CarouselItem key = {index} className="flex items-center justify-center p-2">
                                    <Flashcarditem 
                                        handleClick = {handleClick} 
                                        isFlipped={isFlipped} 
                                        flashcard ={flashcard}
                                    />
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        {/* Custom Navigation */}
                        <div className="flex justify-center gap-6 mt-10">
                            <CarouselPrevious className="static transform-none border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 shadow-[4px_4px_0_0_rgba(15,23,42,1)] hover:shadow-[2px_2px_0_0_rgba(15,23,42,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all h-10 w-10 flex items-center justify-center rounded-xl" />
                            <CarouselNext className="static transform-none border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 shadow-[4px_4px_0_0_rgba(15,23,42,1)] hover:shadow-[2px_2px_0_0_rgba(15,23,42,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all h-10 w-10 flex items-center justify-center rounded-xl" />
                        </div>
                    </Carousel>
                </div>
            ) : (
                <div className='flex flex-col items-center justify-center min-h-[40vh] gap-4 p-10 mt-10 border border-slate-700/60 rounded-2xl bg-slate-800 shadow-[4px_4px_0_0_rgba(15,23,42,1)]'>
                    <div className='w-16 h-16 rounded-2xl bg-slate-700 border border-slate-600/60 flex items-center justify-center'>
                        <Zap className='w-8 h-8 text-slate-500' />
                    </div>
                    <h2 className='text-xl font-bold text-white'>No Flashcards Yet</h2>
                    <p className='text-slate-400 text-sm text-center max-w-xs'>
                        Flashcards haven't been generated for this course yet. Check back soon!
                    </p>
                </div>
            )}
        </div>
    )
}

export default Flashcards