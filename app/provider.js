import React from 'react'
import { useUser } from '@clerk/nextjs'
import { db } from '@/db'
import { USER_TABLE } from '@/db/schema'
import { eq } from 'drizzle-orm'

function Provider({children}) {

    const {user} = useUser();

    useEffect(() => {
        if(user){
            user&&CheckIsNewUser();
        }
    }, [user]);
    
    const CheckIsNewUser=async()=>{
        const result = await db.select().from(USER_TABLE)
        .where(eq(USER_TABLE.email,user?.primaryEmailAddress?.emailAddress))
        console.log(result);

        if(result?.length ==0){
            const userResp = await db.insert(USER_TABLE).values({
                name:user?.fullName,
                email:user?.primaryEmailAddress?.emailAddress,
            }).returning({id:USER_TABLE.id})
            console.log(userResp);
        }
        const resp = await axios.post('/api/create-user',{user:user});
        console.log(resp);
    }
  return (
    <div>
        {children}
    </div>
  )
}

export default Provider