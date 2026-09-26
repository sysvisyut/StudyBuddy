# Study Buddy: Interview Preparation Guide

This guide is optimized for rapid revision before a technical interview. It focuses on the architectural, technical, and product decisions behind Study Buddy.

---

## 1. Project Overview

*   **30-Second Pitch:** "Study Buddy is a full-stack SaaS platform that uses AI (Gemini 2.5 Flash) to generate comprehensive, multi-chapter courses, interactive flashcards, and quizzes from any topic. Built with Next.js, it leverages serverless PostgreSQL (Neon) and durable background jobs (Inngest) to handle long-running AI generation tasks asynchronously, all monetized via Stripe."
*   **2-Minute Explanation:** (Expand on the pitch) "I built this to solve the problem of manual study prep. When a user inputs a topic, they don't just get a summary; they get a structured curriculum synthesized from scratch. The core technical challenge was managing long-running AI generation without blocking the user. I solved this by moving content generation (like chapter notes) to Inngest background jobs while the Next.js frontend polls for real-time status updates. The app is fully monetized using Stripe for a freemium model and uses Clerk for authentication. The database is a serverless Neon PostgreSQL instance, accessed via Drizzle ORM."

## 2. Problem Statement & Business Value

*   **Problem:** Gathering, organizing, and creating study materials (flashcards, quizzes) is manual and time-consuming.
*   **Solution:** One-click generation of structured courses from *any* topic.
*   **Business Value:** Saves hours of prep time for students and professionals. Freemium SaaS model with Stripe directly drives revenue.
*   **Keywords:** SaaS, Freemium, Workflow Automation, EdTech.

## 3. End-to-End Workflow

*   **Creation:** User selects course type & difficulty → Enters topic → `POST /api/generate-course-outline` (returns immediately).
*   **Background Processing:** Server triggers Inngest job (`generateNotesInBackground`) → Gemini generates HTML notes per chapter → Inserts to DB → Updates status to `Ready`.
*   **Real-time UX:** Next.js client polls API (`setInterval` inside refs) every 4-5s → Toast notification pops when status flips from `Generating` to `Ready`.
*   **Study Modes:** User opens course → Can trigger on-demand generation for Flashcards/Quizzes (also via Inngest/async calls).

## 4. System Architecture

*   **Type:** Monolithic Next.js App Router application.
*   **Layers:**
    1.  **Frontend:** React Client components (UI state, polling, routing).
    2.  **API/Backend:** Next.js API Routes (Node.js edge/serverless, Auth, DB ops, webhook processing).
    3.  **Background Workers:** Inngest Durable Functions (event-driven, retries, handles AI latency).
*   **Interview Question:** *Why a monolith instead of microservices?* (Answer: Speed of development, colocation of logic, perfectly suited for Vercel/Next.js serverless ecosystem).

## 5. Tech Stack & "Why"

*   **Next.js (App Router):** Chosen for file-based routing, seamless React Server Components integration, and easy Vercel deployment.
*   **Neon Serverless PostgreSQL:** HTTP driver is perfect for serverless environments (avoids connection pooling exhaustion common with standard Postgres on Edge).
*   **Drizzle ORM:** Lightweight, typed SQL builder. Faster and less magical than Prisma.
*   **Inngest:** Handles durable, retryable background jobs. Better than cron or raw async calls because if the AI fails, Inngest automatically retries the specific step.
*   **Gemini 2.5 Flash:** Balances low latency with high-quality structured JSON output.
*   **Clerk & Stripe:** Offloads complex auth/authz and PCI-compliant payments to managed services.

## 6. Key Components and Responsibilities

*   **CourseList / StudyMaterialSection:** Handle optimistic UI updates and aggressive client-side polling.
*   **API Routes (`/api/generate-course-outline`):** The orchestrator. Makes the first fast AI call, then hands off the heavy lifting to Inngest.
*   **Stripe Webhook (`/api/stripe/webhook`):** Crucial for verifying payment signatures and updating user `isMember` state asynchronously.

## 7. Data Flow (Input → Processing → Output)

*   **Input:** User provides a free-text `topic`.
*   **Processing:**
    1.  API generates a UUID (`courseId`).
    2.  Gemini structures an outline (JSON).
    3.  DB saves outline (`Generating` state).
    4.  Inngest queries Gemini iteratively for HTML notes.
    5.  DB updates to `Ready`.
*   **Output:** React renders chapter notes via `dangerouslySetInnerHTML`, flashcards via carousel, and a custom MCQ quiz engine.

## 8. APIs and Backend Logic

*   **Fire-and-Forget Async:** `generate-course-outline` kicks off background notes generation but returns HTTP 200 immediately. *Interview note: Be prepared to discuss how you handle errors in fire-and-forget (e.g., partial failures).*
*   **Upsert-via-Delete:** Instead of complex SQL `ON CONFLICT`, when generating new flashcards, the API deletes the old row and inserts a new one. (Trade-off: simple code vs slight DB overhead).
*   **Type Normalization:** A shared library (`lib/studyContent.js`) canonicalizes types (e.g., 'flashcards' -> 'flashcard') to maintain DB consistency.

## 9. Database / Storage Design

*   **Tables:** `users`, `study_material`, `chapterNotes`, `studyTypeContent`.
*   **Relationships:** Loosely coupled. Uses `courseId` (UUID) as a shared business key rather than strict Foreign Key constraints at the DB level.
*   **Denormalization:** `createdBy` (email) is stored directly in `study_material` instead of an integer FK to `users` to save JOINs.
*   **Storage:** AI-generated outlines and flashcards are stored as `JSON` columns. Notes are stored as `TEXT` (HTML).

## 10. AI/ML Pipeline

*   **Prompt Engineering Strategy:** Uses **few-shot prompting via chat sessions**. Instead of a massive system prompt, the AI is seeded with a fake conversation history showing exact inputs and desired JSON outputs.
*   **Validation:** Raw AI output goes through a pipeline: Strip markdown → Parse JSON (fallback to regex) → Validate schema → Drop malformed items → Retry if 0 valid items.

## 11. Important Algorithms or Design Decisions

*   **Polling vs WebSockets:** Chose client-side HTTP polling (every 4-5s) over WebSockets because serverless environments (Vercel) cannot maintain persistent WebSocket connections cheaply/easily.
*   **Client-generated UUIDs:** `courseId` is generated on the client *before* the API call. This allows immediate optimistic UI redirection (`router.replace('/dashboard')`) without waiting for the server to return an ID.

## 12. Performance Optimizations

*   **Sequential AI Generation:** Chapter notes are generated one by one (not in parallel `Promise.all`) to avoid hitting Gemini API rate limits.
*   **Lazy Loading:** Heavy dependencies like the Stripe SDK are imported dynamically (`await import('stripe')`) to keep initial bundle sizes small.
*   **Gap to address in interview:** Mention that pagination on the course list is currently missing and would be the next optimization.

## 13. Security Considerations

*   **Webhook Security:** Uses `stripe.webhooks.constructEvent()` with raw body and HMAC signature to prevent forged upgrade requests.
*   **XSS Mitigation:** `dangerouslySetInnerHTML` is used for AI notes. *You must mention this in the interview:* "Since it's AI-generated, the risk is lower than user-input, but for production scaling, I would implement DOMPurify."
*   **Current Vulnerabilities:**
    *   `NEXT_PUBLIC_GEMINI_API_KEY` is exposed to the browser. *Answer:* "This was for rapid prototyping. The immediate fix is removing the prefix and routing all AI calls through Next.js API routes."
    *   Lack of robust Authorization (users can access courses by guessing UUIDs). *Answer:* "I plan to add row-level security or API-level checks to ensure `createdBy` matches the authenticated `currentUser()`."

## 14. Challenges Faced and How They Were Solved

*   *Challenge:* AI returning malformed JSON (with markdown backticks).
    *   *Solution:* Implemented a robust parsing pipeline (`extractJsonArray`) that strips markdown and falls back to regex extraction if `JSON.parse` fails.
*   *Challenge:* Long AI generation times causing Vercel function timeouts (max 10-15s on free tier).
    *   *Solution:* Migrated the heavy lifting to Inngest for durable background execution, using a fire-and-forget pattern on the initial API route.

## 15. Trade-offs and Alternative Approaches

*   **HTTP Polling vs WebSockets:** Traded network efficiency for architectural simplicity and serverless compatibility.
*   **No strict Foreign Keys:** Traded DB-level referential integrity for application-level flexibility and faster prototyping.
*   **Drizzle vs Prisma:** Traded Prisma's ease of use for Drizzle's performance (zero cold-start overhead) and raw SQL power.

## 16. Limitations and Future Improvements

*   **Missing Authorization:** Implement proper RBAC / ownership checks on API routes.
*   **Credit Enforcement:** The UI shows "3 of 5 credits used", but the backend doesn't enforce it. Needs a DB-backed counter and API middleware to block generation if out of credits.
*   **Testing:** Add Vitest for the AI JSON parser and Playwright for the core creation flow.

## 17. Metrics, Results, and Impact

> **⚠️ GAP IN DOCUMENTATION:** *You need to prepare actual numbers for this.*
*   *Prepare answers for:* How many users do you have? How fast does a course generate (e.g., "Outline takes 3s, full notes take 45s")? What is the cost per AI generation?

## 18. My Individual Contributions

> **⚠️ GAP IN DOCUMENTATION:** *If this was a solo project, state that you designed and built the entire system end-to-end. If it was a team project, define your specific slice (e.g., "I built the Inngest background pipeline and Stripe integration").*

## 19. Common Follow-up Questions I Should Expect

1.  "Why did you expose the Gemini API key on the frontend?" (See Security section for the answer).
2.  "What happens if the user closes the browser while the AI is generating?" (Answer: Nothing breaks. Inngest finishes the job on the backend. The user sees it as 'Ready' when they log back in).
3.  "How do you ensure Stripe webhooks aren't processed twice?" (Answer: Inngest is idempotent, or I rely on Stripe's retry logic and ensure DB updates (`isMember=true`) are idempotent).
4.  "Why Neon over standard Postgres?" (Answer: The HTTP driver solves connection pool exhaustion in serverless Next.js).

## 20. Resume Validation Points (Defend these claims)

*   **"Built event-driven background jobs":** Defend how Inngest works (event triggers, steps, retries) compared to a standard queue like Redis/BullMQ.
*   **"Integrated Stripe for subscriptions":** Defend the webhook flow. Know the difference between `checkout.session.completed` and `invoice.payment_succeeded`.
*   **"Prompt Engineering/AI Integration":** Defend your "few-shot chat session" approach over zero-shot system prompts.

---

# Last 10 Minutes Before Interview Revision Sheet

*   **Stack:** Next.js (App Router), Tailwind, Drizzle, Neon (Serverless Postgres), Inngest, Stripe, Clerk, Gemini 2.5 Flash.
*   **Core Flow:** UI -> API (returns 200 immediately) -> Inngest (Background AI generation) -> UI Polls (every 5s) -> Toast when Ready.
*   **Data parsing:** AI output -> Strip markdown -> Regex extract -> Schema validate -> Save JSON to DB.
*   **Key Design Choices:**
    *   Neon HTTP driver for serverless scale.
    *   Client-side UUID generation for optimistic UI redirects.
    *   Upsert-via-delete for regenerating flashcards.
*   **Known Flaws to Admit to:** API key in frontend (prototyping shortcut), lack of strict API ownership checks, lack of DB-enforced credit limits.

---

# Top 30 Things I Must Remember

### Architecture & Backend
- [ ] Next.js API routes act as the backend (no separate Express server).
- [ ] Neon DB uses an HTTP driver, not TCP (prevents connection pool issues).
- [ ] Drizzle ORM is used for lightweight, typed SQL generation.
- [ ] Inngest handles durable background jobs via `step.run()` for retries.
- [ ] Course generation uses a "Fire-and-Forget" API pattern.
- [ ] `courseId` is generated on the client via `uuidv4()` for instant redirects.
- [ ] Stripe integration relies on webhook HMAC signature validation.
- [ ] Stripe `checkout.session.completed` event updates `isMember=true`.
- [ ] User provisioning happens via Inngest `user.created` event on first login.
- [ ] Content generation uses "Upsert-via-Delete" to avoid stale data.

### Frontend & State
- [ ] No Redux/Zustand; state is local to React components.
- [ ] Real-time updates rely on client-side HTTP polling (every 4-5s).
- [ ] Polling intervals are stored in `useRef` to prevent re-render bugs.
- [ ] UI relies on a `loadState` string machine (`loading`, `generating`, `ready`, etc.).
- [ ] Optimistic UI is used for course deletion (hides card before server confirms).
- [ ] Clerk handles all auth via middleware and JWT cookies.
- [ ] Flashcards use a custom swipeable carousel (Embla) + flip animation.
- [ ] Quiz engine calculates score by strictly matching string values.
- [ ] Notes reader uses `dangerouslySetInnerHTML` for AI HTML.

### AI & Prompting
- [ ] Gemini 2.5 Flash is used for speed and JSON structure adherence.
- [ ] Uses "Chat Session Few-Shot Prompting" (injecting history to enforce format).
- [ ] Strict validation pipeline: Strip markdown → Parse → Validate against schema.
- [ ] Partial failures during notes generation are caught and ignored ("partial is better than none").
- [ ] AI retries up to 2 times synchronously if it returns malformed JSON.
- [ ] Chapter notes are generated sequentially to avoid AI rate limits.

### Security & Trade-offs
- [ ] `NEXT_PUBLIC_GEMINI_API_KEY` is a known security debt (must be fixed).
- [ ] Missing API authorization checks (users could theoretically access others' data).
- [ ] XSS risk exists with `dangerouslySetInnerHTML` (requires DOMPurify).
- [ ] Traded WebSockets for Polling due to serverless constraints.
- [ ] Traded DB Foreign Keys for application-level flexibility.

---

# Top 20 Most Likely Questions

1.  Can you walk me through the architecture of Study Buddy?
2.  Why did you choose Next.js and the App Router for this project?
3.  How do you handle long-running AI requests without timing out the serverless function?
4.  Why use Inngest instead of a standard Redis queue like BullMQ?
5.  Explain your database choice (Neon) and why you used the HTTP driver.
6.  How do you enforce that the AI returns the exact JSON structure you need?
7.  What happens if the Gemini API fails during chapter 3 out of 10? How does the system recover?
8.  I see you use polling for status updates. Why not WebSockets or Server-Sent Events (SSE)?
9.  How is user state and authentication managed across the app?
10. Walk me through the Stripe subscription lifecycle in your app. How do you know a user actually paid?
11. How do you secure your Stripe webhooks?
12. Why do you generate the `courseId` on the client instead of the server?
13. How do you handle optimistic UI updates when a user deletes a course?
14. `dangerouslySetInnerHTML` is used in your code. Are you worried about XSS? How would you fix it?
15. I noticed a `NEXT_PUBLIC_GEMINI_API_KEY`. What are the security implications of this?
16. If two users request flashcards at the exact same time, are there any race conditions in your DB?
17. Why did you choose Drizzle ORM over Prisma?
18. How does the freemium credit system work technically? (Be prepared to admit the backend enforcement gap).
19. What was the hardest technical challenge you faced while building this?
20. If you had to scale this application to 100,000 active users tomorrow, what would break first, and how would you fix it?
