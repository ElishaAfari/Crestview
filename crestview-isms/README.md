# Crestview International School Management System

Crestview ISMS is a Supabase-native, Next.js App Router platform for school operations, academics, finance, HR, admissions, parent engagement, realtime notifications, and AI-assisted learning.

## Tech Stack

- Next.js 15 App Router, React 19, TypeScript strict mode
- Tailwind CSS 4 with shadcn-style local UI primitives
- Supabase Auth, Postgres, RLS, Storage, Realtime, and Edge Functions
- Zustand, React Hook Form, Zod, TanStack Table, Recharts, Framer Motion
- Firebase Cloud Messaging, Resend, Twilio, Cloudinary, OpenAI integration points

## Prerequisites

- Node.js 22+
- npm 11+
- Supabase CLI
- Docker, for local database and container checks

## Environment Setup

Copy `.env.local.example` to `.env.local` and fill in Supabase, OpenAI, Cloudinary, Firebase, payment, email, SMS, and app URL values.

Use `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in browser-safe code. Keep `SUPABASE_SECRET_KEY` server-only for trusted server actions, API routes, or Supabase Edge Functions. Never expose it in client components. Legacy anon and service-role keys remain optional fallbacks during migration.

## Supabase Setup

```bash
npm install -g supabase
supabase init
supabase start
supabase db push
supabase db seed
npm run db:types
```

The initial migration creates core identity, academic, admissions, finance, payroll, messaging, notification, audit, and AI analytics tables. RLS is enabled on all tables with role-aware policies.

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Seed credentials include:

- Email: `admin@crestview.edu`
- Password: `Admin@123`

## Production Build

```bash
npm run type-check
npm run build
npm start
```

## Deployment

Deploy to Vercel with the environment variables from `.env.production.example`. The included `vercel.json` pins build, install, dev commands, and the London region.

## Docker

```bash
docker compose -f docker/docker-compose.yml up --build
```

## Role System

Seeded roles are `super_admin`, `school_admin`, `teacher`, `student`, `parent`, `hr_staff`, `finance_officer`, `librarian`, and `it_support`. Permissions are assigned through `role_permissions`, and application navigation is role-aware via `src/config/navigation.ts`.

## AI Features

The AI tutor endpoint is available at `POST /api/ai/tutor`. It validates authentication, applies a Supabase-backed hourly rate limit, builds a student-aware system prompt, and streams OpenAI output when `OPENAI_API_KEY` is configured.

## Installable App

The project includes a web app manifest and app icons. Service-worker generation is intentionally disabled for the pilot until a dependency chain without critical advisories is selected.

## Testing

```bash
npm run test
npm run test:e2e
```

Unit tests cover validation and utilities. E2E smoke tests cover the public home and login page.

## Contributing

Keep changes typed, scoped, and aligned with Supabase RLS. All new forms should use React Hook Form with Zod validation. All server mutations must check authentication and write auditable state through Supabase.
