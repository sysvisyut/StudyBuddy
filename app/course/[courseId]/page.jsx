"use client"
import { useParams } from 'next/navigation'
import React, { useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import CourseIntroCard from './_components/CourseIntroCard';
import DashboardHeader from '@/app/dashboard/_components/DashboardHeader';
import StudyMaterialSection from './_components/StudyMaterialSection';
import ChapterList from './_components/ChapterList';

function Course() {
    const {courseId}= useParams();
    const [course,setCourse]= useState();

    const GetCourse = useCallback(async () => {
        try {
            const result = await axios.get('/api/courses?courseId='+courseId);
            console.log(result);
            setCourse(result.data.result);
        } catch (error) {
            console.error("Failed to fetch course details (offline):", error.message);
        }
    }, [courseId]);

    useEffect(()=>{
        // eslint-disable-next-line react-hooks/set-state-in-effect
        GetCourse();
    },[GetCourse])
  return (
    <div>
        <DashboardHeader/>
        <div className='mx-10 md:mx-36 lg:px-60 mt-10'>
        {/* course intro */}
            <CourseIntroCard course={course }/>

        {/* study material options */}
            <StudyMaterialSection courseId={courseId} course={course} />

        {/* chapter list */}
            <ChapterList course = {course} />
         </div>
    </div>
  )
}

export default Course