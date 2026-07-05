"use client";
import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { LayoutDashboard, Shield, UserCircle, Crown, Loader2 } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { Progress } from "@/components/ui/progress"
import axios from 'axios'
import Link from 'next/link'

function SideBar() {
  const { user } = useUser();
  const path = usePathname();

  const [isMember, setIsMember] = useState(false);
  const [memberLoading, setMemberLoading] = useState(true);

  const MenuList = [
    {
      name: 'Dashboard',
      icon: LayoutDashboard,
      path: '/dashboard'
    },
    {
      name: 'Upgrade',
      icon: Shield,
      path: '/dashboard/upgrade',
      pro: true,  // show PRO badge when not a member
    },
    {
      name: 'Profile',
      icon: UserCircle,
      path: '/dashboard/profile'
    },
  ]

  useEffect(() => {
    async function fetchMembership() {
      const email = user?.emailAddresses?.[0]?.emailAddress;
      if (!email) return;
      try {
        const res = await axios.get(`/api/user?email=${encodeURIComponent(email)}`);
        setIsMember(!!res.data?.isMember);
      } catch (err) {
        // silently ignore — default to non-member
      } finally {
        setMemberLoading(false);
      }
    }
    if (user) fetchMembership();
    else setMemberLoading(false);
  }, [user]);

  return (
    <div className='h-screen p-5 flex flex-col'>
      <div className='flex items-center gap-2 mb-10'>
        <Image src={'/logo.svg'} alt='logo' width={40} height={40} style={{ width: 'auto', height: 'auto' }} />
        <h2 className="font-bold text-2xl text-white tracking-tight">Study Buddy</h2>
      </div>

      <div className='flex-1'>
        <Link href={'/create'} className='w-full'>
          <Button className="w-full text-lg rounded-full py-6 bg-white text-black hover:bg-slate-200 transition-all font-bold">
            + Create New
          </Button>
        </Link>
        <div className='mt-8'>
          {MenuList.map((menu, index) => (
            <Link href={menu.path} key={index}>
              <div className={`flex gap-4 items-center p-3 mt-2 rounded-full cursor-pointer transition-all ${path === menu.path ? 'bg-white/10 text-white font-semibold' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                <menu.icon className="w-5 h-5" />
                <h2 className="text-lg flex-1">{menu.name}</h2>
                {/* Show PRO badge if non-member; show Crown if member */}
                {menu.pro && !memberLoading && (
                  isMember ? (
                    <span className='flex items-center gap-1 text-[9px] font-black bg-indigo-500/30 border border-indigo-500/40 text-indigo-300 px-2 py-0.5 rounded-full uppercase tracking-widest'>
                      <Crown className='w-2.5 h-2.5' />
                      Pro
                    </span>
                  ) : (
                    <span className='text-[9px] font-black bg-amber-500/20 border border-amber-500/30 text-amber-400 px-2 py-0.5 rounded-full uppercase tracking-widest'>
                      Upgrade
                    </span>
                  )
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Bottom upgrade / membership panel */}
      <div className='pt-5'>
        {memberLoading ? (
          <div className='bg-white/5 p-6 rounded-3xl border border-white/10 flex items-center justify-center'>
            <Loader2 className='w-5 h-5 text-slate-500 animate-spin' />
          </div>
        ) : isMember ? (
          /* Member state */
          <div className='bg-indigo-500/10 p-6 rounded-3xl border border-indigo-500/25'>
            <div className='flex items-center gap-2 mb-2'>
              <Crown className='w-4 h-4 text-indigo-400' />
              <h2 className='text-sm font-bold text-indigo-300'>Pro Plan</h2>
            </div>
            <p className='text-xs text-slate-400 mb-1'>Unlimited AI courses</p>
            <div className='flex items-center gap-1.5 mt-3'>
              <span className='w-2 h-2 rounded-full bg-emerald-400 animate-pulse' />
              <span className='text-[11px] font-bold text-emerald-300'>Active Subscription</span>
            </div>
          </div>
        ) : (
          /* Non-member state */
          <div className='bg-white/5 p-6 rounded-3xl border border-white/10'>
            <h2 className='text-sm font-semibold text-white mb-2'>Available Credits</h2>
            <Progress value={60} className="h-1.5 mb-3 bg-white/10 [&>div]:bg-white" />
            <h2 className='text-xs text-slate-400 mb-4'>3 Out of 5 Credits Used</h2>
            <Link href={'/dashboard/upgrade'}>
              <Button variant="outline" className="w-full rounded-full border-white/20 text-white hover:bg-white hover:text-black transition-all font-bold">
                Upgrade Now
              </Button>
            </Link>
          </div>
        )}
        <p className='text-[10px] text-slate-500 text-center mt-6 uppercase tracking-widest font-medium'>Generated by AI</p>
      </div>
    </div>
  )
}

export default SideBar