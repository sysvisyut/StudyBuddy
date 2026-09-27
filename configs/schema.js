import { pgTable, varchar, integer, boolean, serial, json, text, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core';

export const USER_TABLE = pgTable('users', {
    id: serial().primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    isMember: boolean().default(false),
    stripeCustomerId: varchar('stripeCustomerId', { length: 255 }),
    stripeSubscriptionId: varchar('stripeSubscriptionId', { length: 255 }),
}, (table) => [
    uniqueIndex('idx_users_email').on(table.email),
    index('idx_users_stripe_subscription_id').on(table.stripeSubscriptionId),
]);

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
}, (table) => [
    uniqueIndex('idx_study_material_course_id').on(table.courseId),
    index('idx_study_material_created_by').on(table.createdBy),
    index('idx_study_material_status').on(table.status),
]);

export const CHAPTER_NOTES_TABLE = pgTable('chapterNotes', {
    id: serial().primaryKey(),
    courseId: varchar().notNull(),
    chapterId: integer().notNull(),
    notes: text()
}, (table) => [
    index('idx_chapter_notes_course_id').on(table.courseId),
]);

export const STUDY_TYPE_CONTENT_TABLE = pgTable('studyTypeContent', {
    id: serial().primaryKey(),
    courseId: varchar('courseId').notNull(),
    content: json('content').notNull(),
    type: varchar('type').notNull(),
    status: varchar('status').default('Generating'),
    createdAt: timestamp('createdAt').defaultNow(),
}, (table) => [
    index('idx_study_type_content_course_id').on(table.courseId),
    index('idx_study_type_content_course_type').on(table.courseId, table.type),
]);