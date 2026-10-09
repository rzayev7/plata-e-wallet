# Plata — Web

The customer-facing web app for the Plata wallet. Next.js talks to the Spring
Boot API; the browser never does.

## Running it

The backend must be up first (Postgres on 5432, Spring on 8080).

```bash
npm install
cp .env.example .env.local   # PLATA_API_URL, defaults to http://localhost:8080
npm run dev                  # http://localhost:3000
```

From the repository root, `npm --prefix frontend run dev` does the same.

## Stack

| Concern | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript, strict |
| Styling | Tailwind CSS v4 |
| Components | shadcn/ui (`base-nova` style, built on Base UI) |
| Server state | TanStack Query |
| Forms | React Hook Form + Zod |

## How authentication works

The browser never holds a token. Next.js acts as a BFF:

```
browser ──cookies──> Next route handlers ──Bearer token──> Spring (:8080)
```

* `POST /api/auth/login` and `/api/auth/register` call Spring, then put the
  token pair into **httpOnly, SameSite=Lax** cookies (`plata_at`, `plata_rt`).
  Tokens never appear in a response body, so no script on the page can read
  them — `document.cookie` is empty.
* `app/api/[...path]/route.ts` proxies every other call, attaching the
  `Authorization` header on the way out. `/api/accounts` maps to Spring's
  `/accounts`.
* On a `401` it spends the refresh token once, retries, and writes the rotated
  pair back as cookies — invisible to the UI.
* Because Spring's refresh tokens are **single-use** (`RefreshTokenService.consume`
  revokes before reissuing), concurrent 401s share one in-flight refresh
  (`lib/server/backend.ts`). Without that, parallel requests would burn the
  token and sign the customer out. The dedupe is per-process; behind more than
  one Next instance it needs to move to shared storage.
* This also means **no CORS configuration is needed** on the backend: every
  request the browser makes is same-origin.

## Money

The backend is inconsistent about representation:

| Endpoint | `balance` / `amount` |
| --- | --- |
| `GET /accounts` | major-unit **string** — `"5.00"` |
| deposit / withdraw / transfer | minor-unit **number** — `500` |

`hooks/use-accounts.ts` normalises everything to **minor units** at the edge, so
no component has to remember which is which. `lib/money.ts` parses amounts with
string arithmetic rather than `value * 100`, because `19.99 * 100` is
`1998.9999999999998` in binary floating point.

## Known backend gaps

The UI is shaped around these; they are the next things worth building.

1. **No transaction history.** `Transfer` rows are written but never read —
   `TransferRepository` has no query and no controller exposes one. `/activity`
   is a stub waiting on `GET /accounts/{id}/transactions`.
2. **No `GET /customers/me`.** The signed-in customer's name and email are
   reconstructed from the JWT subject plus the email typed at login, cached in
   the `plata_profile` cookie. A real profile endpoint should replace that.
3. **No recipient lookup.** Transfers address an account by raw UUID, so the
   send form asks the customer to paste one. A lookup by email or phone
   returning only `{ accountId, displayName }` would fix the worst UX in the app.
4. **`rawPassword` has no server-side constraint** — an empty password is
   accepted. `lib/validation.ts` is currently the only gate.
5. **One account per currency** (`uq_account_owner_currency`) surfaces as a
   generic `DataIntegrityViolationException` → "Request conflicts with existing
   data". The UI greys out currencies already held so it rarely fires, but a
   domain exception with a real message would be better.
6. Customer-facing error text leaks internals: insufficient funds answers
   "Account 5c52…58ca has insufficient funds: balance 1825, requested 999900" —
   raw minor units and an account UUID.

## Layout

```
app/
├── (auth)/           sign in, register — redirects away if already signed in
├── (app)/            everything behind the session guard
└── api/              the BFF: auth handlers + the catch-all proxy
components/plata/     app components
components/ui/        shadcn/ui primitives
hooks/                TanStack Query hooks
lib/server/           server-only: cookies, JWT decoding, proxy
lib/                  api client, money, validation
types/api.ts          mirrors of the Spring DTOs
```
