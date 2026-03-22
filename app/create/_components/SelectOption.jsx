import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { GraduationCap, Briefcase, PencilRuler, Code, LayoutGrid } from 'lucide-react'

function SelectOption({ selectedOption, setStep }) {
    const [selected, setSelected] = useState(null);

    const Options = [
        {
            name: 'Exam',
            icon: <GraduationCap size={40} className='text-blue-500' />
        },
        {
            name: 'Job Interview',
            icon: <Briefcase size={40} className='text-green-500' />
        },
        {
            name: 'Practice',
            icon: <PencilRuler size={40} className='text-orange-500' />
        },
        {
            name: 'Coding Prep',
            icon: <Code size={40} className='text-purple-500' />
        },
        {
            name: 'Others',
            icon: <LayoutGrid size={40} className='text-gray-500' />
        },
    ]

    return (
        <div className='flex flex-col items-center w-full max-w-6xl mx-auto'>
            <h2 className='text-6xl font-black tracking-tighter uppercase text-white text-center mb-16'>
                What&apos;s your goal?
            </h2>
            <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-12'>
                {Options.map((option, index) => (
                    <div
                        key={index}
                        onClick={() => {
                            setSelected(option.name);
                            selectedOption(option.name);
                        }}
                        className={`group flex flex-col items-center gap-6 cursor-pointer transition-all duration-300
                            ${selected === option.name ? 'scale-110' : 'hover:scale-105 opacity-60 hover:opacity-100'}`}
                    >
                        <div className={`p-8 rounded-full transition-all duration-300 ${selected === option.name ? 'bg-white text-black shadow-[0_0_50px_rgba(255,255,255,0.3)]' : 'bg-white/5 border border-white/10 group-hover:bg-white/10'}`}>
                            {React.cloneElement(option.icon, {
                                size: 48,
                                className: selected === option.name ? 'text-black' : option.icon.props.className
                            })}
                        </div>
                        <h2 className={`font-bold text-xl transition-all ${selected === option.name ? 'text-white' : 'text-slate-400'}`}>
                            {option.name}
                        </h2>
                    </div>
                ))}
            </div>

            <div className='mt-32 flex justify-between items-center w-full'>
                <p className='text-slate-500 text-sm uppercase tracking-widest font-bold font-mono'>
                    Step 01 / 02
                </p>
                <Button
                    disabled={!selected}
                    onClick={() => setStep(1)}
                    className='px-12 py-8 text-xl rounded-full bg-white text-black hover:bg-slate-200 transition-all font-black uppercase tracking-tight'
                >
                    Next Step
                </Button>
            </div>
        </div>
    )
}

export default SelectOption