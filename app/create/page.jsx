"use client"

import React, { useState } from 'react'
import SelectOption from './_components/SelectOption';
import TopicInput from './_components/TopicInput';
import { Button } from '@/components/ui/button';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { useUser } from '@clerk/nextjs';

function Create() {
    const [step, setStep] = useState(0);
    const [formData, setFormData] = useState([]);
    const { user } = useUser();

    const handleInputChange = (userInput, fieldName) => {
        setFormData(prev => ({
            ...prev,
            [fieldName]: userInput
        }))
    }
    /*
    Used to save user input and generate AI course layout
    */

    const GenerateCourseOutline = async () => {
        const courseId = uuidv4();
        const result = await axios.post('/api/generate-course-outline', {
            courseId: courseId,
            topic: formData?.topic || "Custom Topic",
            courseType: formData?.option || "Standard",
            difficultyLevel: formData?.difficulty || "Medium",
            createdBy: user?.primaryEmailAddress?.emailAddress
        });

        console.log(result);
    }

    return (
        <div className='flex flex-col items-center p-10 md:px-24 lg:px-36 mt-20 w-full relative z-10'>
            <h2 className='font-black text-6xl uppercase tracking-tighter text-white text-center leading-none'>
                Create Something Great
            </h2>
            <p className='text-slate-400 text-xl text-center mt-6 font-medium max-w-2xl'>
                Our AI will craft your personalized study material in seconds. Just follow the steps below.
            </p>

            <div className='mt-20 w-full'>
                {step == 0 ?
                    <SelectOption
                        selectedOption={(v) => handleInputChange(v, 'option')}
                        setStep={setStep}
                    /> :
                    <TopicInput
                        setTopic={(v) => handleInputChange(v, 'topic')}
                        setDifficulty={(v) => handleInputChange(v, 'difficulty')}
                    />
                }
            </div>

            <div className='flex justify-between w-full mt-40 max-w-6xl'>
                {step != 0 ? (
                    <Button
                        variant="outline"
                        onClick={() => setStep(step - 1)}
                        className='px-10 py-8 text-xl rounded-full border-white/20 text-white hover:bg-white hover:text-black transition-all font-black uppercase tracking-tight'
                    >
                        Previous
                    </Button>
                ) : <div />}

                {step == 0 ? null : (
                    <Button
                        onClick={() => GenerateCourseOutline()}
                        className='px-12 py-8 text-xl rounded-full bg-white text-black hover:bg-slate-200 transition-all font-black uppercase tracking-tight'
                    >
                        Generate
                    </Button>
                )}
            </div>
        </div>
    )
}

export default Create