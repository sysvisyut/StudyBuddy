"use client";
import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import axios from 'axios'
import { Button } from '@/components/ui/button'

function ViewNotes() {
    const { courseId } = useParams();
    const [notes, setNotes] = useState([]);
    const [stepCount, setStepCount] = useState(0);

    useEffect(() => {
        if (courseId) {
            GetNotes();
        }
    }, [courseId]);

    const GetNotes = async () => {
        try {
            const result = await axios.post('/api/study-type', {
                courseId: courseId,
                studyType: 'NOTES'
            });
            console.log(result?.data);
            setNotes(result?.data || []);
        } catch (error) {
            console.error('Failed to fetch notes:', error.message);
        }
    };

    const Previous = () => {
        setStepCount((prev) => Math.max(0, prev - 1));
    };

    const Next = () => {
        setStepCount((prev) => Math.min(notes.length - 1, prev + 1));
    };

    return (
        <div className='p-10'>
            {/* Step progress bar */}
            <div className='flex gap-3 items-center mb-8'>
                {stepCount !== 0 && (
                    <Button variant='outline' onClick={Previous}>
                        Previous
                    </Button>
                )}
                <div className='flex flex-1 gap-2 items-center'>
                    {notes?.map((item, index) => (
                        <div
                            key={index}
                            className={`flex-1 h-2 rounded-full transition-all duration-300 ${
                                index <= stepCount ? 'bg-indigo-500' : 'bg-slate-700'
                            }`}
                        />
                    ))}
                </div>
                {stepCount < notes.length - 1 && (
                    <Button variant='outline' onClick={Next}>
                        Next
                    </Button>
                )}
            </div>

            {/* Current note content */}
            {notes?.length > 0 && notes[stepCount] && (
                <div className='border rounded-xl p-6 bg-slate-800 text-white'>
                    <h2 className='text-lg font-semibold mb-3 text-slate-300'>
                        Chapter {notes[stepCount]?.chapterId + 1}
                    </h2>
                    <p className='text-slate-200 leading-relaxed whitespace-pre-wrap'>
                        {notes[stepCount]?.notes}
                    </p>
                </div>
            )}

            {notes?.length === 0 && (
                <div className='text-center text-slate-400 mt-20'>
                    <p>No notes found for this course yet.</p>
                </div>
            )}
        </div>
    )
}

export default ViewNotes