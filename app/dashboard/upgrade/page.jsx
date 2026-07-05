"use client"
import React, { useState, useEffect, Suspense } from 'react'
import { useUser } from '@clerk/nextjs'
import { useSearchParams, useRouter } from 'next/navigation'
import axios from 'axios'
import { toast } from 'sonner'
import {
    Check, Sparkles, Zap, Shield, Loader2,
    Crown, BookOpen, BarChart3, Infinity, Lock
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const FREE_FEATURES = [
    { text: '5 AI-generated courses', included: true },
    { text: 'Notes & chapter summaries', included: true },
    { text: 'Basic flashcards', included: true },
    { text: 'Unlimited courses', included: false },
    { text: 'Advanced quiz engine', included: false },
    { text: 'Priority generation queue', included: false },
    { text: 'Export study materials', included: false },
]

const PRO_FEATURES = [
    { text: 'Unlimited AI-generated courses', icon: Infinity },
    { text: 'Advanced quiz engine (15 questions)', icon: BarChart3 },
    { text: 'Full flashcard library', icon: Zap },
    { text: 'Priority AI generation queue', icon: Shield },
    { text: 'Export notes as PDF', icon: BookOpen },
    { text: 'Early access to new features', icon: Sparkles },
]

function FeatureRow({ text, included }) {
    return (
        <div className={`flex items-center gap-3 text-sm ${included ? 'text-slate-300' : 'text-slate-600'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0
                ${included ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-slate-700/40 border border-slate-700/30'}`}>
                {included
                    ? <Check className='w-3 h-3 text-emerald-400' />
                    : <Lock className='w-2.5 h-2.5 text-slate-600' />
                }
            </span>
            {text}
        </div>
    )
}

function ProFeatureRow({ text, icon: Icon }) {
    return (
        <div className='flex items-center gap-3 text-sm text-slate-300'>
            <span className='w-5 h-5 rounded-full flex items-center justify-center shrink-0 bg-indigo-500/20 border border-indigo-500/30'>
                <Check className='w-3 h-3 text-indigo-400' />
            </span>
            {text}
        </div>
    )
}

// Separate component that uses useSearchParams so it can be wrapped in Suspense
function SearchParamsListener() {
    const searchParams = useSearchParams();

    useEffect(() => {
        if (searchParams.get('upgraded') === 'true') {
            toast.success("You're now a Pro member! 🎉 Welcome to the full experience.");
        }
        if (searchParams.get('cancelled') === 'true') {
            toast.info('Checkout cancelled. Upgrade any time.');
        }
    }, [searchParams]);

    return null;
}

function UpgradePageContent() {
    const { user } = useUser();

    const [isMember, setIsMember] = useState(false);
    const [checkingMembership, setCheckingMembership] = useState(true);
    const [checkoutLoading, setCheckoutLoading] = useState(false);

    // Fetch current membership status
    useEffect(() => {
        async function checkMembership() {
            const email = user?.emailAddresses?.[0]?.emailAddress;
            if (!email) return;
            try {
                const res = await axios.get(`/api/user?email=${encodeURIComponent(email)}`);
                setIsMember(!!res.data?.isMember);
            } catch (err) {
                console.error('Failed to check membership:', err);
            } finally {
                setCheckingMembership(false);
            }
        }
        if (user) checkMembership();
        else setCheckingMembership(false);
    }, [user]);

    const handleUpgrade = async () => {
        setCheckoutLoading(true);
        try {
            const res = await axios.post('/api/stripe/checkout');
            if (res.data?.url) {
                window.location.href = res.data.url;
            } else {
                toast.error('Could not start checkout. Please try again.');
            }
        } catch (err) {
            console.error('Checkout error:', err);
            toast.error('Checkout failed. Please try again.');
        } finally {
            setCheckoutLoading(false);
        }
    };

    return (
        <div className='min-h-screen py-10 px-4'>
            {/* Page header */}
            <div className='max-w-4xl mx-auto text-center mb-14'>
                <div className='inline-flex items-center gap-2 bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-widest mb-5'>
                    <Sparkles className='w-3.5 h-3.5' />
                    Upgrade to Pro
                </div>
                <h1 className='font-black text-4xl md:text-5xl text-white leading-tight mb-4'>
                    Unlock your full<br />
                    <span className='text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400'>
                        learning potential
                    </span>
                </h1>
                <p className='text-slate-400 text-lg max-w-xl mx-auto leading-relaxed'>
                    Go from 5 courses to unlimited AI-powered learning — with advanced quizzes, full flashcards, and priority generation.
                </p>
            </div>

            {/* Pricing cards */}
            <div className='max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6'>

                {/* Free tier */}
                <div className='border-[2px] border-slate-700/60 bg-slate-800 rounded-2xl p-7 shadow-[4px_4px_0_0_rgba(15,23,42,1)] flex flex-col'>
                    <div className='mb-6'>
                        <h2 className='font-black text-xl text-white mb-1'>Free</h2>
                        <p className='text-slate-500 text-sm'>Everything you need to get started</p>
                    </div>
                    <div className='flex items-end gap-1 mb-8'>
                        <span className='text-5xl font-black text-white'>$0</span>
                        <span className='text-slate-400 text-sm pb-2'>/month</span>
                    </div>
                    <div className='flex flex-col gap-3.5 flex-1 mb-8'>
                        {FREE_FEATURES.map((f, i) => (
                            <FeatureRow key={i} text={f.text} included={f.included} />
                        ))}
                    </div>
                    <Button
                        variant='outline'
                        disabled
                        className='w-full border-slate-700 text-slate-500 rounded-xl font-bold cursor-not-allowed'
                    >
                        Current Plan
                    </Button>
                </div>

                {/* Pro tier */}
                <div className='relative border-[2px] border-indigo-500/60 bg-slate-800 rounded-2xl p-7 shadow-[4px_4px_0_0_rgba(99,102,241,0.4)] flex flex-col overflow-hidden'>
                    {/* Glow */}
                    <div className='absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-violet-500/5 pointer-events-none rounded-2xl' />

                    {/* Badge */}
                    <div className='absolute top-5 right-5 bg-indigo-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest flex items-center gap-1'>
                        <Crown className='w-3 h-3' />
                        Popular
                    </div>

                    <div className='mb-6'>
                        <h2 className='font-black text-xl text-white mb-1'>Pro</h2>
                        <p className='text-slate-400 text-sm'>For serious learners who mean business</p>
                    </div>
                    <div className='flex items-end gap-1 mb-8'>
                        <span className='text-5xl font-black text-white'>$9</span>
                        <span className='text-slate-400 text-sm pb-2'>/month</span>
                    </div>

                    <div className='flex flex-col gap-3.5 flex-1 mb-8'>
                        {PRO_FEATURES.map((f, i) => (
                            <ProFeatureRow key={i} text={f.text} icon={f.icon} />
                        ))}
                    </div>

                    {checkingMembership ? (
                        <Button disabled className='w-full bg-indigo-600 rounded-xl font-bold'>
                            <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                            Checking status...
                        </Button>
                    ) : isMember ? (
                        <div className='w-full flex flex-col items-center gap-3'>
                            <div className='w-full flex items-center justify-center gap-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold rounded-xl py-3 text-sm'>
                                <Crown className='w-4 h-4' />
                                You're a Pro Member!
                            </div>
                            <p className='text-slate-500 text-xs text-center'>
                                Your subscription is active. Enjoy unlimited learning!
                            </p>
                        </div>
                    ) : (
                        <Button
                            onClick={handleUpgrade}
                            disabled={checkoutLoading}
                            className='w-full bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold rounded-xl border border-indigo-700 shadow-lg shadow-indigo-900/40 transition-all py-3'
                        >
                            {checkoutLoading ? (
                                <><Loader2 className='w-4 h-4 mr-2 animate-spin' />Redirecting to checkout...</>
                            ) : (
                                <><Zap className='w-4 h-4 mr-2' />Upgrade to Pro — $9/mo</>
                            )}
                        </Button>
                    )}
                </div>
            </div>

            {/* FAQ / trust section */}
            <div className='max-w-2xl mx-auto mt-16 text-center'>
                <p className='text-slate-500 text-sm'>
                    Secure payment via <span className='text-white font-semibold'>Stripe</span> · Cancel any time · No hidden fees
                </p>
                <div className='mt-8 grid grid-cols-3 gap-6'>
                    {[
                        { label: 'Courses', value: 'Unlimited' },
                        { label: 'Cancellation', value: 'Any time' },
                        { label: 'Support', value: '24 / 7' },
                    ].map((item) => (
                        <div key={item.label} className='border border-slate-700/60 bg-slate-800/60 rounded-xl p-4'>
                            <p className='text-white font-black text-lg'>{item.value}</p>
                            <p className='text-slate-500 text-xs mt-1'>{item.label}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default function UpgradePage() {
    return (
        <>
            {/* Suspense boundary required for useSearchParams in Next.js App Router */}
            <Suspense fallback={null}>
                <SearchParamsListener />
            </Suspense>
            <UpgradePageContent />
        </>
    );
}
