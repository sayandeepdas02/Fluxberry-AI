# FluxAI

**Technical Hiring Assessment Platform**

FluxAI is a modern, full-stack platform for evaluating technical candidates through structured, multi-round assessments. It combines automated grading, browser-based proctoring, and async workflows to help engineering teams hire faster with higher signal quality.

Unlike legacy tools that focus solely on coding tests, FluxAI provides a complete assessment pipeline: MCQ screening, DSA challenges, and AI-powered behavioral interviews — all in one unified experience.

---

## Key Differentiators

| Capability | FluxAI | Legacy Tools |
|------------|--------|--------------|
| Multi-round assessments | ✅ MCQ → DSA → AI | Single format |
| Browser proctoring | ✅ Built-in | Add-on or none |
| Async evaluation pipeline | ✅ Queue-based | Synchronous |
| Pre-signed file uploads | ✅ S3-native | Server streaming |
| White-label ready | ✅ Multi-tenant | Single tenant |

---

## Architecture Overview

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **State:** React Context + hooks
- **Forms:** React Hook Form + Zod

### Backend
- **Runtime:** Node.js + TypeScript
- **Framework:** Express.js
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** JWT (stateless)
- **Validation:** Zod

### Async Processing
- **Queue:** BullMQ
- **Broker:** Redis
- **Pattern:** Separate API + Worker processes

### Storage
- **Provider:** S3-compatible (AWS S3, MinIO, GCS)
- **Pattern:** Pre-signed URLs (no server streaming)

---

## Repository Structure

```
FluxAI/
├── FluxAI-frontend/          # Next.js application
│   ├── src/
│   │   ├── app/              # Pages (App Router)
│   │   ├── components/       # Shared UI components
│   │   ├── features/         # Feature-specific components
│   │   ├── lib/              # Utilities and helpers
│   │   └── styles/           # Global styles
│   └── public/               # Static assets
│
├── FluxAI-backend/           # Express API server
│   ├── src/
│   │   ├── app.ts            # Express app factory
│   │   ├── server.ts         # Entry point
│   │   ├── common/           # Shared utilities
│   │   │   ├── guards/       # Auth middleware
│   │   │   ├── middleware/   # Error handling, logging
│   │   │   └── utils/        # Response helpers
│   │   ├── database/         # Prisma client
│   │   ├── modules/          # Domain modules
│   │   │   ├── auth/
│   │   │   ├── organizations/
│   │   │   ├── assessments/
│   │   │   ├── questions/
│   │   │   ├── attempts/
│   │   │   ├── proctoring/
│   │   │   ├── evaluation/
│   │   │   ├── results/
│   │   │   ├── files/
│   │   │   └── storage/
│   │   └── jobs/             # Background processing
│   │       ├── queues/
│   │       ├── processors/
│   │       └── worker.ts
│   └── prisma/
│       ├── schema.prisma     # Database schema
│       └── seed.ts           # Seed data
│
├── features.md               # Feature documentation
└── README.md                 # This file
```

---

## Local Development Setup

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Redis 7+ (for background jobs)
- pnpm or npm

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/fluxai.git
cd fluxai
```

### 2. Backend Setup

```bash
cd FluxAI-backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
# Edit .env with your database credentials

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Seed the database (optional)
npm run prisma:seed

# Start development server
npm run dev
```

Backend runs at `http://localhost:5001`

### 3. Frontend Setup

```bash
cd FluxAI-frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local
# Edit with API base URL

# Start development server
npm run dev
```

Frontend runs at `http://localhost:3000`

### 4. Worker Setup (Optional)

```bash
cd FluxAI-backend

# Start background worker (requires Redis)
npm run worker
```

---

## Environment Variables

### Backend (`FluxAI-backend/.env`)

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/fluxai"

# Authentication
JWT_SECRET="your-256-bit-secret"

# Server
PORT=5001
CORS_ORIGIN="http://localhost:3000"

# Redis (for background jobs)
REDIS_URL="redis://localhost:6379"

# S3 Storage (optional - for file uploads)
S3_BUCKET_NAME="fluxai-uploads"
S3_REGION="us-east-1"
S3_ENDPOINT="http://localhost:9000"  # For MinIO
AWS_ACCESS_KEY_ID="minioadmin"
AWS_SECRET_ACCESS_KEY="minioadmin"
```

### Frontend (`FluxAI-frontend/.env.local`)

```bash
NEXT_PUBLIC_API_URL="http://localhost:5001/api"
```

---

## Development Principles

### Domain-Based Modules

Each feature is encapsulated in its own module under `src/modules/`:

```
modules/assessments/
├── assessments.types.ts      # Zod schemas + interfaces
├── assessments.service.ts    # Business logic
├── assessments.controller.ts # Request handlers
└── assessments.routes.ts     # Route definitions
```

### Thin Controllers

Controllers only handle:
- Request parsing
- Input validation
- Calling services
- Formatting responses

All business logic lives in services.

### Service-Driven Logic

Services are the single source of truth for:
- Database operations
- Business rules
- Error handling
- Cross-module coordination

### Stateless APIs

- No server-side sessions
- JWT tokens carry all necessary claims
- Every request is independently authenticated

### Guardrails-First Philosophy

- Zod schemas validate all inputs at the boundary
- Database constraints enforce data integrity
- Middleware enforces auth and authorization
- Error handling never exposes internals

---

## Available Scripts

### Backend

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm run start` | Run production build |
| `npm run worker` | Start background job worker |
| `npm run prisma:generate` | Regenerate Prisma client |
| `npm run prisma:migrate` | Run database migrations |
| `npm run prisma:studio` | Open Prisma Studio (DB browser) |
| `npm run prisma:seed` | Seed database with sample data |

### Frontend

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Create production build |
| `npm run start` | Serve production build |
| `npm run lint` | Run ESLint |

---

## Roadmap

### Near-Term
- [ ] DSA code execution sandbox integration
- [ ] AI interview scoring (LLM integration)
- [ ] Email delivery (SendGrid/SES)
- [ ] Candidate invite flow

### Mid-Term
- [ ] Payments & subscription billing
- [ ] Team collaboration features
- [ ] Custom branding / white-label
- [ ] Candidate experience improvements

### Long-Term
- [ ] ATS integrations (Greenhouse, Lever)
- [ ] Resume parsing & screening
- [ ] Analytics & reporting dashboard
- [ ] API for third-party integrations

---

## Contributing

1. Create a feature branch from `main`
2. Follow the existing module structure
3. Add Zod schemas for all new inputs
4. Write services before controllers
5. Test locally before pushing
6. Open a PR with clear description

---

## License

Proprietary — All rights reserved.

---

*Built for engineering teams that care about hiring quality.*
