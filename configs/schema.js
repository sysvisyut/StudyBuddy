import { pgTable, varchar, integer, boolean, serial } from 'drizzle-orm/pg-core';


export const USER_TABLE= pgTable('users', {
    id:serial().primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    isMember: boolean().default(false),
    

    
})