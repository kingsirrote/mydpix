# API Reference

All routes live under `/api` and are implemented as Next.js Route Handlers (`src/app/api/**/route.ts`). Unless noted, request/response bodies are JSON.

## Auth

Session state comes from Supabase Auth cookies (set via `@supabase/ssr`). Routes that require a signed-in user call `supabase.auth.getUser()` and return `401` if there's no session.

---

### `POST /api/generate`

Generate one or more memes from a natural-language prompt.

**Auth:** required
**Rate limit:** 6 requests / minute (burst), plus a per-plan daily quota (Free: 6/day, Premium: 100/day)

**Body**
```json
{
  "prompt": "My salary disappeared after paying rent",
  "style": "office-meme",       // optional — auto-detected if omitted
  "aspectRatio": "1:1",          // "1:1" | "4:5" | "16:9" | "9:16"
  "variations": 4,               // 1–4
  "removeWatermark": false       // ignored unless the user is Premium
}
```

**Response `200`**
```json
{ "memes": [ { "id": "...", "image_url": "...", "thumbnail_url": "..." } ], "style": "office-meme", "remainingToday": 2 }
```

**Errors:** `401` not signed in · `422` failed moderation · `429` rate limited or daily quota reached · `502` provider failure after retries

---

### `GET /api/search?q=&category=&sort=&page=&perPage=`

Natural-language semantic-ish search over the public library (Postgres full-text search with a trigram fallback for very short/slangy queries).

**Auth:** not required
**Rate limit:** 30 requests / minute per IP

`sort`: `relevance` (default) · `trending` · `newest` · `most_liked`

---

### `GET /api/memes?category=&featured=&sort=&page=&perPage=`

Browse the public library without a search query.

---

### `GET /api/memes/:id`

Fetch a single meme and increment its view count.

### `POST /api/memes/:id`

Toggle a like on behalf of the signed-in user. **Auth:** required.

### `DELETE /api/memes/:id`

Delete a meme you own. **Auth:** required (must be the owner).

---

### `POST /api/download`

One-click optimized download.

**Body:** `{ "memeId": "uuid", "format": "png" | "jpg" }`
**Response:** binary image stream with `Content-Disposition: attachment`.

---

### `POST /api/collections` / `GET /api/collections`

Create or list the signed-in user's collections. **Auth:** required.

### `POST /api/collections/:id` / `DELETE /api/collections/:id`

Add or remove a meme from a collection. **Body:** `{ "memeId": "uuid" }`.

---

### `POST /api/paystack/checkout`

Creates a Paystack transaction for a subscription plan (tier1/tier2/tier3).

**Body:** `{ "plan": "tier1" | "tier2" | "tier3" }`
**Response:** `{ "url": "https://checkout.paystack.com/..." }` — redirect the browser here.

### `POST /api/paystack/topup`

Creates a one-time Paystack transaction for a coin top-up pack. Requires an active paid-tier subscription.

**Response:** `{ "url": "https://checkout.paystack.com/..." }`

### `POST /api/paystack/cancel`

Disables the signed-in user's active subscription and immediately drops them to the Free tier.

### `POST /api/paystack/webhook`

Paystack webhook receiver. Verifies the `x-paystack-signature` header (HMAC-SHA512) before processing. Handles `charge.success` (initial subscription charge or coin top-up), `subscription.create` (captures the subscription/email tokens needed to cancel later), `invoice.update` (renewal → refreshes monthly coins), `subscription.disable` / `subscription.not_renew`, and `invoice.payment_failed`.

---

## Admin routes (require `profiles.role = 'admin'`)

### `PATCH /api/admin/memes/:id`

Update moderation status, featured flag, or visibility.

**Body (all optional):**
```json
{ "moderation_status": "approved", "is_featured": true, "is_public": true, "moderation_notes": "..." }
```

### `DELETE /api/admin/memes/:id`

Hard-delete a meme.

### `GET /api/admin/settings`

List all site settings.

### `PUT /api/admin/settings`

Upsert a single site setting. **Body:** `{ "key": "free_daily_generation_limit", "value": 8 }`

---

## Error shape

Errors are returned as `{ "error": "human-readable message" }` with an appropriate HTTP status code. Validation errors (Zod) surface the first issue's message.
