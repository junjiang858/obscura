# DEPLOYMENT

## Document Status

- Project charter confirmed: Yes, `docs/project/PROJECT_CHARTER.md`.
- Tech stack confirmed: Yes, `docs/architecture/TECH_STACK.md`.
- User approved writing this document: Yes, selected accelerated path B in chat on 2026-06-22.
- Last reviewed: 2026-06-22.

## Deployment Summary

The first MVP is a static client-side web app built with React + Vite. It has no backend server, no database, no server-side media upload endpoint, and no runtime secrets in v1.

Deployment must support static assets for the app, ffmpeg.wasm assets, background-removal model/runtime assets, and any cross-origin isolation headers required by the selected WASM path.

## Environments

| Environment | Purpose | URL or command | Notes |
| --- | --- | --- | --- |
| Local | Development and browser verification | `pnpm dev` after scaffolding | Starts Vite dev server for `apps/web`. |
| Test | Local automated checks | `pnpm check` and later `pnpm test:e2e` | Uses tiny fixture media only. |
| Staging | Preview deploy for browser/device checks | Vercel preview or equivalent static preview | Requires approval before external preview deploy. |
| Production | Public static web app | Vercel production or equivalent static host | Requires explicit production deploy confirmation. |

## Environment Variables

No runtime secrets are required in v1.

| Name | Required | Scope | Notes |
| --- | --- | --- | --- |
| None | No | v1 | The app should run without API keys or server credentials. |

Future public build-time flags, model asset base paths, analytics keys, cloud endpoints, or API URLs require source-of-truth updates before implementation.

## Static Assets

- App assets are produced by the Vite build.
- ffmpeg.wasm core/worker assets must be served from a reliable path documented during implementation.
- Background-removal model/runtime assets must be served as application assets or documented external model assets.
- User media is not a deployment asset and must not be uploaded as part of deployment.
- Test fixture media must remain tiny, non-private, and license-safe.

## Headers And Browser Requirements

- If ffmpeg.wasm or related processing requires `SharedArrayBuffer` or multi-threaded WASM, deployment must set cross-origin isolation headers:
  - `Cross-Origin-Opener-Policy: same-origin`
  - `Cross-Origin-Embedder-Policy: require-corp`
- Asset sources must be compatible with COOP/COEP. Cross-origin model/WASM assets may need CORS/CORP-compatible hosting.
- If a selected library works without SharedArrayBuffer in a slower mode, the deployment doc must note the mode and performance tradeoff before release.
- Target browser support for first implementation should prioritize Chromium-based browsers unless a later doc update broadens support.

## Deployment Flow

1. Confirm source-of-truth documents are up to date.
2. Run `pnpm check` once scripts exist.
3. Run `pnpm test:e2e` once browser workflows exist.
4. Build the app with `pnpm build`.
5. Verify static asset paths for WASM/model files.
6. Verify COOP/COEP headers when required.
7. Run browser smoke checks on the target deploy:
   - app loads,
   - upload fixture media works,
   - image preview/edit/export smoke works,
   - video preview/export smoke works where feasible,
   - no user media upload path appears in network inspection.
8. For production, request explicit confirmation before deploying or promoting.

## Health Checks

- App health: Static app loads at `/`, workspace renders, and no fatal console errors appear on first load.
- API health: Not applicable in v1 because no backend API exists.
- Database connectivity: Not applicable in v1 because no database exists.
- Media health:
  - Image fixture can be imported and previewed.
  - Video fixture can be imported and previewed.
  - ffmpeg/background-removal engine loading shows a visible status and does not freeze the UI.
- Privacy health:
  - Upload/edit/export flows do not send user media to a backend or third-party API.

## Logs And Observability

- Local/browser logs may include non-sensitive job state and error codes.
- Logs must not include raw media, file contents, subtitles, local paths, full object URLs, tokens, secrets, or private user metadata.
- No production analytics in v1 unless source-of-truth docs are updated first.
- Browser error reporting services are deferred because they may collect sensitive context; any introduction requires tool/deployment/privacy review.

## Rollback

- Rollback trigger:
  - App fails to load.
  - Static assets for WASM/model files are unavailable.
  - COOP/COEP headers break media processing.
  - A release introduces media upload or unsafe persistence.
  - Critical edit/export flows fail on target browsers.
- Rollback command or procedure:
  - Before Git is initialized: no deployment rollback exists; do not production deploy.
  - After Git and static hosting are configured: redeploy or promote the previous known-good static deployment.
  - For Vercel: use dashboard/CLI to roll back or promote the previous deployment after explicit confirmation.
- Data rollback note:
  - No server data exists in v1.
  - Local browser session data is user-local and cannot be centrally rolled back.

## Pre-Launch Checklist

- [ ] All source-of-truth docs are current.
- [ ] `pnpm check` or equivalent passes.
- [ ] Build passes.
- [ ] Browser smoke tests pass for upload, preview, edit, and export.
- [ ] Required env vars are documented; v1 should have no secrets.
- [ ] Secrets are not committed.
- [ ] Static WASM/model asset paths are verified.
- [ ] COOP/COEP headers are configured and verified if required.
- [ ] Dependency and license review is complete, especially `@imgly/background-removal`.
- [ ] Privacy check confirms user media is not uploaded.
- [ ] Health checks pass.
- [ ] Rollback path is documented and tested for preview/staging before production.

## Change Rule

- Update this document before changing local run commands, build scripts, deployment host, environment variables, static asset strategy, headers, logging, rollback, production release process, or cloud/analytics behavior.
- Any production deploy or rollback requires explicit confirmation.
