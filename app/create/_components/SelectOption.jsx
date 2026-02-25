import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { GraduationCap, Briefcase, PencilRuler, Code, LayoutGrid } from 'lucide-react'

function SelectOption() {
    const [selectedOption, setSelectedOption] = useState(null);

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
        <div className='flex flex-col items-center w-full max-w-4xl mx-auto'>
            <h2 className='text-2xl font-bold text-primary text-center mb-8'>Select Your Goal</h2>
            <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6'>
                {Options.map((option, index) => (
                    <div
                        key={index}
                        onClick={() => setSelectedOption(option.name)}
                        className={`p-6 border rounded-2xl hover:border-primary cursor-pointer transition-all flex flex-col items-center gap-3
                            ${selectedOption === option.name ? 'border-primary bg-primary/5 shadow-md scale-105' : 'bg-white shadow-sm hover:bg-slate-50 opacity-80 hover:opacity-100'}`}
                    >
                        <div className='p-3 rounded-full bg-slate-50'>
                            {option.icon}
                        </div>
                        <h2 className='font-semibold text-sm'>{option.name}</h2>
                    </div>
                ))}
            </div>

            <div className='mt-20 flex justify-between items-center w-full'>
                <p className='text-gray-400 text-sm italic'>* Select one to proceed</p>
                <Button disabled={!selectedOption} className='px-10 py-6 text-lg rounded-xl shadow-lg hover:scale-105 transition-transform'>
                    Next Step
                </Button>
            </div>
        </div>
    )
}

export default SelectOption