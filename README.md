# 3dify website

The standalone website for testing photo-to-3D generation. It uses the existing backend’s user/admin authentication and direct API generation, independently of Shopify.

## Run locally

1. Start Docker Desktop and the backend using the **3dify Local** run configuration (or `./gradlew bootRun --args='--spring.profiles.active=local --spring.config.additional-location=file:./config/application-local.properties'`). Restart the backend after pulling the generation-options endpoint.
2. In this repository, run `npm ci` then `npm run dev`.
3. Open http://localhost:3000, register or sign in, click **Activate free plan** if needed, choose photos, then click **Generate 3D model**.
4. Follow the task on the generation page or under **Job history**. Download available GLB/USDZ outputs when complete.

No Shopify tunnel, origin configuration, or Shopify billing is needed. The free website plan activates through the backend without Stripe. Actual generations still consume credits from the backend’s selected generation provider. The website does not retry generation submissions automatically.

## Configuration

Set server-side `BACKEND_URL` to override http://localhost:8080. See `.env.example`. The Next.js route handler proxies requests through `/api/backend`; credentials are never added to public environment variables. It limits each request body to 85 MiB, including multipart framing, and applies a four-minute timeout to uploads and upstream requests. Photo count comes from `/dashboard/generation-options` rather than hard-coded provider limits.

The existing localStorage login key (`omni3d_auth`) is preserved. JWT expiry is checked on load; expired backend sessions return to sign-in. Website generation creates an API key for the signed-in account as needed and keeps its raw value in tab-scoped sessionStorage. Sign-out clears it; the key can be revoked on the API keys page. Accounts and existing jobs are retained. Admin accounts see the Admin plan editor; the backend also enforces the role.

If the generation response is lost, the website blocks another submission until you explicitly check history and acknowledge that a new submission is needed. Pending/accepted submission state survives refresh within the tab. The direct backend endpoint has no idempotency key, so never automatically retry a generation POST.

## Checks

`npm run check` runs TypeScript validation. `npm run build` builds the production application. `npm run test:browser` runs the mocked browser regression suite, covering upload/submission/polling/downloads, ambiguous submissions, roles, and account management without spending provider credits. It is not a live provider end-to-end test.

Read [the current handover](docs/HANDOFF.md) for architecture, visual direction, API contracts and verification limits.
