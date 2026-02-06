# FluxAI

**Technical Hiring Assessment Platform**

FluxAI is a modern, full-stack platform for evaluating technical candidates through structured, multi-round assessments. It combines automated grading, browser-based proctoring, and async workflows to help engineering teams hire faster with higher signal quality.

---

## Key Features

| Capability | Description |
|------------|-------------|
| **Multi-round assessments** | MCQ → DSA → AI Interview pipeline |
| **User onboarding flow** | Signup → Onboarding → Dashboard journey |
| **Protected routes** | Auth-gated onboarding and dashboard |
| **Workspace dropdown** | Invite, Settings, Logout from sidebar |
| **Browser proctoring** | Tab-switch, fullscreen, face detection |
| **Async evaluation** | BullMQ-based background processing |
| **Dynamic workspaces** | Organization-based multi-tenancy |

---

## Tech Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **State:** React Context + hooks
- **Validation:** Zod

### Backend
- **Runtime:** Node.js + TypeScript
- **Framework:** Express.js
- **Database:** MongoDB + Mongoose
- **Auth:** JWT (stateless)
- **Queue:** BullMQ + Redis

---

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB 7+
- Redis 7+ (for background jobs)

### Backend Setup

```bash
cd FluxAI-backend

npm install
cp .env.example .env
# Edit .env: MONGODB_URI, JWT_SECRET

npm run dev
# → http://localhost:5001
```

### Frontend Setup

```bash
cd FluxAI-frontend

npm install
cp .env.example .env.local
# Edit: NEXT_PUBLIC_API_URL=http://localhost:5001/api

npm run dev
# → http://localhost:3000
```

---

## Repository Structure

```
FluxAI/
├── FluxAI-frontend/          # Next.js application
│   ├── src/
│   │   ├── app/              # Pages (App Router)
│   │   ├── components/       # Shared UI components
│   │   ├── features/         # Feature modules
│   │   └── lib/              # API clients, context
│   └── public/
│
├── FluxAI-backend/           # Express API server
│   ├── src/
│   │   ├── database/
│   │   │   ├── mongodb.ts    # Connection
│   │   │   └── models/       # Mongoose models
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── onboarding/   # User onboarding
│   │   │   ├── organizations/
│   │   │   ├── assessments/
│   │   │   ├── questions/
│   │   │   ├── attempts/
│   │   │   ├── proctoring/
│   │   │   ├── evaluation/
│   │   │   ├── results/
│   │   │   ├── candidates/   # Candidate management
│   │   │   ├── analytics/    # KPIs & Reporting
│   │   │   ├── dashboard/    # Dashboard aggregation
│   │   │   ├── public/       # Public career APIs
│   │   │   └── files/
│   │   └── jobs/             # BullMQ workers
│   └── package.json
│
├── features.md               # Detailed feature docs
└── README.md
```

---

## Environment Variables

### Backend (`FluxAI-backend/.env`)

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | JWT signing secret |
| `PORT` | Server port (default: 5001) |
| `CORS_ORIGIN` | Frontend URL |
| `REDIS_URL` | Redis connection (for jobs) |

### Frontend (`FluxAI-frontend/.env.local`)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API URL |

---

## API Highlights

| Endpoint | Description |
|----------|-------------|
| `POST /api/auth/signup` | Register (returns `onboardingCompleted: false`) |
| `POST /api/auth/login` | Login with onboarding status |
| `POST /api/onboarding/complete` | Complete onboarding + update org |
| `GET /api/assessments` | List assessments |
| `POST /api/assessments/:id/attempts` | Start candidate attempt |
| `GET /api/attempts/:id/result` | Get attempt results |
| `GET /api/jobs` | List & filter jobs |
| `GET /api/candidates` | Manage candidate pool |
| `GET /api/analytics` | Dashboard KPIs & trends |
| `GET /api/public/companies/:slug` | Public career page |

---

## User Flows

### New User
```
/signup → /onboard/step-1 → step-2 → step-3 → /dashboard
```

### Returning User
```
/signin → /dashboard (if onboarding done)
        → /onboard/step-1 (if not)
```

### Logout
```
Workspace dropdown → Logout → / (landing page)
```

---

## Scripts

### Backend
```bash
npm run dev      # Dev server
npm run build    # Build
npm run start    # Production
npm run worker   # Background worker
```

### Frontend
```bash
npm run dev      # Dev server
npm run build    # Build
npm run lint     # Lint
```

---

## Roadmap

- [ ] DSA code execution sandbox
- [ ] AI interview scoring (LLM)
- [ ] Email delivery
- [ ] Payments & billing
- [ ] ATS integrations

---

*Built for engineering teams that care about hiring quality.*
