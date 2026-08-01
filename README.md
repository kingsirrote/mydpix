# MyDpix AI

AI-powered meme generation and discovery platform. Describe any situation — "my salary disappeared after paying rent" — and MyDpix generates multiple authentic, shareable memes built on internet humor, reaction culture, and Nigerian internet culture. Users can also search, download, collect, and share existing memes from a growing public library.

## Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 14 (App Router) + TypeScript | Server components for fast, SEO-friendly pages; route handlers double as the API layer |
| Database & Auth | Supabase (Postgres + GoTrue + Storage) | Row-Level Security keeps data access rules in the database itself; built-in OAuth |
| AI image generation | OpenAI (`gpt-image-1`) | High-quality, fast, has a paired moderation endpoint |
| Payments | Stripe (Checkout + Billing Portal + Webhooks) | Standard, well-documented subscription billing |
| Rate limiting | Upstash Redis + `@upstash/ratelimit` | Serverless-friendly sliding-window limiter |
| Image processing | `sharp` | Watermarking, thumbnailing, format conversion |
| Styling | Tailwind CSS | Fast iteration, consistent design tokens |
| Charts | Recharts | Admin analytics |

## Project structure

```
src/
  app/                    Routes (App Router) — pages + API route handlers
    (auth)/               Login, signup, forgot-password
    admin/                Admin dashboard (role-gated)
    dashboard/            User dashboard, collections, settings
    generate/             AI meme generator
    library/              Public meme library + search + detail pages
    api/                  All backend route handlers
  components/             Shared React components (server + client)
  lib/
    ai/                   Prompt engine, OpenAI wrapper, moderation
    supabase/             Browser / server / middleware Supabase clients
    watermark.ts           sharp-based watermarking + thumbnailing
    rateLimit.ts            Upstash rate limiters
    stripe.ts               Stripe client + plan config
  types/database.ts        Hand-authored types matching the SQL schema
supabase/
  migrations/              SQL migrations (schema, RLS, counters, storage)
  functions/                Edge Functions (trending score cron)
```

## Getting started

### 1. Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project
- An [OpenAI](https://platform.openai.com) API key with image generation access
- A [Stripe](https://stripe.com) account (test mode is fine for development)
- An [Upstash](https://upstash.com) Redis database (free tier is enough to start)

### 2. Install

```bash
npm install
cp .env.example .env.local
# fill in .env.local with the keys from the services above
```

### 3. Set up the database

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npm run db:migrate      # applies supabase/migrations/*.sql
npm run db:types        # regenerates src/types/database.ts from the live schema
```

Then, in the Supabase dashboard:
- **Auth > Providers**: enable Email, Google, and GitHub, and set the redirect URL to `<your-app-url>/api/auth/callback`.
- **Auth > Email Templates**: customize if desired.
- Confirm the `memes` storage bucket exists (created by `0003_storage.sql`) and is public.

### 4. Set up Stripe

1. Create two recurring Prices (monthly + yearly) for the Premium plan and put their IDs in `.env.local`.
2. Create a webhook endpoint pointing to `<your-app-url>/api/stripe/webhook`, subscribed to:
   `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`.
3. Copy the webhook signing secret into `STRIPE_WEBHOOK_SECRET`.

### 5. Run locally

```bash
npm run dev
```

Visit `http://localhost:3000`.

### 6. Promote your first admin

New users get the `user` role by default. Promote yourself via the Supabase SQL editor:

```sql
update public.profiles set role = 'admin' where username = 'your_username';
```

## Testing

```bash
npm run test        # unit tests (vitest)
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
```

## Deployment

See [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md).

## API reference

See [`docs/API.md`](./docs/API.md).

## Security notes

- All privileged database writes (profile role changes, moderation, counters) go through `createServiceClient()`, which uses the Supabase **service role key** and is only ever called from server-side route handlers — never shipped to the client.
- Row-Level Security is enabled on every table; the anon/browser client can only do what its policies allow, independent of anything the API layer does.
- The Stripe webhook route is excluded from the auth middleware matcher (raw body needed for signature verification) and independently verifies the signature before processing any event.
- Prompts are run through OpenAI's moderation endpoint before spending a generation call on them.
- Generation is protected by both a per-minute burst rate limiter (Upstash) and a per-plan daily quota (stored on the profile).

## License

Proprietary — all rights reserved.
