import React from 'react'
import Image from 'next/image'
import { Progress } from '@/components/ui/progress'
function CourseIntroCard({course}) {
  return (
    <div className='flex gap-5 items-center p-10 border shadow-md rounded-lg'>
      <Image src={'/knowledge.png'} alt='other' width={50} height={50}/>
      <div>
        <h2 className='font-bold text-2xl'>{course?.courseLayout.course_title}</h2>
        <p>{course?.courseLayout?.summary}</p>
        <Progress className="mt-3"/>


        <h2 className='mt-3 text-lg text-primary'>Total Chapters:{course?.courseLayout?.chapters?.length}</h2>
      </div>
    </div>
  )
}

export default CourseIntroCard