"use client"
import React from 'react'
import Image from 'next/image'
import { useUser } from '@clerk/nextjs'
function WelcomeBanner() {
  const { user } = useUser();
  return (
    <div className='w-full text-white'>
      <h2 className='text-7xl font-bold tracking-tight mb-4'>
        Hello, {user?.fullName?.split(' ')[0]}
      </h2>
      <p className='text-2xl text-slate-400 font-medium max-w-2xl leading-relaxed'>
        Your personalized AI study companion. Ready to build something amazing today?
      </p>
    </div>
  )
}

export default WelcomeBanner