# Vivid AI

Realtime AI Character web application.

## Stack
- Next.js 15 + TypeScript
- FastAPI + Python 3.12
- Supabase Auth / Postgres / Storage
- Redis
- OpenAI Realtime/WebRTC abstraction
- Docker
- CircleCI
- Railway deployment

## Structure
- `apps/web` — Next.js client
- `apps/api` — FastAPI backend
- `supabase/migrations` — database migrations
- `.circleci/config.yml` — CI/CD

## Local development

Copy `.env.example` to `.env` and provide credentials. Then run:

```bash
docker compose up --build
```

Web: http://localhost:3000
API: http://localhost:8000
API health: http://localhost:8000/health
