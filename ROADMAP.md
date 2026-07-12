# CareerForge AI — Project Continuation Summary

Paste this whole file into a new chat if the conversation limit is hit — it has everything
needed to continue seamlessly.

## Current status: Backend 100% complete · Frontend ~80% complete, builds clean, not yet deployed

## Tech stack (as built)
**Backend**: Node.js, Express, MongoDB/Mongoose, JWT (access + rotating refresh cookie),
bcrypt, Multer, Cloudinary, `@google/genai` (Gemini `gemini-2.5-flash`), express-validator,
express-rate-limit, helmet, express-mongo-sanitize, xss-clean.

**Frontend**: React 19, Vite 8, Tailwind CSS v4, hand-built shadcn/ui-style components
(Radix UI primitives + CVA — not the shadcn CLI, since it needs a network the sandbox
didn't allow), React Router v7, TanStack Query v5, Axios, React Hook Form + Zod,
Framer Motion, Recharts, Lucide React, Sonner (toasts).

## Backend — fully complete (11 modules, 52 routes, verified)
Every module follows the same layering: `routes/` → `validators/` (express-validator) →
`controllers/` (thin, `catchAsync`-wrapped) → `services/`/`utils/` for reusable logic.

1. **Auth** — register/login/logout, email verification, refresh-token rotation with
   theft/reuse detection, forgot/reset password, `protect` + `restrictTo` middleware.
2. **Resumes** — PDF upload (Multer, in-memory, MIME+ext validated), Cloudinary storage,
   `pdf-parse` text extraction (handles empty/corrupt/scanned PDFs), auto-versioning per
   title, single active resume per user, full CRUD, version history.
3. **Resume Analysis** — Gemini-powered ATS score, resume score, JD match % (optional),
   summary, strengths/weaknesses, extracted/missing skills, keyword analysis, grammar
   issues, improvement suggestions, industry readiness score. Response validated +
   normalized before persisting (`utils/aiResponseValidator.js`).
4. **Cover Letters** — `CoverLetter` model (new), Gemini-generated, tone-configurable,
   full history per user.
5. **Interview Prep** — `InterviewSession` model, AI-generated question sets (HR/technical/
   behavioral), per-answer AI feedback + 0-10 score, session completion with an AI overall
   score/feedback synthesis.
6. **Learning Roadmap** — AI-generated milestones/items derived from a resume's latest
   missing-skills analysis (or a general target-role roadmap), per-item completion
   toggling with auto-recomputed progress %.
7. **Application Tracker** — full CRUD, status timeline, status-change notifications,
   filtering/search/sort, aggregate stats endpoint.
8. **Analytics Dashboard** — dashboard summary aggregation, weekly activity (aggregation
   pipeline grouped by ISO week + event type, for the frontend bar chart), recent
   activity feed. Fed by a non-blocking `logEvent()` helper called from other controllers.
9. **Notifications** — in-app notifications (list/unread count/mark-read/mark-all-read/
   delete), created via a non-blocking `createNotification()` helper from other controllers
   (analysis complete, interview completed, roadmap milestone, application status change).
10. **Profile** — headline/bio/location/target role/experience level/skills/social links/
    education/experience array fields (education/experience arrays accepted by the model
    but not yet exposed in the frontend form — see remaining work).
11. **Settings** — theme, per-category email notification toggles, profile visibility,
    default AI writing tone.

**Verification performed** (no local MongoDB was available in the sandbox, so real DB
integration tests weren't possible — everything below was verified another way):
- Full app boot test with all 52 routes printed and route-order-checked (no `/:id` shadowing
  static paths like `/stats`)
- `node --check` on every backend file — zero syntax errors
- Real PDF generation + extraction tested for valid/empty/corrupted files
- Multer middleware tested live over HTTP (valid PDF / wrong type / missing file)
- Gemini service retry logic tested with a mocked SDK: retries on 429, fails fast on 401,
  correctly strips/parses fenced JSON
- AI response validator/normalizer unit-tested against a deliberately messy payload
- Every new prompt builder unit-tested for correct interpolation

## Frontend — what's built and working
Design: a "forge" concept — dark graphite/steel surfaces, molten ember-orange primary
accent, steel-blue secondary, gold for scores. Signature component: `<ScoreGauge/>`, a
radial gradient gauge reused everywhere a 0-100 AI score appears (ATS score, resume score,
interview score, industry readiness, JD match %). Space Grotesk (display) + Inter (body) +
JetBrains Mono (scores/data). Full light/dark mode via CSS variables + `.dark` class,
toggle in the topbar, persisted to `localStorage`.

**Fully working pages**:
- Login, Register, Verify Email, Forgot/Reset Password (RHF + Zod, matching backend
  validators exactly)
- Dashboard — stat cards, `<ScoreGauge/>`s for latest resume scores, Recharts weekly
  activity bar chart, recent activity feed
- Resumes — list + upload dialog + delete; detail page with version history, "Analyze"
  dialog (optional JD textarea → covers **JD matching** in the same flow), links to past
  analysis reports
- Analysis report — the most detail-rich page: 4 `<ScoreGauge/>`s (ATS/Resume/Industry
  Ready/JD Match), summary, strengths/weaknesses, extracted/missing skill badges, keyword
  analysis badges, grammar issues, improvement suggestions
- Cover Letters — list + generate dialog (resume picker, company/role/tone/JD) + detail
  view with copy-to-clipboard
- Interview Prep — start-session dialog (role/experience/question count) → session page
  with per-question textarea, instant AI feedback + score per answer, "Complete session"
  → overall `<ScoreGauge/>` + AI summary
- Learning Roadmap — generate dialog (target role + optional resume-based skill gap) →
  detail page with milestone checklist, progress bar, missing-skill badges
- Application Tracker — stat cards, status filter, inline status-change dropdown per row,
  create dialog, delete
- Profile — headline/bio/location/phone/target role/experience level/skills/social links
- Settings — theme, email notification toggles, privacy, default AI tone — all
  auto-persist on change
- Global: protected routes with silent-refresh-then-redirect, toast notifications
  (Sonner) on every mutation, loading skeletons + empty states + error states with retry
  on every data-fetching page, responsive (mobile sidebar drawer, responsive grids),
  React error boundary

**Verified**: `npm run build` succeeds cleanly (no warnings), `npm run lint` (oxlint) —
0 errors, `npm run preview` serves the built app (200 OK). No local backend/MongoDB was
available to click-test the running app end-to-end in this sandbox.

## Remaining work (in priority order for next session)
1. **Dedicated Notifications page** (`/notifications`) — currently notifications only show
   in the topbar dropdown (last 8, mark-all-read). A full paginated page with the existing
   `notificationApi` would complete this.
2. **Profile: education & experience sections** — the backend model and API already accept
   `education[]`/`experience[]` arrays; the frontend form only covers the scalar fields.
   Needs an "add/remove entry" repeating field group (React Hook Form `useFieldArray`).
3. **Code-splitting** — the production JS bundle is ~1.16MB (350KB gzipped), single chunk.
   Add `React.lazy()` + `Suspense` per route to split it down, especially recharts/framer-motion.
4. **Application detail page** — currently the tracker is list-only with an inline status
   dropdown; a dedicated `/applications/:id` page with the full timeline history (the
   backend already stores `timeline[]`) would round this out.
5. **Landing/marketing page** — `/` currently just redirects straight to `/dashboard`.
   Fine for an app-only deploy; add a public landing page if this needs to be marketed.
6. **Real end-to-end testing** — this sandbox had no local MongoDB and no route to a real
   Gemini API key, so testing stopped at the boot/unit/mock level (see verification notes
   above). Before shipping, run it against a real MongoDB Atlas cluster + real Gemini key
   and click through every flow once.
7. **`backend/package.json` `lint` script** references `eslint`, which isn't installed as a
   dependency — either add `eslint` + a config, or switch the script to match what's
   actually installed.

## Folder structure
```
careerforge-ai/
├── README.md
├── ROADMAP.md                 # this file
├── backend/
│   ├── render.yaml
│   ├── .env.example
│   └── src/
│       ├── app.js / server.js
│       ├── config/            # db, cloudinary
│       ├── models/            # 11 Mongoose schemas (User, Profile, Resume,
│       │                        ResumeAnalysis, CoverLetter, InterviewSession,
│       │                        LearningRoadmap, Application, Notification,
│       │                        Settings, AnalyticsEvent, RefreshToken)
│       ├── controllers/       # 11 controllers
│       ├── services/          # gemini, pdf, cloudinary
│       ├── routes/            # 11 route modules, 52 endpoints
│       ├── middleware/        # auth, validate, uploadResume, errorHandler
│       ├── validators/        # express-validator rule sets + common.validator.js
│       └── utils/             # AppError, catchAsync, paginate, events, notify,
│                                 aiResponseValidator, prompts/ (5 prompt builders)
└── frontend/
    ├── vercel.json
    ├── .env.example
    └── src/
        ├── api/                # client.js (axios + refresh interceptor) + 10 resource modules
        ├── context/            # AuthContext, ThemeContext
        ├── components/
        │   ├── ui/             # button, input, card, dialog, select, tabs, etc.
        │   ├── layout/         # Sidebar, Topbar, DashboardLayout, AuthLayout, ProtectedRoute
        │   └── shared/         # ScoreGauge, PageHeader, EmptyState, ErrorState, ErrorBoundary, FormField
        ├── pages/              # auth/, dashboard/, resumes/, analysis/, coverLetters/,
        │                         interviews/, roadmaps/, applications/, profile/, settings/
        └── lib/                # utils (cn), apiError, validation/auth.schema.js
```

## Database collections
User, Profile, Resume, ResumeAnalysis, CoverLetter, InterviewSession, LearningRoadmap,
Application, Notification, Settings, AnalyticsEvent, RefreshToken (12 collections).

## How to continue
Say "continue" and pick up from the "Remaining work" list above, or name a specific item
(e.g. "build the notifications page" or "add education/experience fields to profile").

For a project this size, **Claude Code** (desktop or CLI) is worth switching to for
remaining polish — it can run both dev servers live, click-test against a real browser,
and iterate faster than a chat interface for this volume of files.
