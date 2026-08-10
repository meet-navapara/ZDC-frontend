# ZDC Frontend (Next.js + Tailwind)

Marketing site + app shell for the ZDC AI Virtual Try-On Platform.

## Stack
- Next.js 14 (App Router) + React 18 + TypeScript
- TailwindCSS

## Getting started

```bash
cd frontend
cp .env.example .env.local   # set NEXT_PUBLIC_API_BASE_URL
npm install
npm run dev                  # http://localhost:3000
```

## Environment
- `NEXT_PUBLIC_API_BASE_URL` — base URL of the backend API.

## Deploy (Vercel)
Import the repo in Vercel and set the **Root Directory** to `frontend`.
Add the `NEXT_PUBLIC_API_BASE_URL` environment variable pointing to the Render backend URL.
Build command and output are auto-detected for Next.js.
