"use client" // tell next.js that this file should run in the browser, not on the server
import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { useUser } from '@clerk/nextjs'
import CourseCardItem from './CourseCardItem'
import { toast } from 'sonner'
import { Loader2, RefreshCw } from 'lucide-react'

function CourseList() {

    const {user} = useUser();

    const[courseList, setCourseList] = useState([]);
    const[loading, setLoading] = useState(true);
    const[refreshing, setRefreshing] = useState(false);
    
    const GetCourseList = useCallback(async () => {
        try {
            const result = await axios.post('/api/courses',{
                createdBy:user?.primaryEmailAddress?.emailAddress //trigger the api call
            })
            
            setCourseList((prevList) => {
                const newList = result.data.result || [];
                if (prevList.length > 0) {
                    newList.forEach((newCourse) => {
                        const prevCourse = prevList.find(c => c.courseId === newCourse.courseId);
                        if (prevCourse && prevCourse.status === 'Generating' && newCourse.status === 'Ready') {
                            toast.success(`Your course '${newCourse.topic}' is ready!`);
                        }
                    });
                }
                return newList;
            });
        } catch (error) {
            console.error("Failed to fetch courses (offline):", error.message);
            toast.error("Failed to fetch courses. Check your database connection.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user]);

    const handleRefresh = () => {
        if (!user || refreshing) return;
        setRefreshing(true);
        GetCourseList();
    };

    const handleDelete = (deletedCourseId) => {
        setCourseList((prev) => prev.filter((c) => c.courseId !== deletedCourseId));
    };

    useEffect(()=>{
        if (user) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            GetCourseList();
        }
    },[user, GetCourseList])

    useEffect(() => {
        let intervalId;
        const isGenerating = courseList.some(course => course.status === 'Generating');
        if (isGenerating) {
            intervalId = setInterval(() => {
                if (user) {
                    GetCourseList();
                }
            }, 5000);
        }
        return () => clearInterval(intervalId);
    }, [courseList, user, GetCourseList]);
  return (
    <div className='mt-10'>
        <div className='flex items-center justify-between'>
            <h2 className='font-bold text-2xl'>Your Study material</h2>
            <button
                onClick={handleRefresh}
                disabled={refreshing || loading}
                title="Refresh courses"
                className='flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full border border-white/20 text-white hover:bg-white hover:text-black transition-all disabled:opacity-40 disabled:cursor-not-allowed'
            >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
            </button>
        </div>

        {loading ? (
            <div className='flex justify-center items-center mt-20'>
                <Loader2 className='animate-spin w-10 h-10 text-primary' />
            </div>
        ) : courseList?.length === 0 ? (
            <div className='flex flex-col justify-center items-center mt-20 text-gray-500'>
                <h3 className='text-xl font-semibold'>No study material found</h3>
                <p>Create a new course to get started!</p>
            </div>
        ) : (
            <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mt-2 gap-5'>
                {courseList?.map((course,index)=>(
                    <CourseCardItem course={course} key={index} onDelete={handleDelete} />
                ))}
            </div>
        )}
    </div> //display the returned result in the UI
  )
}

export default CourseList