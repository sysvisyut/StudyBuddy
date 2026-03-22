import { pgTable, varchar, integer, boolean, serial, json } from 'drizzle-orm/pg-core';


export const USER_TABLE = pgTable('users', {
    id: serial().primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    isMember: boolean().default(false),



})

export const STUDY_MATERIAL_TABLE = pgTable('study_material', {
    id: serial().primaryKey(),
    courseId: varchar().notNull(),
    courseType: varchar().notNull(),
    topic: varchar().notNull(),
    difficultyLevel: varchar().default('Easy'),
    courseLayout: json(),
    createdBy: varchar().notNull(),

})