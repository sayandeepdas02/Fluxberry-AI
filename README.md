# Fluxberry AI - Technical Hiring Assessment Platform

Fluxberry AI is a comprehensive, AI-powered platform designed to streamline the technical hiring process. It combines automated workflows, intelligent scheduling, code execution environments, and deep analytics to help engineering teams hire faster and better.

## 🚀 Key Features

### 🤖 Automation & Intelligence
- **Workflow Automation Engine:** Create custom rules (e.g., "If score > 80, move to Interview") to automate candidate progression.
- **AI Interviewer:** Real-time AI-driven technical interviews powered by OpenAI.
- **Code Execution:** Secure, sandboxed code execution for DSA assessments using Judge0.

### 📧 Communication & Scheduling
- **Advanced Email Engine:** Customizable email templates with built-in open tracking and variable injection.
- **Smart Scheduling:** Seamless integration with Google Calendar for checking interviewer availability and booking slots.
- **Automated Notifications:** Event-driven email triggers for stage changes, interview invites, and assessments.

### 📊 Management & Insights
- **Pipeline Management:** Customizable Kanban-style hiring pipelines with drag-and-drop stage management.
- **Analytics Dashboard:** Visual insights into hiring metrics, conversion rates, and time-to-hire.
- **Scorecards:** Structured feedback forms for consistent candidate evaluation.
- **Audit Logs:** Comprehensive activity tracking for security and compliance (GDPR ready).

### 🛡️ Security & Performance
- **Role-Based Access Control (RBAC):** Granular permissions for admins, recruiters, and interviewers.
- **Rate Limiting:** Protection against abuse on API and Auth endpoints.
- **Data Retention:** Automated policies for cleaning up old logs and data.

## 🛠️ Tech Stack

### Backend (`FluxAI-backend`)
- **Runtime:** Node.js, Express.js
- **Language:** TypeScript
- **Database:** MongoDB (Mongoose ORM)
- **Caching & Queues:** Redis, BullMQ
- **Email:** Resend
- **Validation:** Zod, Express-Validator
- **Logs:** Winston (Structured Logging)

### Frontend (`FluxAI-frontend`)
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript, React 19
- **Styling:** Tailwind CSS v4, Radix UI
- **Icons:** Lucide React
- **Charts:** Recharts

## 📂 Repository Structure

```
FluxAI/
├── FluxAI-backend/         # Express API Server
│   ├── src/
│   │   ├── common/         # Shared utilities, middleware, guards
│   │   ├── config/         # Environment and app configuration
│   │   ├── database/       # Mongoose models and connection logic
│   │   ├── jobs/           # BullMQ processors and cron jobs
│   │   ├── modules/        # Feature-based architecture (Auth, User, Workflow, etc.)
│   │   └── server.ts       # Entry point
│   ├── .env.example        # Backend environment variables template
│   └── package.json
│
├── FluxAI-frontend/        # Next.js Client Application
│   ├── src/
│   │   ├── app/            # App Router pages and layouts
│   │   ├── components/     # Reusable UI components
│   │   ├── features/       # Feature-specific components and logic
│   │   ├── lib/            # API clients and utilities
│   │   └── hooks/          # Custom React hooks
│   ├── .env.local          # Frontend environment variables
│   └── package.json
│
└── README.md               # Project Documentation
```

## ⚡ Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB (Local or Atlas)
- Redis (Local or Cloud)
- npm or yarn

### 1. Backend Setup

Navigate to the backend directory:
```bash
cd FluxAI-backend
```

Install dependencies:
```bash
npm install
```

Configure environment variables:
```bash
cp .env.example .env
```
*Edit `.env` with your MongoDB URI, Redis URL, Resend API Key, and OpenAI Key.*

Run the development server:
```bash
npm run dev
```

Start the background worker (for emails & workflows):
```bash
npm run worker
```

### 2. Frontend Setup

Navigate to the frontend directory:
```bash
cd ../FluxAI-frontend
```

Install dependencies:
```bash
npm install
```

Configure environment variables:
Create a `.env.local` file:
```bash
NEXT_PUBLIC_API_URL=http://localhost:5001/api
```

Run the development server:
```bash
npm run dev
```

Visit `http://localhost:3000` to access the application.

## 🔧 Configuration

### Backend Environment Variables (`FluxAI-backend/.env`)

| Variable | Description | Default/Example |
|----------|-------------|-----------------|
| `PORT` | API Server Port | `5001` |
| `MONGODB_URI` | MongoDB Connection String | `mongodb://localhost:27017/fluxberry-ai` |
| `JWT_SECRET` | Secret for signing tokens | *SecureString* |
| `CORS_ORIGIN` | Allowed Frontend Origin | `http://localhost:3000` |
| `REDIS_URL` | Redis Connection String | `redis://localhost:6379` |
| `RESEND_API_KEY` | API Key for Email Service | *re_123...* |
| `OPENAI_API_KEY` | OpenAI Key for AI Interviews | *sk-...* |
| `JUDGE0_BASE_URL` | Judge0 URL for Code Exec | `http://localhost:2358` |

### Frontend Environment Variables (`FluxAI-frontend/.env.local`)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | URL of the backend API (e.g., `http://localhost:5001/api`) |

## 🧪 Testing

The backend includes a suite of tests using Jest.

Run unit tests:
```bash
cd FluxAI-backend
npm run test
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
