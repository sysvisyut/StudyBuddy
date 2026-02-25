"use client"
import React from 'react'
import Image from 'next/image'
import { useUser } from '@clerk/nextjs'
function WelcomeBanner() {
  const { user } = useUser();
  return (
    <div className='p-6 bg-primary w-full text-white rounded-lg flex items-center gap-6'>
      <Image src={'/laptop1.png'} alt='laptop' width={100} height={100} />
      <div>
        <h2 className='text-3xl font-bold'>Hello, {user?.fullName}</h2>
        <p className='text-sm font-light'>Welcome back! Ready to continue your learning journey?</p>
      </div>
    </div>
  )
}

export default WelcomeBanner