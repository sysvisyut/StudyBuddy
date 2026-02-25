"use client"

import React, { useState } from 'react'
import SelectOption from './_components/SelectOption';

function Create() {
    const [step, setStep] = useState(0);
    return (
        <div className='flex flex-col items-center p-5 md:px-24 lg:px-36 mt-10'>
            <h2 className='font-bold text-4xl text-primary'>Start Building Your Personalized Study material</h2>
            <p className='text-gray-500 text-lg'>Fill all the details below to generate your study material</p>
            <div className='mt-10'>
                {step == 0 ? <SelectOption /> : null}
            </div>
        </div>
    )
}

export default Create