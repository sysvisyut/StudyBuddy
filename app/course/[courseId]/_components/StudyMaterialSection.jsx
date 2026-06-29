'use client'
import React, { useEffect, useState, useRef } from 'react'
import MaterialCardItem from './MaterialCardItem'
import axios from 'axios'

function StudyMaterialSection({ courseId , course}) {
    const [studyTypeContent, setStudyTypeContent] = useState(null);
    const pollingRef = useRef(null);

    const MaterialList = [
        {
            name: 'Notes/Chapters',
            desc: 'Read notes to prepare for the exam',
            icon: '/note.png',
            path: `/course/${courseId}/notes`,
            color: 'from-violet-500/20 to-violet-600/10',
            iconBg: 'bg-violet-500/20',
            type: 'notes',
        },
        {
            name: 'Flashcards',
            desc: 'Learn through flashcards to recollect the concepts',
            icon: '/flashcard.png',
            path: `/course/${courseId}/flashcards`,
            color: 'from-blue-500/20 to-blue-600/10',
            iconBg: 'bg-blue-500/20',
            type: 'flashcard',
        },
        {
            name: 'Quiz',
            desc: 'Test your knowledge and improve your grades',
            icon: '/quiz.png',
            path: `/course/${courseId}/quiz`,
            color: 'from-emerald-500/20 to-emerald-600/10',
            iconBg: 'bg-emerald-500/20',
            type: 'quiz',
        },
        {
            name: 'Test Series',
            desc: 'Take tests to evaluate your preparation',
            icon: '/test.png',
            path: `/course/${courseId}/test`,
            color: 'from-amber-500/20 to-amber-600/10',
            iconBg: 'bg-amber-500/20',
            type: 'qa',
        },
        {
            name: 'Record and Learn',
            desc: 'Record your voice and learn',
            icon: '/voice.png',
            path: `/course/${courseId}/voice`,
            color: 'from-rose-500/20 to-rose-600/10',
            iconBg: 'bg-rose-500/20',
            type: null,
        }
    ]

    useEffect(() => {
        if (courseId) {
            GetStudyMaterial();
        }
        return () => {
            // Cleanup polling on unmount
            if (pollingRef.current) clearInterval(pollingRef.current);
        }
    }, [courseId])

    const GetStudyMaterial = async () => {
        try {
            const result = await axios.post('/api/study-type', {
                courseId: courseId,
                studyType: 'ALL'
            });
            const data = result?.data;
            setStudyTypeContent(data);

            // Check if any content is currently generating — if so, start polling
            const isGenerating = checkIfGenerating(data);
            if (isGenerating) {
                startPolling();
            } else {
                stopPolling();
            }
        } catch (error) {
            console.error('Failed to fetch study material:', error.message);
        }
    }

    const checkIfGenerating = (data) => {
        if (!data) return false;
        // Check all study types (excluding notes which is always ready)
        const types = ['flashcard', 'quiz', 'qa'];
        for (const type of types) {
            const list = data[type];
            if (list && list.length > 0 && list[0].status === 'Generating') {
                return true;
            }
        }
        return false;
    }

    const startPolling = () => {
        if (pollingRef.current) return; // already polling
        pollingRef.current = setInterval(async () => {
            try {
                const result = await axios.post('/api/study-type', {
                    courseId: courseId,
                    studyType: 'ALL'
                });
                const data = result?.data;
                setStudyTypeContent(data);
                // Stop polling once everything is done
                if (!checkIfGenerating(data)) {
                    stopPolling();
                }
            } catch (e) {
                console.error('Polling error:', e);
            }
        }, 5000); // poll every 5 seconds
    }

    const stopPolling = () => {
        if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
        }
    }

    return (
        <div className='mt-10'>
            <h2 className='font-bold text-2xl text-white mb-1'>Study Materials</h2>
            <p className='text-slate-400 text-sm mb-5'>Pick a study mode to get started</p>
            <div className='grid grid-cols-2 md:grid-cols-3 gap-5 mt-3'>
                {MaterialList.map((item, index) => (
                    <MaterialCardItem
                        key={index}
                        item={item}
                        studyTypeContent={studyTypeContent}
                        course={course}
                        refreshData={GetStudyMaterial}
                    />
                ))}
            </div>
        </div>
    )
}

export default StudyMaterialSection