"use client" // tell next.js that this file should run in the browser, not on the server
import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useUser } from '@clerk/nextjs'
import CourseCardItem from './CourseCardItem'

function CourseList() {

    const {user} = useUser();

    const[courseList, setCourseList] = useState([]);
    
    useEffect(()=>{
        user&&GetCourseList();
    },[user])

    const GetCourseList=async()=>{
       const result = await axios.post('/api/courses',{
            createdBy:user?.primaryEmailAddress?.emailAddress //trigger the api call

        })
        setCourseList(result.data.result);
        console.log(result) // check here(for my reference)
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