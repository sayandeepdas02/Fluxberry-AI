# FluxAI Backend

Production-grade backend API for FluxAI technical hiring assessment platform.

## Tech Stack

- **Runtime:** Node.js 20+ with TypeScript
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **Auth:** JWT-based authentication
- **Validation:** Zod schema validation

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env with MONGODB_URI and JWT_SECRET

# 3. Start MongoDB (if not running)
docker run -d -p 27017:27017 --name mongodb mongo:7

# 4. Seed question bank (optional)
npm run seed

# 5. Start development server
npm run dev
# Server runs at http://localhost:5001
```

---

## API Endpoints

### Health
```http
GET /api/health
```

### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/signup` | Public | Register + create org |
| POST | `/api/auth/login` | Public | Login |
| GET | `/api/auth/me` | Bearer | Current user |

### Onboarding
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/onboarding/complete` | Bearer | Complete onboarding + update org |

### Organization
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/organization` | Bearer | Get org |
| PATCH | `/api/organization` | Bearer | Update org |
| GET | `/api/organization/members` | Bearer | List members |

### Assessments
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/assessments` | Bearer | Create assessment |
| GET | `/api/assessments` | Bearer | List assessments |
| GET | `/api/assessments/:id` | Bearer | Get assessment |
| PATCH | `/api/assessments/:id` | Bearer | Update metadata |
| PUT | `/api/assessments/:id/rounds` | Bearer | Configure rounds |
| POST | `/api/assessments/:id/publish` | Bearer | Publish assessment |

### Questions (Read-Only)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/questions` | Bearer | List with filters |
| GET | `/api/questions/:id` | Bearer | Get question |

**Query Parameters for `/api/questions`:**
- `type`: `MCQ` | `DSA`
- `difficulty`: `EASY` | `MEDIUM` | `HARD`
- `topic`: string
- `limit`: number (1-100, default 50)
- `offset`: number (default 0)

---

## Project Structure

```
FluxAI-backend/
├── src/
│   ├── app.ts
│   ├── server.ts
│   ├── database/
│   │   ├── mongodb.ts         # MongoDB connection
│   │   └── models/
│   │       └── index.ts       # Mongoose models
│   ├── common/
│   │   ├── guards/
│   │   ├── middleware/
│   │   └── utils/
│   ├── modules/
│   │   ├── auth/
│   │   ├── onboarding/        # NEW: User onboarding
│   │   ├── organizations/
│   │   ├── assessments/
│   │   ├── questions/
│   │   ├── attempts/
│   │   ├── results/
│   │   ├── proctoring/
│   │   ├── evaluation/
│   │   └── files/
│   └── jobs/
│       ├── queues/
│       └── processors/
└── package.json
```

---

## Scripts

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Run production build
npm run seed         # Seed question bank
```

---

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | JWT signing secret | Yes |
| `PORT` | Server port | No (5001) |
| `CORS_ORIGIN` | Frontend origin | No (localhost:3000) |

---

## Database Models

| Model | Description |
|-------|-------------|
| `User` | User accounts with `onboardingCompleted` flag |
| `Organization` | Workspaces/companies |
| `OrganizationMember` | User-org membership with roles |
| `Assessment` | Hiring assessments (embedded rounds) |
| `Question` | Question bank (MCQ/DSA) |
| `Candidate` | Assessment takers |
| `AssessmentAttempt` | Attempt records (embedded round attempts) |
| `ProctoringEvent` | Integrity signals |
| `Evaluation` | Grading results |
| `FileAsset` | Resume/video uploads |

---

Built for FluxAI • MongoDB + Mongoose
