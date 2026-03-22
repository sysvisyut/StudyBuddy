import React from 'react'
import { UserButton } from '@clerk/nextjs'
function DashboardHeader() {
  return (
    <div className='px-12 py-8 flex justify-end items-center'>
      <UserButton appearance={{ elements: { userButtonAvatarBox: 'w-10 h-10' } }} />
    </div>
  )
}

export default DashboardHeader