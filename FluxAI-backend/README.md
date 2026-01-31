# FluxAI Backend

Production-grade backend API for FluxAI technical hiring assessment platform.

## Tech Stack

- **Runtime:** Node.js 20+ with TypeScript
- **Framework:** Express.js
- **Database:** PostgreSQL with Prisma ORM
- **Auth:** JWT-based authentication
- **Validation:** Zod schema validation

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env with DATABASE_URL and JWT_SECRET

# 3. Generate Prisma client
npm run prisma:generate

# 4. Run database migration
npx prisma migrate dev --name init

# 5. Seed question bank
npm run prisma:seed

# 6. Start development server
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

## Round Configuration Rules (Strict 422)

| Round | Requirement |
|-------|-------------|
| **MCQ** | Exactly 20 single-correct + 10 multi-correct |
| **DSA** | Exactly 4 questions |
| **AI** | Exactly 1 agent |

### Publish Rules
- Status must be `DRAFT`
- At least one round enabled
- All enabled rounds must be valid

---

## Project Structure

```
FluxAI-backend/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── app.ts
│   ├── server.ts
│   ├── database/
│   │   └── prisma.ts
│   ├── common/
│   │   ├── guards/
│   │   ├── middleware/
│   │   ├── dto/
│   │   └── utils/
│   └── modules/
│       ├── auth/
│       ├── organizations/
│       ├── assessments/
│       ├── questions/
│       └── rounds/
└── package.json
```

---

## Scripts

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Run production build
npm run prisma:seed  # Seed question bank
npm run prisma:studio # Open Prisma Studio
```

---

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection | Yes |
| `JWT_SECRET` | JWT signing secret | Yes |
| `PORT` | Server port | No (5001) |
| `CORS_ORIGIN` | Frontend origin | No (localhost:3000) |

---

## Seed Data

The seed script creates:
- **32 MCQ questions** (20 single-correct, 12 multi-correct)
- **6 DSA questions** (Two Sum, Reverse Linked List, Valid Parentheses, Maximum Subarray, Merge Two Sorted Lists, LRU Cache)

---

Built for FluxAI • Phase 1 + Phase 2
