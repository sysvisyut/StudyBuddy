"use client"
import React, { useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import axios from 'axios'
import { Toaster } from 'sonner'

function Provider({ children }) {
    const { user } = useUser();

    useEffect(() => {
        async function CheckIsNewUser() {
            try {
                const resp = await axios.post('/api/create-user', { user: user });
                console.log(resp.data);
            } catch (error) {
                console.error("Database connection error (offline):", error.message);
            }
        }

        if (user) {
            CheckIsNewUser();
        }
    }, [user]);

    return (
        <div>
            {children}
            <Toaster position="top-right" richColors />
        </div>
    )
}

export default Provider