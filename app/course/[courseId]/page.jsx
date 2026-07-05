"use client"

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import axios from 'axios'
import { Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
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
            <div className='mb-6'>
                <Link href="/dashboard">
                    <Button variant="outline" className="border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white rounded-full">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Dashboard
                    </Button>
                </Link>
            </div>
            <CourseIntroCard course={course} />
            <StudyMaterialSection courseId={courseId} course={course} />
            <ChapterList course={course} />
        </div>
    );
}

export default CourseViewPage