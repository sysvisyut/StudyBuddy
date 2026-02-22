"use client";
import React from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { LayoutDashboard, Shield, UserCircle } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { Progress } from "@/components/ui/progress"

import Link from 'next/link'

function SideBar() {
  const MenuList = [
    {
      name: 'Dashboard',
      icon: LayoutDashboard,
      path: '/dashboard'
    },
    {
      name: 'Upgrade',
      icon: Shield,
      path: '/dashboard/upgrade'
    },
    {
      name: 'Profile',
      icon: UserCircle,
      path: '/dashboard/profile'
    },
  ]
  const path = usePathname();

  return (
    <div className='h-screen shadow-md p-5 flex flex-col'>
      <div className='flex items-center gap-2'>
        <Image src={'/logo.svg'} alt='logo' width={40} height={40} />
        <h2 className="font-bold text-2xl text-primary">Study Buddy</h2>
      </div>

      <div className='mt-10 flex-1'>
        <Button className="w-full text-lg shadow-sm">+ Create New</Button>
        <div className='mt-5'>
          {MenuList.map((menu, index) => (
            <Link href={menu.path} key={index}>
              <div className={`flex gap-3 items-center p-3 mt-2 hover:bg-slate-100 rounded-lg cursor-pointer transition-all ${path === menu.path ? 'bg-slate-200 text-primary font-medium' : 'text-slate-600'}`}>
                <menu.icon className="w-5 h-5" />
                <h2 className="text-lg">{menu.name}</h2>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className='border-t pt-5'>
        <div className='bg-primary/5 p-4 rounded-xl border border-primary/10'>
          <h2 className='text-sm font-semibold text-primary mb-2'>Available Credits</h2>
          <Progress value={60} className="h-2 mb-3" />
          <h2 className='text-xs text-slate-500 mb-4'>3 Out of 5 Credits Used</h2>
          <Link href={'/dashboard/upgrade'}>
            <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary hover:text-white transition-all font-semibold">
              Upgrade Now
            </Button>
          </Link>
        </div>
        <p className='text-[10px] text-slate-400 text-center mt-4'>© 2024 Study Buddy AI</p>
      </div>
    </div>
  )
}

export default SideBar