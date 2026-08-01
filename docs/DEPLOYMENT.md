# Deployment Guide

MyDpix AI is a standard Next.js 14 app with a Supabase backend, so it deploys cleanly to either a managed platform (Vercel) or your own infrastructure (Docker).

## Option A — Vercel (recommended for fastest path to production)

1. Push this repository to GitHub.
2. Import it in Vercel as a new project.
3. Add every variable from `.env.example` under **Settings > Environment Variables** (Production + Preview).
4. Set the build command to `next build` (default) — `output: "standalone"` in `next.config.mjs` is harmless on Vercel; it's used for the Docker path below.
5. After the first deploy, update:
   - `NEXT_PUBLIC_APP_URL` to your real domain
   - The Stripe webhook endpoint URL to `https://<your-domain>/api/stripe/webhook`
   - The Supabase Auth redirect URL to `https://<your-domain>/api/auth/callback`
6. Re-deploy so the updated env vars take effect.

## Option B — Docker (self-hosted / any container platform)

```bash
docker build -t mydpix-ai .
docker run -p 3000:3000 --env-file .env.local mydpix-ai
```

Or with Compose:

```bash
docker compose up --build
```

The image uses Next's `standalone` output, so the final runtime image only contains what's needed to run `node server.js` — no dev dependencies, no source maps by default.

Deploy the resulting image to any container platform (Fly.io, Railway, ECS, Cloud Run, a bare VM behind Nginx/Caddy — anything that can run a container and expose port 3000).

## Database (Supabase)

Supabase is treated as a managed service in both deployment paths above.

```bash
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push       # applies supabase/migrations/*.sql in order
```

Then deploy the trending-score cron function:

```bash
npx supabase functions deploy refresh-trending
npx supabase functions schedule create refresh-trending --cron "*/15 * * * *"
```

## CDN / images

`next/image` is configured (`next.config.mjs`) to allow `*.supabase.co` and the OpenAI image host. If you move image storage to a dedicated CDN (Cloudflare, CloudFront) later, add its hostname to `images.remotePatterns` and update the upload logic in `src/app/api/generate/route.ts` accordingly.

## Post-deploy checklist

- [ ] Env vars set in the hosting platform (not just `.env.local`)
- [ ] Supabase migrations applied (`supabase db push`)
- [ ] Supabase Auth redirect URLs point at the production domain
- [ ] Stripe webhook endpoint + secret point at the production domain
- [ ] `refresh-trending` Edge Function deployed and scheduled
- [ ] First admin user promoted (`update profiles set role = 'admin' where ...`)
- [ ] CI green on `main` (`.github/workflows/ci.yml`)
