import { pgTable, varchar, integer, boolean, serial, json, text } from 'drizzle-orm/pg-core';


export const USER_TABLE = pgTable('users', {
    id: serial().primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    isMember: boolean().default(false),



})

export const STUDY_MATERIAL_TABLE = pgTable('study_material', {
    id: serial().primaryKey(),
    courseId: varchar('courseId').notNull(),
    courseType: varchar('courseType').notNull(),
    topic: varchar('topic').notNull(),
    difficultyLevel: varchar('difficultyLevel').default('Easy'),
    courseLayout: json('courseLayout'),
    createdBy: varchar('createdBy').notNull(),
    status: varchar('status').default('Generating')
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
    type:varchar('status').notNull(),
    status:varchar('status').default('Generating')
})