import React from 'react'
import DashboardHeader from '@/app/dashboard/_components/DashboardHeader'

function CourseViewLayout({ children }) {
  return (
    <div>
        <DashboardHeader />
        <div>
            {children}
        </div>
    </div>
  )
}

export default CourseViewLayout