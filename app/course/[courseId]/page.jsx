"use client"

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import axios from 'axios'
import { Loader2 } from 'lucide-react'
import CourseIntroCard from './_components/CourseIntroCard'
import StudyMaterialSection from './_components/StudyMaterialSection'
import ChapterList from './_components/ChapterList'

function CourseViewPage() {
    const { courseId } = useParams();
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (courseId) {
            GetCourse();
        }
    }, [courseId]);

    const GetCourse = async () => {
        setLoading(true);
        try {
            const result = await axios.get(`/api/courses?courseId=${courseId}`);
            setCourse(result?.data?.result);
        } catch (error) {
            console.error('Failed to fetch course:', error.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className='flex flex-col items-center justify-center min-h-[60vh] gap-4'>
                <Loader2 className='w-10 h-10 text-indigo-400 animate-spin' />
                <p className='text-slate-400 text-sm font-medium'>Loading course...</p>
            </div>
        );
    }

    return (
        <div className='p-6 md:p-10 max-w-5xl mx-auto'>
            <CourseIntroCard course={course} />
            <StudyMaterialSection courseId={courseId} course={course} />
            <ChapterList course={course} />
        </div>
    );
}

export default CourseViewPage