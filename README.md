# SkillLink — New Full-Stack Platform

New production-oriented foundation. This is not based on the old SkillLink code.

## Stack
- Frontend: React + Vite
- Backend: Node.js + Express
- Database/Auth: Supabase PostgreSQL + Supabase Auth
- Validation: Zod
- Security: Helmet, CORS, rate limiting

## Setup
1. Create the Supabase project.
2. Run `supabase/migrations/001_initial_schema.sql` in Supabase SQL Editor.
3. Copy `backend/.env.example` to `backend/.env`.
4. Add server-side Supabase credentials.
5. Add the publishable Supabase URL/key to `frontend/.env`.
6. Install dependencies in both frontend and backend.
7. Start backend, then frontend.

## Security
Never put `SUPABASE_SERVICE_ROLE_KEY` or a database password in frontend code or GitHub.
Never create demo credentials in the repository.
