# 📚 Study Buddy

**AI-powered personalized learning — generate full courses, notes, flashcards, and quizzes from any topic in seconds.**

[![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-0.45-C5F74F?logo=drizzle&logoColor=black)](https://orm.drizzle.team/)
[![NeonDB](https://img.shields.io/badge/NeonDB-PostgreSQL-00E5BD?logo=postgresql&logoColor=white)](https://neon.tech/)
[![Clerk](https://img.shields.io/badge/Auth-Clerk-6C47FF?logo=clerk&logoColor=white)](https://clerk.com/)
[![Stripe](https://img.shields.io/badge/Payments-Stripe-635BFF?logo=stripe&logoColor=white)](https://stripe.com/)
[![Inngest](https://img.shields.io/badge/Background_Jobs-Inngest-FF7438)](https://inngest.com/)
[![Gemini](https://img.shields.io/badge/AI-Gemini_2.5_Flash-4285F4?logo=google&logoColor=white)](https://deepmind.google/technologies/gemini/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

---

## Overview

Study Buddy is a full-stack SaaS application that transforms any topic into a complete, structured learning experience using Google's Gemini 2.5 Flash model. A student enters a subject, selects a course type and difficulty level, and the platform generates a multi-chapter course outline, detailed HTML notes per chapter, interactive flashcards, and a multiple-choice quiz — all powered by AI and delivered with real-time status updates.

The platform targets students, self-learners, and exam preppers who want structured, exam-ready material without the manual effort of sourcing and organizing content. Rather than summarizing one document, Study Buddy synthesizes knowledge from scratch, building a coherent curriculum around any topic from introductory to advanced difficulty.

Monetization is built in from the ground up. Free users receive 5 course credits; Pro subscribers get unlimited AI-generated courses, advanced quiz access, and priority generation. Stripe handles subscription billing end-to-end, with a webhook-verified upgrade flow that updates membership state in the database automatically.

---

## Key Features

- **Multi-step course creation wizard** — select course type, set topic and difficulty level, then fire course generation with a single click
- **AI course outline generation** — Gemini 2.5 Flash produces a structured JSON course layout including chapters, summaries, emojis, and topic lists
- **Background chapter notes generation** — HTML-formatted, exam-style notes generated per chapter asynchronously without blocking the UI response
- **Flip-card flashcard system** — AI-generated question/answer flashcards with a swipeable carousel, per-card flip animation, progress bar, and live polling until generation completes
- **Interactive quiz engine** — multiple-choice quizzes with immediate answer feedback, colour-coded option chips, score summary screen with grade classification, and restart / regenerate controls
- **Chapter notes reader** — paginated, HTML-rendered chapter notes with prev/next navigation and a chapter-select sidebar
- **Real-time generation status** — client-side polling (5 s interval, 2-minute max) across all study modes; toast notifications fire when a course transitions from `Generating` → `Ready`
- **Stripe subscription billing** — hosted Checkout session, webhook-verified `checkout.session.completed` handler, and per-user `isMember` / `stripeCustomerId` / `stripeSubscriptionId` stored in the DB
- **Freemium credit system** — sidebar displays available credits for free users; Pro members see an active subscription badge
- **Clerk authentication** — sign-in / sign-up pages, route-level middleware protection on `/dashboard`, `/create`, and `/course/*`
- **Auto user provisioning** — Inngest `user.created` event creates a DB user record on first sign-in without blocking Clerk's auth flow
- **Course deletion & refresh** — dashboard supports optimistic course removal and manual list refresh with a spinning indicator
- **Dark UI with Aurora background** — WebGL-powered animated aurora effect on the landing and create pages via the OGL library
- **shadcn/ui component library** — Button, Progress, Carousel, and other primitives, with Radix UI under the hood

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router) |
| **Language** | JavaScript / TypeScript (mixed) |
| **Styling** | Tailwind CSS v4, tw-animate-css, shadcn/ui |
| **UI Components** | shadcn/ui (Radix UI), Lucide React icons, Embla Carousel, React Card Flip |
| **AI** | Google Gemini 2.5 Flash (`@google/generative-ai`) |
| **Authentication** | Clerk (`@clerk/nextjs`) |
| **Database** | Neon serverless PostgreSQL (`@neondatabase/serverless`) |
| **ORM** | Drizzle ORM + Drizzle Kit |
| **Background Jobs** | Inngest (event-driven, durable functions) |
| **Payments** | Stripe (`stripe`, `@stripe/stripe-js`) |
| **HTTP Client** | Axios |
| **WebGL / Canvas** | OGL (Aurora background effect) |
| **Notifications** | Sonner (toast) |
| **Utilities** | `uuid`, `date-fns`, `clsx`, `tailwind-merge`, `class-variance-authority` |
| **Dev Tools** | ESLint, Drizzle Kit, `inngest-cli` |

---

## Architecture / How It Works

Study Buddy follows a **Next.js App Router** architecture with three async layers: the React client, the Next.js API route layer, and a durable background-job layer via Inngest.

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (React)                           │
│  /create  →  wizard  →  POST /api/generate-course-outline        │
│  /dashboard  ←  polls  ←  course status: Generating | Ready      │
│  /course/[id]/flashcards  ←  polls  ←  studyTypeContent status  │
│  /course/[id]/quiz        ←  polls  ←  studyTypeContent status  │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTP (Axios)
┌────────────────────────▼────────────────────────────────────────┐
│                  Next.js API Routes (Edge/Node)                  │
│  POST /api/generate-course-outline  → Gemini outline → DB insert │
│         └──── fire-and-forget: generateNotesInBackground()       │
│  POST /api/study-type-content  → DB record → Inngest event emit  │
│  POST /api/study-type          → fetch notes / flashcards / quiz │
│  GET  /api/courses             → fetch single course             │
│  POST /api/courses             → fetch user's course list        │
│  POST /api/stripe/checkout     → Stripe Checkout session create  │
│  POST /api/stripe/webhook      → verify sig → mark isMember=true │
│  POST /api/inngest             → Inngest event handler endpoint  │
│  POST /api/create-user         → emit user.created event         │
└──────────┬──────────────────────────────┬───────────────────────┘
           │ Drizzle ORM                  │ Inngest SDK
┌──────────▼──────────┐        ┌──────────▼───────────────────────┐
│  Neon PostgreSQL     │        │  Inngest Durable Functions        │
│  users               │        │  CreateNewUser (user.created)     │
│  study_material      │        │  GenerateNotes (notes.generate)   │
│  chapterNotes        │        │  GenerateStudyTypeContent         │
│  studyTypeContent    │        │    (studyType.content)            │
└──────────────────────┘        └──────────────────────────────────┘
```

**Course generation flow:**
1. User submits the creation form → `POST /api/generate-course-outline`
2. Gemini produces a JSON course outline; it is inserted into `study_material` with `status = 'Generating'`
3. `generateNotesInBackground()` fires asynchronously — Gemini generates HTML notes per chapter and inserts rows into `chapterNotes`; status is updated to `'Ready'` when all chapters complete
4. The dashboard polls `/api/courses` every 5 s; a toast fires when status flips to `'Ready'`
5. From the course view, users trigger flashcard / quiz generation → `POST /api/study-type-content` inserts a `status = 'Generating'` record and emits an Inngest event → `GenerateStudyTypeContent` calls Gemini, parses JSON, and updates the record to `status = 'Ready'`
6. The flashcard / quiz pages poll `/api/study-type` every 4 s until content is ready

---

## Folder Structure

```
study-buddy/
├── app/
│   ├── (auth)/
│   │   ├── sign-in/              # Clerk-hosted sign-in page
│   │   └── sign-up/              # Clerk-hosted sign-up page
│   ├── _components/
│   │   ├── Aurora.jsx            # WebGL aurora background (OGL)
│   │   └── Aurora.css
│   ├── api/
│   │   ├── courses/              # GET/POST course data
│   │   ├── create-user/          # Emit Inngest user.created event
│   │   ├── generate-course-outline/  # AI outline + async notes gen
│   │   ├── inngest/              # Inngest event handler endpoint
│   │   ├── stripe/
│   │   │   ├── checkout/         # Create Stripe Checkout session
│   │   │   └── webhook/          # Verify webhook + update isMember
│   │   ├── study-type/           # Fetch notes / flashcards / quiz / ALL
│   │   ├── study-type-content/   # Trigger AI content generation
│   │   └── user/                 # Fetch user membership status
│   ├── course/
│   │   └── [courseId]/
│   │       ├── _components/
│   │       │   ├── CourseIntroCard.jsx
│   │       │   ├── StudyMaterialSection.jsx
│   │       │   ├── ChapterList.jsx
│   │       │   └── MaterialCardItem.jsx
│   │       ├── flashcards/       # Flashcard carousel + polling
│   │       ├── notes/            # Paginated HTML notes reader
│   │       ├── quiz/             # MCQ quiz engine + results screen
│   │       ├── layout.jsx
│   │       └── page.jsx          # Course detail view
│   ├── create/
│   │   ├── _components/          # SelectOption, TopicInput steps
│   │   └── page.jsx              # Multi-step course creation wizard
│   ├── dashboard/
│   │   ├── _components/
│   │   │   ├── SideBar.jsx       # Nav + credit / membership panel
│   │   │   ├── CourseList.jsx    # User's courses with auto-refresh
│   │   │   ├── CourseCardItem.jsx
│   │   │   ├── DashboardHeader.jsx
│   │   │   └── welcomeBanner.jsx
│   │   ├── profile/              # User profile page
│   │   ├── upgrade/              # Pricing + Stripe checkout trigger
│   │   ├── layout.jsx
│   │   └── page.jsx
│   ├── globals.css               # Tailwind v4 + shadcn theme tokens
│   ├── layout.jsx                # Root layout + ClerkProvider
│   ├── page.jsx                  # Landing page
│   └── provider.js               # Theme provider
├── components/
│   └── ui/                       # shadcn/ui primitives (Button, Progress, Carousel...)
├── configs/
│   ├── AiModel.js                # Gemini model instances + system prompts
│   ├── db.js                     # Drizzle + Neon DB connection
│   └── schema.js                 # DB table definitions
├── inngest/
│   ├── client.js                 # Inngest client initialisation
│   └── functions.js              # CreateNewUser, GenerateNotes, GenerateStudyTypeContent
├── drizzle/                      # Drizzle migration files
├── middleware.js                 # Clerk route protection middleware
├── drizzle.config.js             # Drizzle Kit config
├── next.config.ts
├── tsconfig.json
└── package.json
```

---

## Installation

### Prerequisites

- Node.js >= 18
- A [Neon](https://neon.tech/) PostgreSQL database
- A [Clerk](https://clerk.com/) application
- A [Google AI Studio](https://aistudio.google.com/) API key (Gemini)
- A [Stripe](https://stripe.com/) account with a subscription product/price
- An [Inngest](https://inngest.com/) account (or run locally with `inngest-cli`)

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/<your-username>/study-buddy.git
cd study-buddy

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.local.example .env.local
# Edit .env.local with your credentials (see Environment Variables below)

# 4. Push the database schema to Neon
npx drizzle-kit push

# 5. Start the development server
npm run dev

# 6. (Separate terminal) Start the Inngest dev server
npm run dev:inngest
```

The app will be available at `http://localhost:3000`.

> **Stripe webhooks in development:** Use the [Stripe CLI](https://stripe.com/docs/stripe-cli) to forward events to your local server:
> ```bash
> stripe listen --forward-to localhost:3000/api/stripe/webhook
> ```

---

## Usage

### Creating a Course

1. Sign in via Clerk (email / OAuth)
2. Click **+ Create New** in the sidebar
3. **Step 1 — Select course type** (e.g., Exam, Job Interview, Practice, Coding Prep)
4. **Step 2 — Enter topic and difficulty level** (Easy / Medium / Hard)
5. Click **Generate** — the outline and notes are generated asynchronously; you are redirected to the dashboard immediately

### Studying a Course

Navigate to any ready course card on the dashboard. The course view provides:

| Study Mode | Description |
|---|---|
| **Notes / Chapters** | Paginated HTML notes, one chapter at a time |
| **Flashcards** | Flip-card carousel; generate on demand if not yet created |
| **Quiz** | Multiple-choice quiz; immediate feedback + score summary |
| **Test Series** | Q&A long-form test (coming soon) |

### Upgrading to Pro

Go to **Dashboard → Upgrade** to view the pricing page and subscribe via Stripe Checkout. On successful payment, the Stripe webhook updates your account to `isMember = true` automatically.

---

## Environment Variables

Create a `.env.local` file in the project root with the following keys:

| Variable | Description | Required |
|---|---|---|
| `DATABASE_CONNECTION_STRING` | Neon PostgreSQL connection string (with `sslmode=require`) | ✅ |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key | ✅ |
| `CLERK_SECRET_KEY` | Clerk secret key | ✅ |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Clerk sign-in redirect path (e.g. `/sign-in`) | ✅ |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Clerk sign-up redirect path (e.g. `/sign-up`) | ✅ |
| `NEXT_PUBLIC_GEMINI_API_KEY` | Google Gemini API key | ✅ |
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_live_...` or `sk_test_...`) | ✅ |
| `STRIPE_PRICE_ID` | Stripe Price ID for the Pro subscription product | ✅ |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret (for signature verification) | ✅ |
| `NEXT_PUBLIC_APP_URL` | Public base URL for Stripe redirect (e.g. `http://localhost:3000`) | ✅ |
| `INNGEST_DEV` | Set to `1` to enable Inngest dev mode locally | Optional |

---

## Testing

There are no automated test suites currently configured. A `test-gen.js` script is present at the root for manual AI generation testing:

```bash
node test-gen.js
```

To run the linter:

```bash
npm run lint
```

> **Note:** Adding unit tests (Jest / Vitest) and integration tests (Playwright) is on the roadmap.

---

## Roadmap

- [ ] **PDF export** — export generated notes as a downloadable PDF (listed as a Pro feature in the upgrade UI)
- [ ] **Test Series mode** — complete the Q&A long-form test study type (`type: 'qa'`) with full UI and scoring
- [ ] **Voice / Record and Learn** — the "Record and Learn" study mode is scaffolded in the UI (`/course/[id]/voice`) but not yet implemented
- [ ] **Study activity calendar** — `react-activity-calendar` is already installed; wire it to per-user study session data on the profile page
- [ ] **Automated test coverage** — add Vitest unit tests for Inngest functions and Playwright end-to-end tests for the course creation and quiz flows

---

## Contributing

Contributions are welcome. Please follow these steps:

1. Fork the repository and create your branch: `git checkout -b feat/your-feature`
2. Commit your changes with a clear message: `git commit -m 'feat: add X'`
3. Push to your fork: `git push origin feat/your-feature`
4. Open a Pull Request against `main` — describe what changed and why

**Code style:** ESLint is configured via `eslint.config.mjs` with `eslint-config-next`. Run `npm run lint` before submitting a PR.

---

## License

This project is licensed under the **MIT License**. See the [LICENSE](./LICENSE) file for details.

---

## Contact / Author

Built by **[Sharvaj Vidyut]**

- GitHub: [@sysvidyut](https://github.com/sysvisyut)
- LinkedIn: [Sharvaj Vidyut](https://www.linkedin.com/in/sharvaj-vidyut-72736828b/)
- Email: [sharvajvidyut@gmail.com](mailto:sharvajvidyut@gmail.com)

---

<p align="center">
  <sub>Powered by Google Gemini 2.5 Flash · Built with Next.js · Deployed on Vercel</sub>
</p>
