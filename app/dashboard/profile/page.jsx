"use client"
import React, { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import axios from 'axios'
import Image from 'next/image'
import { ActivityCalendar } from 'react-activity-calendar'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"
import { Loader2, Zap, CheckCircle2, BookOpen, Layers, Target, Crown, ArrowLeft } from 'lucide-react'
import { format, parseISO } from 'date-fns'

export default function ProfilePage() {
    const { user, isLoaded } = useUser()
    const [profileData, setProfileData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [selectedDate, setSelectedDate] = useState(null) // the raw date string from calendar
    const [isModalOpen, setIsModalOpen] = useState(false)

    useEffect(() => {
        if (!isLoaded) return;
        if (user) {
            fetchProfileData();
        } else {
            setLoading(false);
        }
    }, [user, isLoaded])

    const fetchProfileData = async () => {
        try {
            const email = user?.emailAddresses?.[0]?.emailAddress;
            if (!email) return;

            const res = await axios.get(`/api/user/profile?email=${encodeURIComponent(email)}`)
            setProfileData(res.data)
        } catch (error) {
            console.error("Failed to load profile:", error)
        } finally {
            setLoading(false)
        }
    }

    const getActivityIcon = (type) => {
        switch (type?.toLowerCase()) {
            case 'course': return <BookOpen className='w-4 h-4 text-emerald-400' />
            case 'quiz': return <Target className='w-4 h-4 text-indigo-400' />
            case 'flashcard': return <Zap className='w-4 h-4 text-amber-400' />
            default: return <Layers className='w-4 h-4 text-slate-400' />
        }
    }

    const getActivityBadgeStyle = (type) => {
        switch (type?.toLowerCase()) {
            case 'course': return 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
            case 'quiz': return 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300'
            case 'flashcard': return 'bg-amber-500/20 border-amber-500/30 text-amber-300'
            default: return 'bg-slate-500/20 border-slate-500/30 text-slate-300'
        }
    }

    const handleDayClick = (block) => {
        if (block.count === 0) return;
        setSelectedDate(block.date);
        setIsModalOpen(true);
    }

    // Color theme for the activity calendar (dark slate to bright indigo)
    const explicitTheme = {
        light: ['#1e293b', '#312e81', '#4338ca', '#4f46e5', '#6366f1'],
        dark: ['#1e293b', '#312e81', '#4338ca', '#4f46e5', '#6366f1'],
    };

    if (loading || !isLoaded) {
        return (
            <div className='flex items-center justify-center min-h-[70vh]'>
                <Loader2 className='w-10 h-10 text-indigo-400 animate-spin' />
            </div>
        )
    }

    if (!user) {
        return (
            <div className='flex items-center justify-center min-h-[70vh]'>
                <p className='text-slate-400'>Please sign in to view your profile.</p>
            </div>
        )
    }

    const stats = profileData?.stats || { totalCourses: 0, quizzesCompleted: 0, flashcardsMastered: 0 };
    const activityData = profileData?.activityData || [];
    const recentActivities = profileData?.recentActivities || [];
    const isMember = profileData?.user?.isMember;

    // Get specific activities for the selected date
    const selectedDateData = selectedDate ? activityData.find(d => d.date === selectedDate) : null;

    return (
        <div className='max-w-5xl mx-auto p-6 md:p-10 pb-20'>
            
            <div className='mb-6'>
                <Link href="/dashboard">
                    <Button variant="outline" className="border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white rounded-full">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Dashboard
                    </Button>
                </Link>
            </div>

            {/* Header Section */}
            <div className='border-[3px] border-slate-700/60 bg-slate-800 rounded-3xl p-8 md:p-10 mb-8 shadow-[6px_6px_0_0_rgba(15,23,42,1)] relative overflow-hidden flex flex-col md:flex-row items-center md:items-start gap-8'>
                <div className='absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-400 via-slate-800 to-transparent' />
                
                {/* Avatar */}
                <div className='relative shrink-0'>
                    <div className='w-32 h-32 rounded-3xl overflow-hidden border-[4px] border-slate-700 shadow-xl'>
                        <Image 
                            src={user?.imageUrl || '/default-avatar.png'} 
                            alt={user?.fullName || 'Profile'} 
                            width={128} 
                            height={128} 
                            className='object-cover w-full h-full'
                        />
                    </div>
                    {isMember && (
                        <div className='absolute -bottom-3 -right-3 bg-indigo-600 border-2 border-slate-800 p-2 rounded-xl shadow-lg flex items-center justify-center'>
                            <Crown className='w-5 h-5 text-white' />
                        </div>
                    )}
                </div>

                {/* Info & Stats */}
                <div className='flex-1 text-center md:text-left z-10 w-full'>
                    <div className='flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6'>
                        <div>
                            <h1 className='text-3xl md:text-4xl font-black text-white tracking-tight'>{user?.fullName}</h1>
                            <p className='text-slate-400 font-medium mt-1'>{user?.primaryEmailAddress?.emailAddress}</p>
                        </div>
                        {isMember && (
                            <div className='inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 px-4 py-2 rounded-full'>
                                <span className='w-2 h-2 rounded-full bg-emerald-400 animate-pulse' />
                                <span className='text-xs font-bold text-indigo-300 uppercase tracking-wider'>Pro Member</span>
                            </div>
                        )}
                    </div>

                    <div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
                        <div className='bg-slate-900/50 rounded-2xl p-4 border border-slate-700/50'>
                            <p className='text-xs text-slate-400 font-bold uppercase tracking-wider mb-1'>Courses</p>
                            <p className='text-2xl font-black text-white'>{stats.totalCourses}</p>
                        </div>
                        <div className='bg-slate-900/50 rounded-2xl p-4 border border-slate-700/50'>
                            <p className='text-xs text-slate-400 font-bold uppercase tracking-wider mb-1'>Quizzes</p>
                            <p className='text-2xl font-black text-emerald-400'>{stats.quizzesCompleted}</p>
                        </div>
                        <div className='bg-slate-900/50 rounded-2xl p-4 border border-slate-700/50 col-span-2 md:col-span-1'>
                            <p className='text-xs text-slate-400 font-bold uppercase tracking-wider mb-1'>Flashcards</p>
                            <p className='text-2xl font-black text-amber-400'>{stats.flashcardsMastered}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
                
                {/* Left Col: Activity Graph */}
                <div className='lg:col-span-2 flex flex-col gap-8'>
                    <div className='border-2 border-slate-700/60 bg-slate-800 rounded-3xl p-8 shadow-[4px_4px_0_0_rgba(15,23,42,1)]'>
                        <h2 className='text-xl font-black text-white mb-6 flex items-center gap-2'>
                            <Target className='w-5 h-5 text-indigo-400' />
                            Activity Graph
                        </h2>
                        
                        <div className='w-full overflow-x-auto pb-4 custom-scrollbar'>
                            <div className='min-w-[700px]'>
                                {activityData.length > 0 ? (
                                    <ActivityCalendar 
                                        data={activityData}
                                        theme={explicitTheme}
                                        colorScheme="dark"
                                        labels={{
                                            totalCount: '{{count}} activities in the last 6 months',
                                        }}
                                        blockSize={16}
                                        blockRadius={4}
                                        blockMargin={5}
                                        fontSize={12}
                                        showWeekdayLabels
                                        eventHandlers={{
                                            onClick: (event) => (data) => handleDayClick(data),
                                        }}
                                        renderBlock={(block, activity) => (
                                            React.cloneElement(block, {
                                                className: `transition-all duration-200 ${activity.count > 0 ? 'hover:scale-110 cursor-pointer shadow-sm hover:fill-indigo-300' : ''}`,
                                                title: `${activity.count} activities on ${activity.date}`
                                            })
                                        )}
                                    />
                                ) : (
                                    <p className='text-slate-500 text-sm'>No activity recorded yet.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Col: Recent Activity List */}
                <div className='border-2 border-slate-700/60 bg-slate-800 rounded-3xl p-8 shadow-[4px_4px_0_0_rgba(15,23,42,1)]'>
                    <h2 className='text-xl font-black text-white mb-6 flex items-center gap-2'>
                        <Zap className='w-5 h-5 text-amber-400' />
                        Recent Activity
                    </h2>
                    
                    <div className='flex flex-col gap-4'>
                        {recentActivities.length > 0 ? recentActivities.map((activity, idx) => (
                            <div key={idx} className='flex items-start gap-4 group p-3 -mx-3 rounded-xl hover:bg-slate-700/40 transition-colors'>
                                <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border ${getActivityBadgeStyle(activity.type)}`}>
                                    {getActivityIcon(activity.type)}
                                </div>
                                <div>
                                    <p className='text-sm font-semibold text-slate-200 leading-snug group-hover:text-white transition-colors'>{activity.title}</p>
                                    <p className='text-xs text-slate-500 font-medium mt-1'>
                                        {format(new Date(activity.timestamp), 'MMM d, yyyy • h:mm a')}
                                    </p>
                                </div>
                            </div>
                        )) : (
                            <div className='text-center py-10 opacity-60'>
                                <Layers className='w-10 h-10 mx-auto text-slate-500 mb-3' />
                                <p className='text-sm text-slate-400'>No recent activity.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Activity Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="bg-slate-800 border-slate-700 text-white sm:max-w-md shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black text-white flex items-center gap-2">
                            {selectedDate && format(parseISO(selectedDate), 'MMMM d, yyyy')}
                        </DialogTitle>
                    </DialogHeader>
                    
                    <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar mt-4">
                        <div className="flex flex-col gap-3 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-700 before:to-transparent">
                            {selectedDateData?.activities?.map((activity, i) => (
                                <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                    {/* Timeline dot */}
                                    <div className={`flex items-center justify-center w-6 h-6 rounded-full border-4 border-slate-800 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow absolute left-2 md:left-1/2 md:-translate-x-1/2 z-10 ${activity.type === 'course' ? 'bg-emerald-400' : activity.type === 'quiz' ? 'bg-indigo-400' : 'bg-amber-400'}`}>
                                    </div>
                                    
                                    {/* Card */}
                                    <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] p-4 rounded-2xl bg-slate-900/80 border border-slate-700/50 shadow-sm ml-12 md:ml-0 hover:bg-slate-900 transition-colors">
                                        <div className={`text-[10px] uppercase tracking-widest font-black mb-1 flex items-center gap-1 ${activity.type === 'course' ? 'text-emerald-400' : activity.type === 'quiz' ? 'text-indigo-400' : 'text-amber-400'}`}>
                                            {getActivityIcon(activity.type)}
                                            {activity.type}
                                        </div>
                                        <p className="text-sm font-semibold text-slate-200">{activity.title}</p>
                                        <time className="block text-xs font-medium text-slate-500 mt-2">
                                            {format(new Date(activity.timestamp), 'h:mm a')}
                                        </time>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

        </div>
    )
}
