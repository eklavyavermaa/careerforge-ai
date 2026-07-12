# CareerForge AI

An AI-powered career development platform: resume management, AI resume analysis (ATS
scoring, keyword/grammar analysis, skill gaps), JD matching, cover letter generation,
mock interview prep with AI feedback, learning roadmaps, and application tracking.

**Status**: Backend is fully complete (11 modules, 52 endpoints). Frontend is ~80%
complete and builds cleanly. See `ROADMAP.md` for the full continuation summary.

## Tech Stack

- **Backend**: Node.js, Express, MongoDB (Mongoose)
- **Auth**: JWT (access + rotating refresh tokens), httpOnly cookies
- **File storage**: Cloudinary (resume PDFs)
- **PDF parsing**: `pdf-parse`
- **AI**: Google Gemini (`@google/genai` SDK, `gemini-2.5-flash`)
- **Security**: helmet, express-rate-limit, express-mongo-sanitize, xss-clean, bcrypt
- **Validation**: express-validator
- **Frontend**: React 19, Vite, Tailwind CSS v4, Radix UI + CVA (shadcn/ui-style
  components), React Router, TanStack Query, Axios, React Hook Form + Zod, Framer Motion,
  Recharts, Lucide React, Sonner

## Getting Started

### Backend

```bash
cd backend
npm install
cp .env.example .env   # fill in real values
npm run dev             # or: npm start
```

Health check: `GET /api/v1/health`

### Frontend

```bash
cd frontend
npm install
cp .env.example .env   # set VITE_API_URL to your backend URL
npm run dev              # dev server on :5173
npm run build             # production build to dist/
```

### Required environment variables

**Backend** — see `backend/.env.example`. At minimum you need:
- `MONGO_URI` — MongoDB connection string
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` — long random strings
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `GEMINI_API_KEY` — Google AI Studio API key
- `EMAIL_*` — SMTP credentials for verification/reset emails

**Frontend** — see `frontend/.env.example`:
- `VITE_API_URL` — your backend's base API URL (e.g. `http://localhost:5000/api/v1`)

> **Note on Gemini:** this project uses `@google/genai` (the current SDK) and
> `gemini-2.5-flash` (the current stable model). The older `@google/generative-ai`
> package and `gemini-1.5-flash` model are deprecated/shut down by Google and will not work.

## Architecture

Standard MVC on the backend, feature-folder React on the frontend:

```
backend/src/
├── app.js / server.js
├── config/          # db, cloudinary client config
├── models/            # 12 Mongoose schemas
├── controllers/         # thin, delegate to services
├── services/              # Cloudinary, PDF, Gemini
├── routes/                  # 11 Express routers, 52 endpoints
├── middleware/                # auth, validation, file upload, error handling
├── validators/                  # express-validator rule sets per resource
└── utils/                         # AppError, catchAsync, pagination, events,
                                      notify, AI response validation, prompt builders

frontend/src/
├── api/              # axios client (silent refresh) + one module per resource
├── context/            # Auth, Theme
├── components/
│   ├── ui/               # design-system primitives (button, card, dialog, ...)
│   ├── layout/              # Sidebar, Topbar, layouts, route guards
│   └── shared/                # ScoreGauge, PageHeader, EmptyState, ErrorState, ...
├── pages/                        # one folder per feature
└── lib/                            # cn(), error parsing, Zod schemas
```

## API Reference

All routes are prefixed `/api/v1`. Protected routes require a valid access token
(Bearer header, set by `/auth/login`).

### Auth
| Method | Route | Description |
|---|---|---|
| POST | `/auth/register` | Register a new user |
| POST | `/auth/login` | Login, returns access token + refresh cookie |
| POST | `/auth/logout` | Revoke refresh token |
| POST | `/auth/refresh` | Rotate refresh token, issue new access token |
| POST | `/auth/verify-email` | Verify email via token |
| POST | `/auth/resend-verification` | Resend verification email |
| POST | `/auth/forgot-password` | Request password reset email |
| POST | `/auth/reset-password` | Reset password via token |
| GET | `/auth/me` | Get current authenticated user |

### Resumes (protected)
| Method | Route | Description |
|---|---|---|
| POST | `/resumes` | Upload a resume PDF (`multipart/form-data`, field `resume`) |
| GET | `/resumes` | List resumes, paginated |
| GET | `/resumes/:id` | Get one resume (`?includeText=true` for extracted text) |
| GET | `/resumes/:id/versions` | Get all versions sharing that resume's title |
| PATCH | `/resumes/:id` | Update title |
| DELETE | `/resumes/:id` | Delete (removes Cloudinary file + its analyses) |

### Resume Analysis (protected) — also covers JD matching
| Method | Route | Description |
|---|---|---|
| POST | `/analysis` | `{ resumeId, jobDescription? }` — JD provided → returns `matchPercentage` too |
| GET | `/analysis` | List all analyses, paginated |
| GET | `/analysis/resume/:resumeId` | List analyses for one resume |
| GET | `/analysis/:id` | Get one report |

### Cover Letters (protected)
| Method | Route | Description |
|---|---|---|
| POST | `/cover-letters` | `{ resumeId, jobDescription?, companyName?, roleTitle?, tone? }` |
| GET | `/cover-letters` | List, paginated |
| GET | `/cover-letters/:id` | Get one |
| DELETE | `/cover-letters/:id` | Delete |

### Interview Prep (protected)
| Method | Route | Description |
|---|---|---|
| POST | `/interviews` | `{ targetRole, experienceLevel?, categories?, count? }` — starts a session |
| GET | `/interviews` | List sessions, paginated |
| GET | `/interviews/:id` | Get one session |
| POST | `/interviews/:id/questions/:questionId/answer` | `{ answer }` -> AI feedback + score |
| POST | `/interviews/:id/complete` | Finalizes session, generates overall score/feedback |
| DELETE | `/interviews/:id` | Delete |

### Learning Roadmap (protected) — skill gap analysis output
| Method | Route | Description |
|---|---|---|
| POST | `/roadmaps` | `{ targetRole, resumeId? }` — uses the resume's latest analysis for skill gaps |
| GET | `/roadmaps` | List, paginated |
| GET | `/roadmaps/:id` | Get one |
| PATCH | `/roadmaps/:id/items/:itemId` | `{ isCompleted }` — toggles a learning item |
| DELETE | `/roadmaps/:id` | Delete |

### Applications (protected)
| Method | Route | Description |
|---|---|---|
| POST | `/applications` | Create |
| GET | `/applications` | List — supports `status`, `search`, `sortBy`, `order`, pagination |
| GET | `/applications/stats` | Aggregate counts by status |
| GET | `/applications/:id` | Get one |
| PATCH | `/applications/:id` | Update fields |
| PATCH | `/applications/:id/status` | `{ status, note? }` — appends to timeline |
| DELETE | `/applications/:id` | Delete |

### Analytics (protected)
| Method | Route | Description |
|---|---|---|
| GET | `/analytics/summary` | Dashboard summary counts/scores |
| GET | `/analytics/weekly-progress` | 8-week activity, grouped by ISO week + event type |
| GET | `/analytics/recent-activity` | Recent event feed, paginated |

### Notifications (protected)
| Method | Route | Description |
|---|---|---|
| GET | `/notifications` | List (`?unreadOnly=true`), paginated, includes `unreadCount` |
| PATCH | `/notifications/:id/read` | Mark one as read |
| PATCH | `/notifications/read-all` | Mark all as read |
| DELETE | `/notifications/:id` | Delete |

### Profile & Settings (protected)
| Method | Route | Description |
|---|---|---|
| GET / PATCH | `/profile` | Headline, bio, target role, skills, links, education, experience |
| GET / PATCH | `/settings` | Theme, email notifications, privacy, AI tone preference |

## Error format

```json
{
  "success": false,
  "status": "fail",
  "message": "Human-readable message"
}
```

Validation errors (400) include a field-level `errors` array from express-validator.

## Deployment

- **Backend → Render**: `backend/render.yaml` is ready to use (Blueprint deploy). Set the
  `sync: false` env vars in the Render dashboard.
- **Frontend → Vercel**: `frontend/vercel.json` is ready (SPA rewrites configured). Set
  `VITE_API_URL` to your deployed backend URL in Vercel's project settings.
- **MongoDB Atlas**: create a cluster, allow-list Render's IPs (or `0.0.0.0/0` for
  simplicity), and use that connection string as `MONGO_URI`.
- **Cloudinary**: create a free account, use the dashboard's API credentials directly.

## Continuing development

Open `ROADMAP.md` — it has a full "Project Continuation Summary" written specifically so
a fresh Claude conversation (or Claude Code session) can pick up development seamlessly.
