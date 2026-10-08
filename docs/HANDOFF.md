# Website handover — 2026-10-07

The old dashboard had keys/history/webhooks/plans but no generation form. It is now a standalone website for the user to test photo-to-3D generation independently of Shopify, with a complete visual redesign.

## Related repositories

- Backend: `/Users/shaboo/Documents/3dify` → `git@github.com:Shaboo/3dify.git`.
- Standalone website: `/Users/shaboo/Documents/3dify-fe` → `git@github.com:Shaboo/3dify-fe.git`.
- Shopify app: `/Users/shaboo/Documents/3dify-shopify` → `git@github.com:Shaboo/3dify-shopify.git`.

All use branch `main`. These handovers are persistent repository context, not automatic model memory. Read the other repos’ current handovers when changing contracts across projects.

## Design and implementation

Design direction: **The Photographic Contact-Sheet Archive**. Lilac grounds, plum framing, bright yellow actions, and self-hosted Archivo replace the previous Swiss blue/white system across public, authentication, generation, account, plans, admin, and documentation screens. A labeled illustrative chair study with a contact-detail inset anchors the landing; quiet panels and a responsive plum sidebar carry the same palette into working screens. Root `DESIGN.md` records the shipped CSS tokens; `.impeccable/design.json` carries component previews and extensions. Do not invent telemetry, metrics, plan features, or successful generation examples.

Next.js 16.4.0 / React 19 with pinned lockfile; obsolete Tailwind and unused component dependencies removed. Read `AGENTS.md` and version-matched Next docs in `node_modules/next/dist/docs` before code changes. Docker uses Node 24 and `npm ci`. `.env.example` contains only the server-side backend URL.

JWT user/admin roles are retained. Session key `omni3d_auth` remains compatible; JWT expiry is checked on load and JWT 401 responses clear the session. Admin navigation/editor is restricted in the UI; backend enforces ADMIN independently. Do not make new users administrators.

## Generation flow and contracts

1. Register/sign in and activate the existing free plan if needed. Backend free activation requires no Stripe/card or Shopify billing.
2. GET `/dashboard/generation-options` with JWT reports selected provider and photo count limits. Never hard-code a global four-photo limit.
3. Website creates an API key for the user’s subscription as needed and stores its raw value only in tab-scoped sessionStorage (`3dify:website-key`), cleared on sign-out. Existing keys are manageable/revocable on the keys page.
4. POST `/api/v1/generate` with `X-API-KEY` and repeated multipart `images`; original JPG/PNG/WebP files are uploaded without resizing. No JWT is substituted for the API key.
5. Poll `/dashboard/jobs` with JWT; view status/history and available GLB/USDZ downloads. Show backend failure details directly. No fake progress percentage or output preview is claimed.

Submission state survives refresh in the tab. A lost/5xx response may mean the backend accepted the request: block another POST until the user checks history and explicitly acknowledges a new submission. Never auto-retry generation. Direct backend generation has no HTTP idempotency guarantee. The free website plan does not remove actual provider credit costs.

Keys, webhooks, public plans, subscription status/checkout/portal and admin plan create/edit/deactivate use existing backend contracts. Catalog figures are actual backend plan values; the UI does not invent usage counters or special plan features. Backend defaults: 20 MB/photo, 85 MB total upload; provider counts differ.

## Run and check

```sh
npm ci
npm run dev
```

Open http://localhost:3000. Backend must run on localhost:8080 using **3dify Local** (see backend handover). Server-only `BACKEND_URL` overrides that address. `/api/backend/[...path]` proxies account/API headers and multipart bodies with a four-minute upstream timeout; no tunnel or browser CORS setup is needed.

```sh
npm run check
npm run build
npm run test:browser
```

Validated: TypeScript, production build, **26 desktop/mobile browser and proxy checks**, zero npm production vulnerabilities. Proxy tests send a >10 MB multipart request only to an isolated fixture, assert fixture identity before POST, and refuse existing server reuse. Browser coverage includes registration, free activation, 1/4-photo submission, polling/downloads, backend errors, uncertain submission/reload, admin denial/editing, keys and webhooks. No paid Meshy generation was submitted by the agent; live provider success is still for the user to verify.

Website and backend were started for user testing. Home and real public-plan proxy returned 200; backend health UP. Check ports before starting duplicates. Source was prepared in `/private/tmp/3dify-fe-redesign` and installed with filesystem approval; replaced files backed up in `/private/tmp/3dify-fe-backup-20261007-223910`. Runtime/cache/env files are ignored; no credentials were replaced.

Next: user submits a real task and checks provider outcome through the website. Inspect task ID and backend logs if it fails. The two existing Shopify jobs are not proof of a completed standalone website generation. No deployment was requested.

## Redesign record — 2026-10-07

The photographic direction preserves the 3dify name and existing functionality. `public/images/contact-chair.webp` is generated illustrative artwork, reused on landing and authentication; its exact prompt and creation timestamp are recorded in `public/images/contact-chair.webp.json`, with the source raster in `.impeccable/contact-chair-source.png`. It is not evidence of a successful provider generation. Archivo is served locally from `public/fonts/archivo-variable.ttf`; its OFL license is retained in `public/fonts/OFL.txt`. The landing detail toggle changes the artwork crop and exposes its pressed state.

The initial finish review inspected 26 supplied desktop/mobile renders and returned **Fix**. The implementation now contains the requested documentation overflow constraint, active mobile navigation visibility and scroll hint, discoverable administration table scrolling, and two copy repairs. Updated captures resolved all five listed findings; `.impeccable/review/verdict.md` returns **Ship for the reviewed visual redesign scope**. This was a targeted recheck of the listed fixes, not a new whole-review pass. Final inspection reports zero document overflow across all 26 desktop/mobile captures, and the production build plus all 26 browser/proxy checks passed. Review evidence and limitations are retained in `.impeccable/review/finish-review.md` and `.impeccable/review/verdict.md`. Backend contracts and the live-provider verification limitations above remain unchanged.
