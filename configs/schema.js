import { pgTable, varchar, integer, boolean, serial, json, text, timestamp } from 'drizzle-orm/pg-core';


export const USER_TABLE = pgTable('users', {
    id: serial().primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    isMember: boolean().default(false),
    stripeCustomerId: varchar('stripeCustomerId', { length: 255 }),
    stripeSubscriptionId: varchar('stripeSubscriptionId', { length: 255 }),
})

export const STUDY_MATERIAL_TABLE = pgTable('study_material', {
    id: serial().primaryKey(),
    courseId: varchar('courseId').notNull(),
    courseType: varchar('courseType').notNull(),
    topic: varchar('topic').notNull(),
    difficultyLevel: varchar('difficultyLevel').default('Easy'),
    courseLayout: json('courseLayout'),
    createdBy: varchar('createdBy').notNull(),
    status: varchar('status').default('Generating'),
    createdAt: timestamp('createdAt').defaultNow(),
})

export const CHAPTER_NOTES_TABLE = pgTable('chapterNotes',{
    id:serial().primaryKey(),
    courseId:varchar().notNull(),
    chapterId:integer().notNull(),
    notes:text()
})

export const STUDY_TYPE_CONTENT_TABLE = pgTable('studyTypeContent',{
    id:serial().primaryKey(),
    courseId:varchar('courseId').notNull(),
    content:json('content').notNull(),
    type:varchar('type').notNull(),
    status:varchar('status').default('Generating'),
    createdAt: timestamp('createdAt').defaultNow(),
})