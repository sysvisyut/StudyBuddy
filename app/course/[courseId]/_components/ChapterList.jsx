import React from 'react'

function ChapterList({course}) {
    const chapters = course?.courseLayout?.chapters;
    console.log(chapters);
  return (
    <div className='mt-5'>
        <h2 className='font-medium text-xl'>Chapters</h2>
        <div>
            {chapters?.map((chapter,index)=>(
               <div className='flex gap-5 items-center p-4 border shadow-md rounded-lg my-5' key={index}>
                 <h2 className='text-2xl'>{chapter?.emoji}</h2>
                 <div>
                    <h2 className='font-medium'>{chapter.chapter_title}</h2>
                    <p className='text-gray-500 text-sm'>{chapter?.summary}</p>
                 </div>
               </div>
            ))}
        </div>


    </div>
  )
}

export default ChapterList