"use client" // tell next.js that this file should run in the browser, not on the server
import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useUser } from '@clerk/nextjs'
import CourseCardItem from './CourseCardItem'
import { toast } from 'sonner'

function CourseList() {

    const {user} = useUser();

    const[courseList, setCourseList] = useState([]);
    
    useEffect(()=>{
        user&&GetCourseList();
    },[user])

    useEffect(() => {
        let intervalId;
        const isGenerating = courseList.some(course => course.status === 'Generating');
        if (isGenerating) {
            intervalId = setInterval(() => {
                user && GetCourseList();
            }, 5000);
        }
        return () => clearInterval(intervalId);
    }, [courseList, user]);

    const GetCourseList=async()=>{
       const result = await axios.post('/api/courses',{
            createdBy:user?.primaryEmailAddress?.emailAddress //trigger the api call

        })
        
        setCourseList((prevList) => {
            const newList = result.data.result;
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
    }
  return (
    <div className='mt-10'>
        <h2 className='font-bold text-2xl'>Your Study material</h2>

        <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mt-2 gap-5'>
            {courseList?.map((course,index)=>(
                <CourseCardItem course={course} key={index}/>
            ))}
        </div>
    </div> //display the returned result in the UI
  )
}

export default CourseList