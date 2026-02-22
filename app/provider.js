"use client"
import React, { useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import axios from 'axios'

function Provider({ children }) {
    const { user } = useUser();

    const CheckIsNewUser = async () => {
        // We now call the API route instead of accessing the DB directly
        const resp = await axios.post('/api/create-user', { user: user });
        console.log(resp.data);
    }

    useEffect(() => {
        user && CheckIsNewUser();
    }, [user]);

    return (
        <div>
            {children}
        </div>
    )
}

export default Provider