# PROJECT_CONTEXT.md — Study Buddy Complete Technical Knowledge Base

> **Generated:** 2026-08-19  
> **Purpose:** Complete technical knowledge base for onboarding, interviews, debugging, feature development, and architectural reasoning — without access to the source code.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [High-Level Architecture](#2-high-level-architecture)
3. [Repository Structure](#3-repository-structure)
4. [Complete File-by-File Documentation](#4-complete-file-by-file-documentation)
5. [Application Flows](#5-application-flows)
6. [Folder Deep Dive](#6-folder-deep-dive)
7. [Components / Modules](#7-components--modules)
8. [Database Documentation](#8-database-documentation)
9. [API Documentation](#9-api-documentation)
10. [Authentication & Authorization](#10-authentication--authorization)
11. [State Management](#11-state-management)
12. [Important Design Patterns](#12-important-design-patterns)
13. [Important Business Logic](#13-important-business-logic)
14. [External Services](#14-external-services)
15. [Configuration](#15-configuration)
16. [Error Handling](#16-error-handling)
17. [Performance](#17-performance)
18. [Security](#18-security)
19. [Testing](#19-testing)
20. [Build & Deployment](#20-build--deployment)
21. [Complete Dependency Map](#21-complete-dependency-map)
22. [End-to-End Data Flow](#22-end-to-end-data-flow)
23. [Interview Preparation Guide](#23-interview-preparation-guide)
24. [Knowledge Gaps](#24-knowledge-gaps)
25. [Executive Summary](#25-executive-summary)

---

# 1. Project Overview

## What Is Study Buddy?

Study Buddy is a **full-stack SaaS (Software-as-a-Service) web application** that uses artificial intelligence to transform any topic into a complete, structured learning experience. A user provides a subject (e.g., "Quantum Computing", "JavaScript Closures", "French History"), selects a course type and difficulty level, and the system synthesises a multi-chapter curriculum entirely from scratch — no source document required.

## Business Problem Solved

Traditional studying requires learners to gather scattered resources, organize them, and create study aids (flashcards, practice questions) manually. This is time-consuming and inconsistent in quality. Study Buddy eliminates this friction: from one click, a student gets:

- A structured, multi-chapter course outline
- Detailed HTML exam notes for every chapter
- AI-generated flashcards
- Multiple-choice quizzes with answer feedback and scoring

## Target Users

- **Students** preparing for exams
- **Self-learners** exploring new topics without a formal curriculum
- **Job seekers** cramming technical interview topics
- **Professionals** needing quick, structured overviews of unfamiliar domains

## Major Capabilities

| Capability | Description |
|---|---|
| Course creation wizard | Two-step form: course type → topic + difficulty |
| AI outline generation | Gemini 2.5 Flash generates structured JSON outlines |
| Background notes generation | Chapter notes generated async via fire-and-forget |
| Flip-card flashcard system | Carousel with per-card flip, progress bar, polling |
| Interactive quiz engine | MCQ with immediate feedback, score + grade screen |
| Chapter notes reader | Paginated HTML-rendered notes with chapter navigation |
| Real-time status polling | Client polls every 4–5 s; toast fires when content is ready |
| Stripe subscription billing | Freemium model; Pro unlocks unlimited courses |
| Clerk authentication | Sign-in/sign-up; route-level middleware protection |
| Auto user provisioning | API call creates DB record on first login |
| Course deletion | Optimistic UI removal with confirm modal |
| Aurora background | WebGL OGL-powered animated background on landing/create |

## Overall Architecture Style

Study Buddy is a **monolithic Next.js App Router application** with three layers of async execution:

1. **React Client** — browser-rendered UI components
2. **Next.js API Routes** — server-side handlers (Node.js)
3. **Inngest Durable Functions** — event-driven background job layer

There is no separate backend service — everything is co-located inside the Next.js project. The database is a serverless Neon PostgreSQL instance accessed via Drizzle ORM through HTTP (no persistent connection pool).

## Technology Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.1.6 |
| Language | JavaScript / TypeScript (mixed) | JS (runtime), TS (types) |
| Styling | Tailwind CSS v4 + shadcn/ui + tw-animate-css | v4 |
| UI Components | shadcn/ui (Radix UI primitives) | v3.8.4 |
| Icons | Lucide React | 0.563.0 |
| Carousel | Embla Carousel (via shadcn) | 8.6.0 |
| Card flip | react-card-flip | 1.2.3 |
| AI | Google Gemini 2.5 Flash (`@google/generative-ai`) | 0.24.1 |
| Authentication | Clerk (`@clerk/nextjs`) | 6.37.3 |
| Database | Neon serverless PostgreSQL | 1.0.2 |
| ORM | Drizzle ORM + Drizzle Kit | 0.45.1 |
| Background jobs | Inngest | 2.7.2 |
| Payments | Stripe | 22.3.0 |
| HTTP client | Axios | 1.7.9 |
| WebGL | OGL | 1.0.11 |
| Toasts | Sonner | 2.0.7 |
| ID generation | uuid | 13.0.0 |
| Linting | ESLint + eslint-config-next | 9 |

## Deployment Architecture

- **Hosting:** Vercel (implied by Next.js and project structure)
- **Database:** Neon Tech serverless PostgreSQL (HTTP driver, no persistent connections)
- **Background jobs:** Inngest cloud (or `inngest-cli` for local dev)
- **Auth provider:** Clerk (external OAuth/email provider)
- **Payments:** Stripe hosted Checkout + Webhooks
- **AI:** Google Generative AI API (Gemini 2.5 Flash)

---

# 2. High-Level Architecture

```
Browser (React)
  /           Landing page + Aurora background
  /create     Two-step wizard -> POST /api/generate-course-outline
  /dashboard  CourseList (polls every 5 s) + SideBar
  /dashboard/upgrade  Pricing page -> POST /api/stripe/checkout
  /course/[id]        CourseIntroCard + StudyMaterialSection
  /course/[id]/notes      Paginated HTML reader
  /course/[id]/flashcards Carousel + polling
  /course/[id]/quiz       MCQ engine + results
        |
        | HTTPS / Axios
        v
Next.js API Routes (Node.js runtime)
  POST /api/generate-course-outline  -> AI -> DB insert -> background gen
  POST /api/study-type-content       -> DB placeholder -> AI -> DB update
  POST /api/study-type               -> DB read (flashcard/quiz/notes)
  GET  /api/courses                  -> Single course fetch
  POST /api/courses                  -> User course list
  DELETE /api/courses                -> Delete course + notes
  POST /api/create-user              -> Upsert user in DB
  GET  /api/user                     -> Fetch isMember status
  POST /api/stripe/checkout          -> Create Stripe Checkout session
  POST /api/stripe/webhook           -> Verify sig -> mark Pro member
  GET+POST+PUT /api/inngest          -> Inngest event handler endpoint
        |                    |
        | Drizzle ORM        | Inngest SDK
        v                    v
  Neon PostgreSQL      Inngest Durable Functions
    users                CreateNewUser  (user.created)
    study_material       GenerateNotes  (notes.generate)
    chapterNotes         GenerateStudyTypeContent (studyType.content)
    studyTypeContent
```

## Layer Responsibilities

### Frontend (React / Next.js App Router)
- Renders all pages as React Server Components or Client Components (`"use client"`)
- Manages local UI state (loading, polling intervals, form data)
- Makes all data requests via Axios to Next.js API routes
- Implements real-time generation status with client-side polling
- Handles Stripe redirect outcomes via URL search params

### API Layer (Next.js API Routes)
- Receives HTTP requests from the browser
- Authenticates users via Clerk (`currentUser()` / `auth.protect()`)
- Reads/writes to Neon PostgreSQL via Drizzle ORM
- Calls Google Gemini API for AI generation
- Creates Stripe Checkout sessions and verifies webhook signatures
- Emits Inngest events for background job dispatch

### Background Jobs (Inngest)
- Receives events from the API layer (`user.created`, `notes.generate`, `studyType.content`)
- Executes long-running AI generation tasks without blocking HTTP responses
- Updates database records with results and status changes
- Provides durability: failed steps can be retried automatically

### Database (Neon PostgreSQL + Drizzle ORM)
- Persists all application state: users, courses, notes, study content
- Uses HTTP driver (serverless-safe; no persistent TCP connections)
- Drizzle ORM provides type-safe query building and migrations

### External Services
- **Clerk:** User identity, session tokens, OAuth
- **Stripe:** Subscription billing, webhook-verified plan upgrades
- **Google Gemini 2.5 Flash:** AI text/JSON generation
- **Inngest:** Durable event-driven job execution

---

# 3. Repository Structure

```
study-buddy/
├── app/                          # Next.js App Router root
│   ├── (auth)/                   # Auth route group (Clerk UI)
│   │   ├── sign-in/
│   │   └── sign-up/
│   ├── _components/              # App-level shared components
│   │   ├── Aurora.jsx            # WebGL aurora background
│   │   └── Aurora.css
│   ├── api/                      # API route handlers
│   │   ├── courses/route.js      # CRUD for courses
│   │   ├── create-user/route.js  # User upsert
│   │   ├── generate-course-outline/route.js
│   │   ├── inngest/route.js      # Inngest serve endpoint
│   │   ├── stripe/
│   │   │   ├── checkout/route.js
│   │   │   └── webhook/route.js
│   │   ├── study-type/route.js
│   │   ├── study-type-content/route.js
│   │   └── user/route.js
│   ├── course/
│   │   └── [courseId]/
│   │       ├── _components/
│   │       │   ├── CourseIntroCard.jsx
│   │       │   ├── StudyMaterialSection.jsx
│   │       │   ├── ChapterList.jsx
│   │       │   └── MaterialCardItem.jsx
│   │       ├── flashcards/page.jsx
│   │       ├── notes/page.jsx
│   │       ├── quiz/page.jsx
│   │       ├── layout.jsx
│   │       └── page.jsx
│   ├── create/
│   │   ├── _components/
│   │   │   ├── SelectOption.jsx
│   │   │   └── TopicInput.jsx
│   │   └── page.jsx
│   ├── dashboard/
│   │   ├── _components/
│   │   │   ├── SideBar.jsx
│   │   │   ├── CourseList.jsx
│   │   │   ├── CourseCardItem.jsx
│   │   │   ├── DashboardHeader.jsx
│   │   │   └── welcomeBanner.jsx
│   │   ├── profile/page.jsx
│   │   ├── upgrade/page.jsx
│   │   ├── layout.jsx
│   │   └── page.jsx
│   ├── globals.css
│   ├── layout.jsx
│   ├── page.jsx
│   └── provider.js
├── components/
│   └── ui/                       # shadcn/ui primitives
├── configs/
│   ├── AiModel.js                # Gemini model instances
│   ├── db.js                     # Neon + Drizzle connection
│   └── schema.js                 # All DB table definitions
├── inngest/
│   ├── client.js                 # Inngest client singleton
│   └── functions.js              # All Inngest function definitions
├── lib/
│   ├── studyContent.js           # Shared validators + JSON extraction
│   └── utils.ts                  # shadcn cn() utility
├── drizzle/                      # Drizzle Kit migration SQL files
├── drizzle.config.js
├── middleware.js                 # Clerk route protection
├── next.config.ts
├── components.json
├── tsconfig.json
├── package.json
└── test-gen.js
```

---

# 4. Complete File-by-File Documentation

---

## `configs/db.js`

### Purpose
Exports the single shared Drizzle ORM database client used across all API routes and Inngest functions.

### Responsibilities
- Initialises a Neon HTTP SQL driver from `DATABASE_CONNECTION_STRING`
- Wraps it with Drizzle ORM to provide a typed query builder

### Important Exports
- `db` — the Drizzle client instance. All DB queries in the app import this singleton.

### Data Flow
`process.env.DATABASE_CONNECTION_STRING` -> `neon()` (HTTP driver) -> `drizzle(sql)` -> exported `db` object used everywhere.

### Dependencies
- **External:** `@neondatabase/serverless`, `drizzle-orm/neon-http`

### Design Notes
The Neon **HTTP** driver (`neon-http`) is used instead of a WebSocket/TCP driver. This is intentional for serverless environments (Vercel/Edge) where persistent connections are unavailable. Every query creates a new HTTP request to Neon's pooled endpoint.

### Interview Questions
- Why use the Neon HTTP driver instead of `pg` (node-postgres)?
- What trade-offs does an HTTP-based DB driver introduce vs. connection pooling?

---

## `configs/schema.js`

### Purpose
Defines the entire database schema using Drizzle ORM's schema-definition DSL. Single source of truth for all database tables.

### Important Tables

#### `users` (USER_TABLE)
| Column | Type | Notes |
|---|---|---|
| `id` | serial (PK) | Auto-increment integer primary key |
| `name` | varchar(255) | User's full name from Clerk |
| `email` | varchar(255) | Primary email from Clerk; business key |
| `isMember` | boolean | `false` = free tier; `true` = Pro subscriber |
| `stripeCustomerId` | varchar(255) | Stripe Customer object ID |
| `stripeSubscriptionId` | varchar(255) | Stripe Subscription object ID |

#### `study_material` (STUDY_MATERIAL_TABLE)
| Column | Type | Notes |
|---|---|---|
| `id` | serial (PK) | Auto-increment |
| `courseId` | varchar | UUID assigned at creation; business key |
| `courseType` | varchar | e.g. "Exam", "Job Interview", "Coding Prep" |
| `topic` | varchar | Free-text topic entered by user |
| `difficultyLevel` | varchar | "Easy" / "Medium" / "Hard"; defaults to "Easy" |
| `courseLayout` | json | Full AI-generated outline: chapters, summaries, emojis |
| `createdBy` | varchar | User email address (denormalized) |
| `status` | varchar | "Generating" -> "Ready" state machine |
| `createdAt` | timestamp | Auto-set on insert |

#### `chapterNotes` (CHAPTER_NOTES_TABLE)
| Column | Type | Notes |
|---|---|---|
| `id` | serial (PK) | Auto-increment |
| `courseId` | varchar | Links to study_material.courseId |
| `chapterId` | integer | Zero-based chapter index |
| `notes` | text | Full HTML content generated by Gemini |

#### `studyTypeContent` (STUDY_TYPE_CONTENT_TABLE)
| Column | Type | Notes |
|---|---|---|
| `id` | serial (PK) | Auto-increment |
| `courseId` | varchar | Links to study_material.courseId |
| `content` | json | Array of flashcard or quiz objects |
| `type` | varchar | "flashcard" or "quiz" (lowercase canonical) |
| `status` | varchar | "Generating" -> "Ready" or "Failed" |
| `createdAt` | timestamp | Auto-set on insert |

### Design Notes
- No formal foreign key constraints at ORM level; referential integrity enforced in application logic
- `courseId` is a UUID string (not the auto-increment `id`) because it is assigned on the client at course creation time using `uuid()`, before the DB insert

---

## `configs/AiModel.js`

### Purpose
Creates and exports pre-configured Google Gemini model instances, each tuned for a specific generation task.

### Base Configuration (`generationConfig`)
- `temperature: 0.7` — moderate creativity
- `topP: 0.95`, `topK: 64` — nucleus/top-k sampling
- `maxOutputTokens: 8192`
- `responseMimeType: "application/json"` — forces JSON output

### Important Exports

#### `courseOutlineAIModel`
- Model: `gemini-2.5-flash`; JSON output; stateless `generateContent()` calls
- Used by: `POST /api/generate-course-outline`
- Purpose: Generates structured course outline JSON

#### `generateNotesAiModel`
- Model: `gemini-2.5-flash`; `responseMimeType: "text/plain"` (HTML output)
- Type: **Chat session** with seeded example exchange (user: chapter details, model: HTML notes)
- Used by: background notes generation
- Purpose: Generates HTML exam notes per chapter

#### `generateStudyTypeContentAiModel`
- Model: `gemini-2.5-flash`; JSON output
- Type: **Chat session** with flashcard example in history
- Used by: `inngest/functions.js -> GenerateStudyTypeContent` (legacy/secondary path)

#### `GenerateQuizAiModel`
- Model: `gemini-2.5-flash`; JSON output
- Type: **Chat session** with quiz example in history

### Design Notes
- The **chat session pattern** with seeded history is few-shot prompting via conversation history — highly effective for enforcing strict output formats
- `NEXT_PUBLIC_GEMINI_API_KEY` prefix exposes the key to the browser bundle — a security risk (should be server-only)

---

## `inngest/client.js`

### Purpose
Creates and exports the single Inngest client instance used throughout the application.

### Responsibilities
- Initialises Inngest with app name `"study-buddy"`
- Used both to define functions and to send events

---

## `inngest/functions.js`

### Purpose
Defines all durable background functions executed by the Inngest event system.

### Functions

#### `helloWorld`
- Trigger: `test/hello.world` — test function, not used in production

#### `CreateNewUser`
- Trigger: `user.created`
- Receives Clerk user object in `event.data.user`
- Step: checks `USER_TABLE` by email; inserts if absent
- Idempotent: safe to call multiple times

#### `GenerateNotes`
- Trigger: `notes.generate`
- Receives `{ course }` with `courseId` and `courseLayout`
- Step 1: Iterates chapters sequentially; for each: calls `generateNotesAiModel.sendMessage()`, inserts into `CHAPTER_NOTES_TABLE`; per-chapter try/catch (skips failed chapters)
- Step 2: Updates `STUDY_MATERIAL_TABLE.status = 'Ready'` regardless of partial failures
- Error philosophy: "Partial notes are better than none"

#### `GenerateStudyTypeContent`
- Trigger: `studyType.content`
- Receives `{ studyType, prompt, courseId, recordId }`
- Step 1: Calls AI (Flashcard model or Quiz model based on studyType); strips markdown fences; parses JSON
- Step 2: Updates `STUDY_TYPE_CONTENT_TABLE` record with content and `status: 'Ready'`
- **Known bug:** References `GenerateQuizAiModel` which is not imported in this file

### Inngest Step Guarantees
- Each `step.run()` is independently retryable
- If step 2 fails, Inngest re-runs only step 2 (step 1 result is cached)

---

## `middleware.js`

### Purpose
Enforces Clerk authentication at the route level before any page or API handler processes the request.

### Protected Routes
`/dashboard(.*)`, `/create(.*)`, `/course(.*)`

### Behavior
- Protected + unauthenticated: redirects to Clerk sign-in page
- Runs for all non-static requests and all API routes

---

## `app/layout.jsx`

### Purpose
Root Next.js layout. Wraps entire app in Clerk authentication context.

### Responsibilities
- Wraps everything in `<ClerkProvider>` for auth context
- Renders `<Provider>` (user-provisioning wrapper)
- Renders `<Toaster>` (Sonner toast container)
- Sets SEO metadata: title "Study Buddy", description "AI Study Material Generator"

---

## `app/provider.js`

### Purpose
Client-side wrapper that fires user-provisioning API call on every authenticated load.

### Responsibilities
- Uses `useUser()` from Clerk
- On user session available: calls `POST /api/create-user` with Clerk user object
- Upserts user into `users` table (creates if new, returns existing)
- Renders Sonner `<Toaster>` at `top-right` with `richColors`

### Design Notes
- Fires on every app load when authenticated, not just first signup
- Idempotent: API does nothing if user already exists

---

## `app/create/page.jsx`

### Purpose
Two-step course creation wizard.

### State
- `step` (0 or 1): controls which sub-component renders
- `formData`: `{ option, topic, difficulty }` accumulated across steps

### `GenerateCourseOutline()` Function
1. Generates UUID via `uuidv4()` for `courseId`
2. Fires `POST /api/generate-course-outline` (**fire-and-forget, no await**)
3. Shows toast
4. `router.replace('/dashboard')` — immediate redirect

### Design Notes
- `courseId` UUID generated on client before server response — enables immediate redirect
- API call is truly fire-and-forget; errors are not surfaced to the user

---

## `app/api/generate-course-outline/route.js`

### Purpose
Primary course creation API handler. Generates AI course outline and kicks off background note generation.

### Flow
1. Parse `{ courseId, topic, courseType, difficultyLevel, createdBy }`
2. Call Gemini: `courseOutlineAIModel.generateContent(prompt)` → JSON outline
3. Insert into `STUDY_MATERIAL_TABLE` with `status: 'Generating'`
4. Call `generateNotesInBackground(insertedCourse).catch(...)` — fire-and-forget
5. Return HTTP 200 with the inserted course object

### `generateNotesInBackground(insertedCourse)` (private async)
- Iterates chapters sequentially
- Per-chapter: calls Gemini for HTML notes, inserts into `CHAPTER_NOTES_TABLE`
- After all chapters: `UPDATE study_material SET status='Ready'`
- Per-chapter try/catch prevents one failure from aborting all

---

## `app/api/courses/route.js`

### Purpose
CRUD handler for courses.

### Endpoints

**GET** `/api/courses?courseId=xxx`
- Returns single course object: `{ result: course }`

**POST** `/api/courses`
- Body: `{ createdBy: "email" }`
- Returns all user courses ordered by id DESC: `{ result: [] }`

**DELETE** `/api/courses?courseId=xxx`
- Deletes `chapterNotes` first, then `study_material`
- Returns `{ success: true, courseId }`

---

## `app/api/create-user/route.js`

### Purpose
Upserts user into `users` table on first sign-in.

### Flow
- Check `USER_TABLE` by email
- If absent: INSERT `{ name, email }` → return new record
- If present: return existing record

---

## `app/api/study-type-content/route.js`

### Purpose
Generates flashcards or quiz questions for a course and persists to DB.

### Flow
1. Validate `{ courseId, type, chapters, topic }`
2. Normalize type to lowercase
3. Delete existing rows for `(courseId, type)` — upsert-via-delete
4. Insert placeholder: `{ status: 'Generating', content: [] }`
5. Build prompt (`buildFlashcardPrompt` or `buildQuizPrompt`)
6. Call Gemini up to 2 attempts with validation between
7. On success: update record `{ status: 'Ready', content: [...] }`
8. On total failure: update `{ status: 'Failed' }`, return 500

### Prompt Builders

**`buildFlashcardPrompt(topic)`**
- Requests 12 flashcards in `[{ "front": "...", "back": "..." }]` format
- Strict instructions: no markdown, no prose, return only JSON array

**`buildQuizPrompt(topic)`**
- Requests 15 MCQ questions in `[{ question, options: [4 strings], correctAnswer, explanation }]`
- `correctAnswer` must exactly match one option string
- No option numbering prefixes

**`callGemini(prompt)`**
- Fresh stateless model instance per call (not chat session)
- `temperature: 0.5`, JSON MIME type, `maxOutputTokens: 8192`

---

## `app/api/study-type/route.js`

### Purpose
Reads study content (flashcards, quiz, notes) for a course.

### Modes (via `studyType` field)

**`'ALL'`**
- Returns `{ notes: [], flashcard: [], quiz: [], qa: [] }`
- Uses Promise.all for parallel queries
- Groups by canonical type; prefers Ready > Generating

**`'NOTES'`**
- Returns raw chapterNotes array

**`'flashcard' | 'quiz' | 'qa'`**
- Returns normalized single row or `null`

### `normalizeRow(row)` (private)
- Canonicalizes type string
- Validates content items against schema; drops malformed ones silently
- Returns `{ id, courseId, type, status, content }`

### `findContentRow(courseId, canonicalType)` (private)
- Queries for both lowercase and legacy capitalized variants in one query
- If multiple rows: prefer Ready > Generating > highest id

---

## `app/api/stripe/checkout/route.js`

### Purpose
Creates Stripe-hosted Checkout session for Pro subscription.

### Flow
1. Lazy-import Stripe to avoid build crash
2. `currentUser()` from Clerk — returns 401 if unauthenticated
3. `stripe.checkout.sessions.create()` with subscription mode
4. Embeds `metadata.userEmail` for webhook lookup
5. Returns `{ url: session.url }`

### Redirect URLs
- Success: `/dashboard?upgraded=true`
- Cancel: `/dashboard/upgrade?cancelled=true`

---

## `app/api/stripe/webhook/route.js`

### Purpose
Receives and verifies Stripe webhook events to upgrade user accounts.

### Security
- `req.text()` preserves raw body for HMAC verification
- `stripe.webhooks.constructEvent(body, sig, secret)` — rejects forged webhooks
- `export const dynamic = 'force-dynamic'` prevents Next.js caching

### On `checkout.session.completed`
- Extract `userEmail` from `session.metadata`
- `UPDATE users SET isMember=true, stripeCustomerId=..., stripeSubscriptionId=...`
- Returns `{ received: true }` for all other event types

---

## `app/api/inngest/route.js`

### Purpose
Exposes the Inngest HTTP serve endpoint.

### Responsibilities
- Registers `CreateNewUser`, `GenerateNotes`, `GenerateStudyTypeContent`
- Exports `GET`, `POST`, `PUT` handlers for Inngest discovery and event delivery

---

## `app/dashboard/_components/SideBar.jsx`

### Purpose
Persistent left-hand navigation panel.

### Responsibilities
- App logo + name
- "+ Create New" button -> `/create`
- Navigation: Dashboard, Upgrade (with PRO badge), Profile
- Bottom panel: member state ("Pro Plan Active") or free state (credits progress + "Upgrade Now")
- Fetches membership from `GET /api/user?email=...` on mount

---

## `app/dashboard/_components/CourseList.jsx`

### Purpose
Displays user's courses as a responsive grid with real-time polling.

### Polling Logic
- After initial fetch, if **any** course has `status: 'Generating'`, starts 5 s polling
- On each poll: compares previous vs. new statuses
- If any course transitioned `'Generating'` -> `'Ready'`: fires success toast
- Stops polling when no course is generating

### Optimistic Delete
- `handleDelete(courseId)` removes course from local state immediately (before server confirmation)

---

## `app/course/[courseId]/_components/StudyMaterialSection.jsx`

### Purpose
Study mode selection grid (Notes, Flashcards, Quiz, Test Series, Record and Learn).

### Material List
| Mode | Type | Path |
|---|---|---|
| Notes/Chapters | notes | `/course/[id]/notes` |
| Flashcards | flashcard | `/course/[id]/flashcards` |
| Quiz | quiz | `/course/[id]/quiz` |
| Test Series | qa | `/course/[id]/test` |
| Record and Learn | null | `/course/[id]/voice` |

### Polling
- Fetches `POST /api/study-type { studyType: 'ALL' }` on mount
- Polls every 5 s while any content row has `status: 'Generating'`

---

## `app/course/[courseId]/_components/MaterialCardItem.jsx`

### Purpose
Single study mode card with status badge and action button.

### Status Logic
- `notes` type: always `'Ready'`
- `null` type (Record and Learn): "Coming Soon"
- Otherwise: derived from `studyTypeContent[item.type][0].status`

### Actions
- Ready: card is a Link to study page
- Not Generated / Failed: "Generate" / "Retry" button -> `POST /api/study-type-content`
- Generating: disabled spinner button

---

## `app/course/[courseId]/flashcards/page.jsx`

### Purpose
Flashcard carousel study experience.

### Load State Machine
`'loading'` -> `'generating'` -> `'ready'` | `'empty'` | `'failed'` | `'error'`

### Polling
- 4 s interval; max 30 attempts (2 minutes)
- Stored in `pollRef` (ref, not state) for cleanup without re-renders
- Stops on `status: 'Ready'`, `status: 'Failed'`, or timeout

### UI When Ready
- shadcn `<Carousel>` (Embla under the hood)
- Progress bar: `(currentIndex + 1) / total * 100`
- `resetKey` prop passed to each `FlashcardItem` resets flip state on navigation
- Regenerate ghost button at bottom

---

## `app/course/[courseId]/quiz/page.jsx`

### Purpose
Multiple-choice quiz engine.

### Load State Machine
Same as flashcards: `loading | generating | ready | empty | failed | error`

### Quiz State
- `currentQuestion`: current question index
- `userAnswers`: array indexed by question
- `showResults`: boolean; transitions to results screen after last question

### Feedback
- On option click: reveals correct (emerald) and incorrect (red) immediately
- `OptionChip` component handles styling based on `correct`/`incorrect`/`disabled` props

### Results Screen
- Score = count of exact string matches between `userAnswers[i]` and `questions[i].correctAnswer`
- Grade: `>=90% Outstanding | >=70% Great Job | >=50% Keep Going | <50% Needs Work`
- Per-question review with user answer vs. correct answer + explanation

---

## `app/course/[courseId]/notes/page.jsx`

### Purpose
Paginated chapter notes reader.

### Behavior
- Fetches all chapter notes via `POST /api/study-type { studyType: 'NOTES' }`
- Renders one chapter at a time via `stepCount` index
- HTML rendered via `dangerouslySetInnerHTML`
- Chapter progress dots (clickable to jump)
- Celebration banner on last chapter

---

## `app/dashboard/upgrade/page.jsx`

### Purpose
Pricing page with Stripe checkout integration.

### Features Listed
- **Free:** 5 AI courses, notes, basic flashcards
- **Pro:** Unlimited courses, advanced quiz, full flashcard library, PDF export, priority queue, early access

### Stripe Integration
- "Upgrade" button -> `POST /api/stripe/checkout` -> redirect to `session.url`
- URL param `?upgraded=true` -> success toast
- URL param `?cancelled=true` -> info toast
- `<Suspense>` wrapper around search-params component (Next.js streaming requirement)

---

## `lib/studyContent.js`

### Purpose
Shared validation and normalization utilities for all study content operations.

### Key Functions

**`normalizeType(raw)`**
- Normalizes: `flashcards` -> `flashcard`, `q&a` -> `qa`, `note` -> `notes`
- Case-insensitive

**`validateFlashcards(arr)`**
- Each item must have non-empty `front` and `back` strings
- Returns `{ valid: CleanedItem[], errors: string[] }`

**`validateQuiz(arr)`**
- Each item: `question` string, `options` exactly 4 non-empty strings, `correctAnswer` exactly matching one option
- Returns `{ valid, errors }`

**`validateStudyContent(type, arr)`**
- Routes to appropriate validator based on type

**`extractJsonArray(rawText)`**
- Strips markdown fences
- Tries JSON.parse; falls back to regex extraction of `[...]` in surrounding prose
- Unwraps single-key wrapper objects: `{ "questions": [...] }` -> `[...]`
- Returns parsed array or `null`

---

# 5. Application Flows

## 5.1 Sign-Up / First Login Flow

```
1. User visits app URL
2. Clicks "Sign Up" / navigates to /sign-in
3. Clerk renders hosted sign-in/sign-up UI
4. User authenticates via email or OAuth
5. Clerk issues session token (cookie)
6. Browser navigates to /dashboard
7. app/provider.js fires:
   -> POST /api/create-user { user: clerkUserObject }
   -> API: check DB by email -> not found -> INSERT users
8. Dashboard loads with empty course list
```

## 5.2 Course Creation Flow

```
1. User clicks "+ Create New" in SideBar
2. /create opens (Clerk middleware confirms auth)
3. Step 1: User picks course type
4. Step 2: User enters topic + difficulty
5. User clicks "Generate":
   a. Client generates UUID courseId
   b. POST /api/generate-course-outline fired (no await)
   c. Toast: "generating..."
   d. router.replace('/dashboard') — immediate redirect
6. Server (async, after client redirected):
   a. Gemini generates JSON course outline
   b. INSERT study_material { status: 'Generating' }
   c. HTTP 200 returned (client already gone)
   d. generateNotesInBackground() fires:
      - For each chapter: Gemini HTML -> INSERT chapterNotes
      - UPDATE study_material SET status='Ready'
7. Dashboard: polls POST /api/courses every 5 s
8. When status: 'Generating' -> 'Ready': toast fires
```

## 5.3 Flashcard Generation and Study Flow

```
1. User opens Ready course -> /course/[id]
2. StudyMaterialSection: POST /api/study-type { studyType: 'ALL' }
3. Flashcard card: "Not Generated" + Generate button
4. User clicks Generate:
   POST /api/study-type-content { type:'flashcard', courseId, chapters, topic }
5. API:
   a. Delete old flashcard row
   b. Insert placeholder { status: 'Generating' }
   c. Gemini generates 12 flashcards (with retry on failure)
   d. Update record { status: 'Ready', content: [...] }
6. User navigates to /course/[id]/flashcards
7. POST /api/study-type { studyType: 'flashcard' } -> status: 'Ready'
8. Carousel renders 12 flip cards
9. User swipes cards; progress bar updates
```

## 5.4 Quiz Study Flow

```
1. Generate Quiz via MaterialCardItem -> POST /api/study-type-content { type:'quiz' }
2. Gemini generates 15 MCQ questions
3. User navigates to /course/[id]/quiz
4. Question 1 renders with 4 option chips
5. User selects option -> immediate green/red feedback
6. Next button -> question 2... through question 15
7. ResultsScreen:
   - Score: count(userAnswer === correctAnswer)
   - Grade classification (Outstanding/Great/Needs Work)
   - Per-question review with correct answers
8. "Retake" resets state; "New Questions" regenerates from API
```

## 5.5 Pro Upgrade Flow (Stripe)

```
1. /dashboard/upgrade: checks GET /api/user?email=... for isMember
2. User clicks "Upgrade Now"
3. POST /api/stripe/checkout:
   - Clerk currentUser() -> get email
   - stripe.checkout.sessions.create({ mode:'subscription', metadata:{userEmail} })
   - Return { url: 'https://checkout.stripe.com/...' }
4. Browser redirects to Stripe hosted checkout
5. User pays -> subscribes
6. Stripe fires POST /api/stripe/webhook
7. Server:
   - Verifies HMAC signature
   - Extracts userEmail from metadata
   - UPDATE users SET isMember=true + Stripe IDs
8. Stripe redirects to /dashboard?upgraded=true
9. Success toast fires
```

## 5.6 Notes Reading Flow

```
1. Click "Open" on Notes card -> /course/[id]/notes
2. POST /api/study-type { studyType: 'NOTES' }
3. Returns array of chapterNotes
4. Chapter 0 HTML rendered with dangerouslySetInnerHTML
5. Prev/Next buttons navigate chapters
6. Progress dots clickable to jump chapters
7. Last chapter: celebration banner
```

## 5.7 Course Deletion Flow

```
1. Hover course card -> delete icon
2. Click -> DeleteConfirmModal renders
3. User confirms -> DELETE /api/courses?courseId=xxx
4. Server:
   a. DELETE chapterNotes WHERE courseId
   b. DELETE study_material WHERE courseId
5. onDelete(courseId) -> removes from local state (optimistic)
6. Toast: "deleted successfully"
```

---

# 6. Folder Deep Dive

## `app/api/`

**Why it exists:** Next.js App Router convention — `route.js` files become REST endpoints.

**Conventions:**
- Each file exports named HTTP method functions (`GET`, `POST`, `DELETE`)
- All handlers return `NextResponse.json()` with appropriate status codes
- Input validation at handler start
- Errors caught and returned as `{ error: message }` with non-200 status

**Architecture:** Thin handler -> inline business logic -> Drizzle queries -> response. No service layer abstraction.

## `app/course/[courseId]/`

**Why it exists:** Dynamic route segment. `[courseId]` captures the UUID from URL.

**Conventions:**
- All pages are client components (`"use client"`)
- Each page fetches its own data on mount
- Polling implemented with `setInterval` in refs for cleanup
- `loadState` string machine controls which UI panel renders

**Architecture:** Each study mode is a self-contained page with its own fetch + poll + render. No shared state between study mode pages.

## `configs/`

**Why it exists:** Centralises all external service configuration.

**Conventions:**
- `db.js` — single DB export
- `schema.js` — single source of truth for DB structure
- `AiModel.js` — single source of truth for Gemini configuration

## `inngest/`

**Why it exists:** Inngest functions must be defined outside API routes. Standard Inngest pattern.

**Conventions:**
- Functions exported from `functions.js`, imported by `app/api/inngest/route.js`
- Each function uses `step.run()` for independently retryable units

## `lib/`

**Why it exists:** Shared utilities used by multiple API routes. Prevents duplication, centralises validation.

**Conventions:** Pure functions; no side effects; return `{ valid, errors }` rather than throwing.

---

# 7. Components / Modules

## Module: Authentication (Clerk)
- **Purpose:** User identity, session management, OAuth
- **Lifecycle:** ClerkProvider wraps entire app; session stored in cookie
- **Interaction:** `useUser()` (client), `currentUser()` (server), `clerkMiddleware` (routes)

## Module: Course Creation
- **Components:** `create/page.jsx`, `SelectOption.jsx`, `TopicInput.jsx`
- **Dependencies:** `POST /api/generate-course-outline`, Clerk, uuid, Axios

## Module: Dashboard
- **Components:** `SideBar.jsx`, `CourseList.jsx`, `CourseCardItem.jsx`
- **Dependencies:** `POST/DELETE /api/courses`, `GET /api/user`

## Module: Course View
- **Components:** `CourseIntroCard.jsx`, `StudyMaterialSection.jsx`, `MaterialCardItem.jsx`, `ChapterList.jsx`
- **Dependencies:** `GET /api/courses`, `POST /api/study-type`, `POST /api/study-type-content`

## Module: Flashcard Engine
- **Components:** `flashcards/page.jsx`, `FlashcardItem.jsx`
- **Dependencies:** shadcn Carousel (Embla), react-card-flip, `POST /api/study-type`

## Module: Quiz Engine
- **Components:** `quiz/page.jsx`
- **Dependencies:** shadcn Progress, `POST /api/study-type`

## Module: Notes Reader
- **Components:** `notes/page.jsx`
- **Dependencies:** `POST /api/study-type { studyType: 'NOTES' }`, `dangerouslySetInnerHTML`

## Module: Stripe Billing
- **Components:** `upgrade/page.jsx`, `stripe/checkout/route.js`, `stripe/webhook/route.js`
- **Dependencies:** Stripe SDK, Clerk `currentUser()`

## Module: AI Generation (Gemini)
- **Files:** `configs/AiModel.js`, `api/generate-course-outline/route.js`, `api/study-type-content/route.js`

## Module: Background Jobs (Inngest)
- **Files:** `inngest/client.js`, `inngest/functions.js`, `api/inngest/route.js`

---

# 8. Database Documentation

## Overview

**Database:** Neon Serverless PostgreSQL  
**ORM:** Drizzle ORM  
**Migrations:** `npx drizzle-kit push`  
**Connection:** HTTP driver (no persistent connections; serverless-safe)

## Tables

### `users`

| Column | Type | Notes |
|---|---|---|
| `id` | SERIAL PK | Auto-increment |
| `name` | VARCHAR(255) | From Clerk fullName |
| `email` | VARCHAR(255) | Business key; NOT NULL |
| `isMember` | BOOLEAN | Default false |
| `stripeCustomerId` | VARCHAR(255) | Nullable |
| `stripeSubscriptionId` | VARCHAR(255) | Nullable |

### `study_material`

| Column | Type | Notes |
|---|---|---|
| `id` | SERIAL PK | |
| `courseId` | VARCHAR | UUID client-generated |
| `courseType` | VARCHAR | Course type selection |
| `topic` | VARCHAR | Free-text topic |
| `difficultyLevel` | VARCHAR | Default 'Easy' |
| `courseLayout` | JSON | AI-generated outline |
| `createdBy` | VARCHAR | User email |
| `status` | VARCHAR | 'Generating' / 'Ready' |
| `createdAt` | TIMESTAMP | Auto |

**courseLayout JSON shape:**
```json
{
  "courseTitle": "...",
  "courseSummary": "...",
  "chapters": [
    {
      "chapter_number": 1,
      "chapter_title": "...",
      "chapter_summary": "...",
      "emoji": "📚",
      "topics": ["topic1", "topic2"]
    }
  ]
}
```

### `chapterNotes`

| Column | Type | Notes |
|---|---|---|
| `id` | SERIAL PK | |
| `courseId` | VARCHAR | FK-like to study_material |
| `chapterId` | INTEGER | Zero-based index |
| `notes` | TEXT | Full HTML (can be large) |

### `studyTypeContent`

| Column | Type | Notes |
|---|---|---|
| `id` | SERIAL PK | |
| `courseId` | VARCHAR | FK-like to study_material |
| `content` | JSON | Array of flashcard/quiz objects |
| `type` | VARCHAR | 'flashcard' or 'quiz' |
| `status` | VARCHAR | 'Generating' / 'Ready' / 'Failed' |
| `createdAt` | TIMESTAMP | Auto |

**Flashcard content shape:** `[{ "front": "...", "back": "..." }]`

**Quiz content shape:** `[{ "question": "...", "options": ["A","B","C","D"], "correctAnswer": "A", "explanation": "..." }]`

## Relationships

No enforced FK constraints. Application enforces:
- Delete `chapterNotes` before `study_material`
- `courseId` is the shared business key across tables
- `createdBy` is denormalized (not a FK to `users.id`)

---

# 9. API Documentation

## POST `/api/generate-course-outline`
- **Auth:** None (relies on client being authenticated)
- **Request:** `{ courseId, topic, courseType, difficultyLevel, createdBy }`
- **Response:** `{ result: { courseId, status: 'Generating', courseLayout, ... } }`
- **Side Effects:** Inserts into `study_material`; starts async notes generation
- **Errors:** 500 on Gemini or DB failure

## GET `/api/courses?courseId=xxx`
- **Response:** `{ result: courseObject }`

## POST `/api/courses`
- **Request:** `{ createdBy: "email" }`
- **Response:** `{ result: [courseObjects...] }` (ordered by id DESC)

## DELETE `/api/courses?courseId=xxx`
- **Response:** `{ success: true, courseId }`
- **Errors:** 400 missing courseId; 404 not found; 500 DB error

## POST `/api/create-user`
- **Request:** `{ user: clerkUserObject }`
- **Response:** `{ result: { id } }`

## GET `/api/user?email=xxx`
- **Response:** `{ isMember: boolean }`

## POST `/api/study-type`
- **Request:** `{ courseId, studyType }`
- **Response (ALL):** `{ notes: [], flashcard: [], quiz: [], qa: [] }`
- **Response (NOTES):** `[{ id, courseId, chapterId, notes }]`
- **Response (specific):** `{ id, courseId, type, status, content }` or `null`

## POST `/api/study-type-content`
- **Request:** `{ courseId, type, chapters, topic }`
- **Response:** `{ id, courseId, type, status: 'Ready', content: [...] }`
- **Errors:** 400 bad type; 500 AI failed after 2 attempts

## POST `/api/stripe/checkout`
- **Auth:** Clerk `currentUser()` required
- **Response:** `{ url: "https://checkout.stripe.com/..." }`
- **Errors:** 401, 503, 500

## POST `/api/stripe/webhook`
- **Auth:** Stripe HMAC signature
- **Response:** `{ received: true }`
- **Errors:** 400 bad signature; 500 DB error

---

# 10. Authentication & Authorization

## Provider: Clerk

Handles email/password, OAuth, MFA, session management, user profiles.

## Login Flow

```
1. User visits /sign-in
2. Clerk hosted UI renders
3. User authenticates
4. Clerk JWT cookie issued
5. Cookie sent on all subsequent requests
6. Clerk middleware validates JWT on protected routes
```

## Route Protection

- `clerkMiddleware` + `createRouteMatcher` in `middleware.js`
- Protected: `/dashboard(.*)`, `/create(.*)`, `/course(.*)`
- Unprotected: `/`, `/sign-in`, `/sign-up`, most API routes

## Client-Side Session

- `useUser()` hook -> `{ user: ClerkUser | null }`

## Server-Side Session

- `currentUser()` from `@clerk/nextjs/server` in API routes

## Authorization Gaps

- Most API routes do NOT verify resource ownership
- Any authenticated user who knows a `courseId` UUID can access/delete it
- `isMember` flag is displayed in UI but not enforced server-side for feature gating

---

# 11. State Management

## Global State

No global state management library. No Redux, Zustand, or custom Context. All state is local to components.

## Local State Patterns

- `loadState` string machine: `'loading' | 'generating' | 'ready' | 'empty' | 'failed' | 'error'`
- `courseList` in CourseList: re-fetched on user change + polled when generating
- `studyTypeContent` in StudyMaterialSection: fetched on mount, polled while generating

## Polling Architecture

| Component | Endpoint | Interval | Stop Condition |
|---|---|---|---|
| `CourseList` | `POST /api/courses` | 5 s | No course `status: 'Generating'` |
| `StudyMaterialSection` | `POST /api/study-type { studyType:'ALL' }` | 5 s | No content generating |
| `flashcards/page.jsx` | `POST /api/study-type { studyType:'flashcard' }` | 4 s | Ready/Failed or 30 attempts |
| `quiz/page.jsx` | `POST /api/study-type { studyType:'quiz' }` | 4 s | Ready/Failed or 30 attempts |

Intervals stored in `useRef` and cleaned up in `useEffect` return functions.

## Optimistic Updates

- **Course deletion:** Local state updated before server confirms
- **Course creation:** Client redirects before server responds

---

# 12. Important Design Patterns

## Fire-and-Forget Async
Used in `generate-course-outline/route.js`:
```javascript
generateNotesInBackground(insertedCourse).catch(err => console.error(err));
// HTTP response returned immediately above this line
```

## Status Machine Strings
`loadState` string variable (`'loading'|'generating'|'ready'|'empty'|'failed'|'error'`) drives conditional rendering without boolean flag explosion.

## Chat Session Few-Shot Prompting
`generateNotesAiModel` and `generateStudyTypeContentAiModel` use `startChat({ history: [...] })` with example exchanges to enforce output format without system prompts.

## Upsert-via-Delete
`study-type-content/route.js`: delete existing `(courseId, type)` row before inserting a new one. Prevents stale duplicates without ON CONFLICT syntax.

## Type Normalization / Canonical Keys
`lib/studyContent.js::normalizeType()` converts all type variants to canonical lowercase. Applied on both read and write paths.

## Lazy Import for Optional Dependencies
```javascript
const Stripe = (await import('stripe')).default;
```
Prevents build-time crash if env vars are absent; only fails at runtime.

## Optimistic UI
Course deletion: `setCourseList(prev => prev.filter(c => c.courseId !== id))` fires immediately, before server confirms.

---

# 13. Important Business Logic

## Freemium Credit System

- Free users: 5 course credits
- **Current implementation:** Credit counter in SideBar is hardcoded ("3 Out of 5 Credits Used") — not backed by actual DB count. Credit enforcement is NOT implemented.
- Pro members: Unlimited courses; "Active Subscription" badge

## Course Status Machine

```
'Generating' -> 'Ready'  (after notes generation completes)
No 'Failed' status for courses — partial notes still result in 'Ready'
```

## Study Content Status Machine

```
'Generating' -> 'Ready'   (AI generated valid content)
'Generating' -> 'Failed'  (AI failed both attempts)
```

## AI Validation Pipeline

1. Strip markdown fences from raw AI output
2. Try JSON.parse; fallback to regex extraction
3. Validate each item against schema (flashcard or quiz)
4. Drop malformed items; keep valid ones
5. If zero valid items: retry with stricter prompt
6. After 2 total attempts with zero valid: mark `status: 'Failed'`

## Content Type Canonical Mapping

| UI Label | API type | DB stored as |
|---|---|---|
| Notes/Chapters | `notes` / `NOTES` | chapterNotes table |
| Flashcards | `flashcard` | `flashcard` |
| Quiz | `quiz` | `quiz` |
| Test Series | `qa` | `qa` |
| Record and Learn | `null` | — |

## Stripe Upgrade Logic

1. Checkout session embeds `userEmail` in metadata
2. Webhook extracts email from metadata (not from Stripe customer)
3. DB lookup by email -> update `isMember = true`
4. No cancellation, renewal, or subscription management

---

# 14. External Services

## Google Gemini 2.5 Flash

- **Why:** Best speed/cost for structured JSON; 2.5 Flash tier balances quality and latency
- **Integration:** `configs/AiModel.js`, used in both API routes and Inngest functions
- **Key:** `NEXT_PUBLIC_GEMINI_API_KEY` (exposed to browser — security risk)
- **Failure handling:** Per-chapter try/catch; 2-attempt retry for content generation; `status: 'Failed'` on total failure

## Neon Serverless PostgreSQL

- **Why:** Fully managed PostgreSQL with HTTP driver — ideal for Vercel serverless
- **Integration:** `configs/db.js` single Drizzle client
- **Key:** `DATABASE_CONNECTION_STRING` with `sslmode=require`

## Clerk

- **Why:** Complete auth-as-a-service; eliminates custom auth code
- **Integration:** ClerkProvider (app), clerkMiddleware (routes), useUser (client), currentUser (server)

## Stripe

- **Why:** Industry-standard payments; hosted Checkout removes PCI compliance burden
- **Integration:** Checkout session creation + webhook verification
- **Security:** HMAC signature verification on webhooks

## Inngest

- **Why:** Durable execution, automatic retries, step-level granularity for background jobs
- **Integration:** Serve endpoint at `/api/inngest`; functions in `inngest/functions.js`
- **Local dev:** `npm run dev:inngest` starts Inngest CLI

---

# 15. Configuration

## Environment Variables

| Variable | Purpose | Required |
|---|---|---|
| `DATABASE_CONNECTION_STRING` | Neon PostgreSQL connection string | YES |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk browser key | YES |
| `CLERK_SECRET_KEY` | Clerk server key | YES |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Sign-in path (e.g., `/sign-in`) | YES |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Sign-up path (e.g., `/sign-up`) | YES |
| `NEXT_PUBLIC_GEMINI_API_KEY` | Google Gemini API key | YES (security risk) |
| `STRIPE_SECRET_KEY` | Stripe server secret | YES |
| `STRIPE_PRICE_ID` | Stripe Price ID for Pro subscription | YES |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | YES |
| `NEXT_PUBLIC_APP_URL` | App base URL for Stripe redirects | YES |
| `INNGEST_DEV` | Set to `1` for Inngest dev mode | Optional |

## Configuration Files

- `drizzle.config.js` — Schema path + DB credentials (hardcoded URL — should use env var)
- `components.json` — shadcn/ui configuration
- `next.config.ts` — Minimal Next.js config
- `tsconfig.json` — TypeScript with `@/` path alias
- `eslint.config.mjs` — ESLint with next config
- `postcss.config.mjs` — PostCSS for Tailwind v4

---

# 16. Error Handling

## API Route Errors

- All handlers: `try/catch` around main logic
- Errors: `NextResponse.json({ error: message }, { status: 5xx })`
- Status codes: 400 (validation), 401 (auth), 404 (not found), 500 (server), 503 (service unavailable)

## AI Generation Errors

- Chapter notes: per-chapter try/catch; continues on failure
- Content generation: 2-attempt retry; `status: 'Failed'` after both fail
- All Gemini errors logged to console

## Client-Side Errors

- Polling errors: logged but non-fatal
- API call errors: displayed via Sonner toast
- No global error boundary

## Logging

- `console.log/warn/error` with context prefixes (`[Stripe Webhook]`, `[Outline]`, etc.)
- No centralized monitoring (no Sentry, Datadog)

---

# 17. Performance

## Caching

No application-level caching. All requests hit the database.

## Lazy Loading

- React client components code-split automatically by Next.js
- Stripe SDK lazily imported to reduce bundle size

## AI Generation Optimization

- Chapter notes: sequential generation (prevents Gemini rate limiting)
- Content generation: stateless model call (faster than chat session)
- Retry is synchronous within the same HTTP request

## Polling vs. WebSockets Trade-offs

- **Polling pros:** Simple, works with stateless serverless functions
- **Polling cons:** Unnecessary requests, 4–5 s latency, extra DB load
- WebSockets would require persistent connections — incompatible with Vercel serverless
- SSE would be a middle ground

## DB Query Optimization Gaps

- No explicit indexes on `study_material.createdBy` or `studyTypeContent.courseId`
- No pagination on course list (all courses fetched at once)

---

# 18. Security

## Authentication

- All protected routes guarded by Clerk middleware
- JWT validation on every protected request

## API Key Exposure (CRITICAL)

`NEXT_PUBLIC_GEMINI_API_KEY` is bundled into client JavaScript. Anyone can extract it from browser DevTools. **Fix:** Remove `NEXT_PUBLIC_` prefix; all Gemini calls go through API routes only.

## Stripe Webhook Security

- Raw body preserved for HMAC verification
- `stripe.webhooks.constructEvent()` rejects forged requests
- `dynamic = 'force-dynamic'` prevents caching

## SQL Injection Prevention

- All DB queries via Drizzle ORM's parameterized query builder
- No raw SQL string interpolation

## XSS Risk

- `dangerouslySetInnerHTML` used for AI-generated HTML notes
- Risk is low (AI-generated, not user-submitted) but not zero
- **Recommendation:** Sanitize with DOMPurify before rendering

## Authorization Gaps

- No ownership verification on most API endpoints
- Users could theoretically access/delete each other's courses by guessing UUIDs
- **Fix:** Verify `createdBy` matches authenticated user email on all resource endpoints

---

# 19. Testing

## Current State

No automated test suites. All testing is manual.

## Existing Scripts

- `test-gen.js` — Manual AI generation testing script (run with `node test-gen.js`)
- `generate-notes.ts` — Standalone notes generation test

## Linting

`npm run lint` — ESLint with `eslint-config-next`

## Recommended Test Architecture

### Unit Tests (Vitest)
- `lib/studyContent.js` functions: `normalizeType`, `validateFlashcards`, `validateQuiz`, `extractJsonArray`
- `inngest/functions.js` with mocked Gemini and DB

### Integration Tests (Playwright)
- Course creation wizard -> redirect -> polling -> toast
- Flashcard generation -> polling -> carousel
- Quiz completion -> results screen
- Stripe upgrade flow (Stripe test mode)

---

# 20. Build & Deployment

## Local Development

```bash
npm install
npx drizzle-kit push                    # push schema to Neon
npm run dev                             # Next.js at localhost:3000
npm run dev:inngest                     # Inngest dev server (separate terminal)
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## Scripts

| Script | Command | Purpose |
|---|---|---|
| `dev` | `next dev` | Dev server with HMR |
| `dev:inngest` | `npx inngest-cli@latest dev` | Inngest local UI |
| `build` | `next build` | Production build |
| `start` | `next start` | Production server |
| `lint` | `eslint` | Lint all files |

## Production Deployment (Vercel)

1. Push to GitHub
2. Vercel auto-detects Next.js
3. Environment variables set in Vercel dashboard
4. Deploys to serverless functions
5. Inngest cloud receives events and dispatches to `/api/inngest`

---

# 21. Complete Dependency Map

```
app/layout.jsx
  +-- ClerkProvider
  +-- Provider (app/provider.js)
  |     +-- useUser (Clerk)
  |     +-- POST /api/create-user
  +-- Toaster (sonner)

app/dashboard/layout.jsx
  +-- SideBar.jsx
        +-- useUser, GET /api/user
        +-- Progress (shadcn)

app/dashboard/_components/CourseList.jsx
  +-- useUser
  +-- POST /api/courses
  +-- CourseCardItem.jsx
        +-- DELETE /api/courses

app/create/page.jsx
  +-- SelectOption.jsx, TopicInput.jsx
  +-- useUser, POST /api/generate-course-outline

app/course/[courseId]/page.jsx
  +-- GET /api/courses
  +-- CourseIntroCard.jsx
  +-- StudyMaterialSection.jsx
  |     +-- POST /api/study-type { ALL }
  |     +-- MaterialCardItem.jsx
  |           +-- POST /api/study-type-content
  +-- ChapterList.jsx

app/course/[courseId]/flashcards/page.jsx
  +-- POST /api/study-type { flashcard }
  +-- Carousel (shadcn -> embla)
  +-- FlashcardItem.jsx (react-card-flip)

app/course/[courseId]/quiz/page.jsx
  +-- POST /api/study-type { quiz }
  +-- Progress (shadcn)

app/course/[courseId]/notes/page.jsx
  +-- POST /api/study-type { NOTES }

API routes -> configs/db.js -> @neondatabase/serverless + drizzle-orm
API routes -> configs/AiModel.js -> @google/generative-ai
API routes -> configs/schema.js (table definitions)
API routes -> lib/studyContent.js (validators)

inngest/functions.js
  +-- inngest/client.js
  +-- configs/db.js, configs/schema.js, configs/AiModel.js
```

## Circular Dependencies

None. Dependency graph is strictly hierarchical: Pages -> API routes -> configs/ -> external SDKs.

---

# 22. End-to-End Data Flow

## Flow A: Course Creation

```
User input: topic + courseType + difficulty
  -> Client generates courseId = uuidv4()
  -> POST /api/generate-course-outline { courseId, topic, courseType, difficultyLevel, createdBy }
  -> Gemini: generateContent("Create study material for {topic}...")
  -> Gemini returns: { courseTitle, chapters: [...] }
  -> INSERT study_material { courseId, status:'Generating', courseLayout: {...} }
  -> HTTP 200 { result: { courseId, status:'Generating', ... } }
  -> Client: toast + router.replace('/dashboard')
  -> ASYNC: generateNotesInBackground()
     -> For each chapter:
        -> Gemini: sendMessage("Generate HTML notes for {chapter}")
        -> Gemini returns: <div>...</div>
        -> INSERT chapterNotes { courseId, chapterId, notes: "<div>..." }
     -> UPDATE study_material SET status='Ready' WHERE courseId
  -> Dashboard: polls POST /api/courses every 5s
  -> Poll N: course.status = 'Ready' -> toast("Your course is ready!")
```

## Flow B: Stripe Pro Upgrade

```
User clicks "Upgrade Now"
  -> POST /api/stripe/checkout
  -> currentUser() -> email = "user@example.com"
  -> stripe.checkout.sessions.create({ mode:'subscription', metadata:{userEmail:'user@...'} })
  -> Returns { url: 'https://checkout.stripe.com/cs_xxx' }
  -> Browser redirects to Stripe checkout
  -> User pays
  -> Stripe fires POST /api/stripe/webhook
  -> req.text() -> raw body
  -> stripe.webhooks.constructEvent(body, sig, secret) -> verified
  -> session.metadata.userEmail = "user@example.com"
  -> UPDATE users SET isMember=true, stripeCustomerId='cus_xxx', stripeSubscriptionId='sub_xxx'
     WHERE email='user@example.com'
  -> Stripe redirects to /dashboard?upgraded=true
  -> toast("You're now a Pro member!")
```

## Flow C: Flashcard Generation

```
User clicks "Generate Flashcards"
  -> POST /api/study-type-content { courseId, type:'flashcard', chapters:'ch1, ch2...', topic }
  -> normalizeType('flashcard') -> 'flashcard'
  -> DELETE studyTypeContent WHERE courseId='abc' AND type='flashcard'
  -> INSERT studyTypeContent { courseId, type:'flashcard', content:[], status:'Generating' }
  -> recordId = inserted[0].id
  -> buildFlashcardPrompt("Machine Learning - Introduction, Neural Networks")
  -> Attempt 1: callGemini(prompt) -> rawText
  -> extractJsonArray(rawText) -> [{ front, back }, ...]
  -> validateFlashcards(arr) -> { valid: 12 items, errors: [] }
  -> UPDATE studyTypeContent SET status='Ready', content=[...] WHERE id=recordId
  -> Response: { id, courseId, type:'flashcard', status:'Ready', content:[...] }
  -> Client: re-fetches, card shows "Ready"
```

---

# 23. Interview Preparation Guide

## Architecture

**Q: Why use Next.js App Router for this project?**
A: App Router provides file-based routing, server components, API routes, and code-splitting in one framework. It eliminates a separate Express backend, simplifying the codebase. Co-location of UI and API makes Vercel deployment trivially simple.

**Q: Why is background note generation done with fire-and-forget instead of Inngest?**
A: The current primary path uses a direct async function call (`generateNotesInBackground().catch()`) for lower latency (no event round-trip). The trade-off: if the server process dies mid-generation, the course stays in 'Generating' indefinitely. Inngest's `GenerateNotes` exists for durability but is the secondary path.

**Q: How does the polling system work? What are its trade-offs vs. WebSockets?**
A: Client-side `setInterval` polls every 4–5 s; stops when content is Ready/Failed or after a timeout. Polling is simple and works with stateless serverless functions. Trade-offs: unnecessary API calls, 4–5 s latency, extra DB load. WebSockets give real-time push but require persistent connections — incompatible with Vercel. SSE would be a middle ground.

## System Design

**Q: How would you scale to 100,000 users?**
A:
1. Redis cache (Upstash) for frequently read course data
2. DB indexes on `study_material.createdBy` and `studyTypeContent.courseId`
3. Replace polling with SSE or WebSocket service (Pusher/Ably)
4. Rate limiting on AI endpoints (e.g., 1 course/minute/user)
5. Proper DB-backed credit system
6. Queue for AI requests to prevent quota exhaustion

**Q: How would you add PDF export?**
A: API route `/api/export?courseId=xxx`: fetch all chapterNotes, render HTML to PDF using puppeteer or `@react-pdf/renderer`, stream PDF response. Pro-gate in middleware.

## Database

**Q: Why is courseId a UUID string instead of the auto-increment id?**
A: UUID is generated on the client before the server responds. This enables immediate redirect to the dashboard without waiting for the DB insert response. The dashboard then polls by the pre-known courseId.

**Q: What happens if the server crashes during note generation?**
A: The course stays in 'Generating' forever. There is no watchdog or timeout. Fix: scheduled Inngest cron that finds courses stuck in 'Generating' for >N minutes and marks them 'Failed'.

**Q: Why are there no foreign key constraints?**
A: Not added in this project. Application enforces referential integrity manually (delete notes before course). Adding FK constraints would prevent orphan records at DB level but requires schema migration.

## Security

**Q: The Gemini API key is exposed to the browser. How would you fix it?**
A: Remove `NEXT_PUBLIC_` prefix. All Gemini calls go through Next.js API routes which have server-only access to the key. Client code calls `/api/...` endpoints; key never reaches the browser bundle.

**Q: Notes use dangerouslySetInnerHTML. Is this an XSS risk?**
A: Low risk since content is AI-generated (not user-submitted). However, a compromised Gemini API could inject malicious HTML. Mitigation: sanitize with DOMPurify before storing or rendering.

**Q: How are course ownership permissions enforced?**
A: Courses are filtered by `createdBy` email in the list endpoint. However, individual GET/DELETE/study-type endpoints don't verify ownership. A user who knows another's courseId UUID could access it. Fix: check `course.createdBy === currentUser.email` in each endpoint.

## Performance

**Q: How would you optimize dashboard loading?**
A:
1. Index on `study_material.createdBy`
2. React Suspense with server-side data fetching
3. Local storage cache with short TTL
4. Paginate course list (20 per page)

**Q: Note generation is sequential. Why, and how would you parallelize?**
A: Sequential prevents Gemini rate limiting. `Promise.all()` across all chapters would be faster but risks 429 errors. Controlled concurrency with `p-limit(concurrency=3)` would be the best middle ground.

## Business Logic

**Q: What is the purpose of type normalization?**
A: Early versions used capitalized type strings ("Flashcard", "Quiz"). Later normalized to lowercase. `normalizeType()` in `lib/studyContent.js` handles both variants, preventing case-mismatch bugs where "Flashcard" and "flashcard" would be treated as different types.

**Q: How does quiz scoring work?**
A: `score = count(userAnswers[i] === questions[i].correctAnswer)`. The correctAnswer is an exact string match. Grade: >=90% Outstanding, >=70% Great Job, >=50% Keep Going, <50% Needs Work.

**Q: What is the upsert-via-delete pattern and why use it?**
A: Delete existing `(courseId, type)` row before inserting a new one. Prevents stale/duplicate content rows accumulating on regeneration. Simpler than ON CONFLICT DO UPDATE when you want to reset all fields.

---

# 24. Knowledge Gaps

1. **Credit enforcement:** SideBar shows "3 Out of 5 Credits Used" — hardcoded, not DB-backed. Actual mechanism for enforcing the 5-course free tier is not implemented.

2. **Inngest vs. API route duplication:** Both `generateNotesInBackground()` (API route) and `GenerateNotes` (Inngest) can generate notes. Triggering mechanism for the Inngest function is unclear.

3. **GenerateStudyTypeContent bug:** References `GenerateQuizAiModel` not imported in `functions.js`. Inngest path for quiz generation is likely broken; actual quiz generation happens in `study-type-content/route.js`.

4. **Stripe subscription management:** Cancellation, billing portal, and renewal handling not implemented. If subscription lapses, `isMember` stays `true` permanently.

5. **`app/api/inngest/create-user/` subdirectory:** Found in listing but not fully explored — may be legacy.

6. **Voice/Record study mode:** Scaffolded in UI (`type: null`) but not implemented. Route file does not exist.

7. **Full CourseCardItem rendering:** Only 80 lines reviewed — course type icon mapping beyond that point was not examined.

---

# 25. Executive Summary

**Study Buddy** is a production-grade, full-stack AI learning SaaS built as a **Next.js 16 App Router monolith** deployed on Vercel. It represents an end-to-end implementation of the modern JavaScript SaaS stack: React client -> Next.js API routes -> Neon PostgreSQL -> Inngest background jobs -> Google Gemini 2.5 Flash.

**Core Value:** Transform any topic into a structured, exam-ready course (notes, flashcards, quizzes) in under a minute — no source material needed.

**Architectural Highlights:**
- Three-tier async: synchronous HTTP response + fire-and-forget notes generation + optional Inngest durable jobs
- Client-side polling for real-time status (serverless-compatible simplicity)
- `loadState` string machine pattern for all async AI content flows
- Few-shot prompting via Gemini chat session history for enforced output formats
- Stripe webhook-verified upgrades with per-user `isMember` flag
- Upsert-via-delete for idempotent content regeneration
- Canonical type normalization across all study content operations
- Shared validation library (`lib/studyContent.js`) preventing duplicate logic

**Production Readiness:**
- Good: Error handling in API layer, Stripe webhook security, Inngest durability, type validation, optimistic UI
- Needs work: Gemini key exposure (client bundle), missing authorization checks, no credit enforcement, no automated tests, no monitoring

**Business Completeness:** Core learning flows fully implemented. Payments work end-to-end. Roadmap includes PDF export, Test Series, Voice mode, study activity calendar, and automated tests.
