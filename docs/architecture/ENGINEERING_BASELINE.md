# ENGINEERING_BASELINE

## Document Status

- Project charter confirmed: Yes, `docs/project/PROJECT_CHARTER.md`.
- Tech stack confirmed: Yes, `docs/architecture/TECH_STACK.md`.
- User approved writing this document: Yes, approved in chat on 2026-06-22.
- Last reviewed: 2026-06-22.

## Scope

This baseline defines the engineering rules for the first Product MVP: a local-first React + Vite web app for image and short-video editing. It is necessary before implementation, but not sufficient by itself. Before runnable product code begins, the project still needs the applicable source-of-truth documents for frontend plan, backend/API boundaries if any, database decision, AI workflow, tool policy, deployment, and root agent rules.

## Required Scripts

These scripts are the intended root `package.json` contract once scaffolding begins. Package names may be adjusted during scaffolding, but the script names and quality-gate meaning should remain stable.

| Script         | Command                                                                                                                                                           | Required now                        | Notes                                                             |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------- |
| `dev`          | `pnpm --filter @local-media-studio/web dev`                                                                                                                       | Yes, when app scaffold exists       | Starts the Vite dev server for the web app.                       |
| `build`        | `pnpm --filter @local-media-studio/web build`                                                                                                                     | Yes, when app scaffold exists       | Produces a production static build.                               |
| `typecheck`    | `pnpm --filter @local-media-studio/web typecheck && pnpm --filter @local-media-studio/shared typecheck && pnpm --filter @local-media-studio/media-core typecheck` | Yes, when packages exist            | TypeScript must pass for app and shared/media packages.           |
| `lint`         | `pnpm --filter @local-media-studio/web lint && pnpm --filter @local-media-studio/shared lint && pnpm --filter @local-media-studio/media-core lint`                | Yes, when packages exist            | ESLint must cover app, workers, and shared packages.              |
| `format:check` | `prettier . --check`                                                                                                                                              | Yes, when tooling exists            | Checks Markdown, JSON, CSS, TS/TSX, and config files.             |
| `format`       | `prettier . --write`                                                                                                                                              | Yes, when tooling exists            | Developer convenience; not a substitute for `format:check` in CI. |
| `test`         | `pnpm --filter @local-media-studio/web test && pnpm --filter @local-media-studio/shared test && pnpm --filter @local-media-studio/media-core test`                | Yes, when testable code exists      | Runs unit/component tests through Vitest.                         |
| `test:watch`   | `pnpm --filter @local-media-studio/web test:watch`                                                                                                                | Later                               | Local development convenience.                                    |
| `test:e2e`     | `pnpm --filter @local-media-studio/web test:e2e`                                                                                                                  | Yes, after first UI workflow exists | Runs Playwright browser tests with small media fixtures.          |
| `check`        | `pnpm typecheck && pnpm lint && pnpm format:check && pnpm test && pnpm build`                                                                                     | Yes, when scaffold exists           | Minimal local and CI quality gate.                                |
| `check:e2e`    | `pnpm check && pnpm test:e2e`                                                                                                                                     | Later                               | Full UI workflow gate after first slice exists.                   |
| `clean`        | `pnpm --filter @local-media-studio/web clean && pnpm --filter @local-media-studio/shared clean && pnpm --filter @local-media-studio/media-core clean`             | Later                               | Removes generated build/test artifacts where useful.              |

## Code Quality

- EditorConfig: Required once scaffolding begins. Use consistent LF endings, UTF-8, two-space indentation for JS/TS/JSON/YAML/Markdown, and final newline.
- ESLint: Required. Use ESLint flat config with TypeScript, React, React Hooks, Vite/browser globals, and test overrides.
- Prettier: Required. Formatting is enforced by `format:check`.
- TypeScript strictness: Required. Use `strict: true`, `noUncheckedIndexedAccess: true`, and `exactOptionalPropertyTypes: true` unless a specific implementation reason is documented.
- Shared config package: Deferred. Add `packages/config` only when config duplication across app/packages becomes meaningful.
- Import boundaries: UI code may import shared schemas/types and media-core helpers. Media-core should not import React UI components.
- Worker boundaries: Heavy media processing and model inference must run through explicit Worker-facing APIs. UI components must not call ffmpeg/background-removal long-running work directly on the main thread.
- Error handling: Long-running jobs must expose progress when feasible, cancellation when feasible, and readable failure reasons.

## Repository Layout Rules

Planned implementation layout:

```text
.
├── apps/
│   └── web/
├── packages/
│   ├── shared/
│   └── media-core/
└── docs/
```

- `apps/web`: React + Vite app, routes/views, UI components, browser integration, Playwright tests.
- `packages/shared`: Zod schemas, shared TypeScript types, constants, media metadata contracts.
- `packages/media-core`: Pure or browser-adapter media helpers, ffmpeg command builders, subtitle serialization, image operation utilities, worker message contracts.
- Do not create backend, database, auth, worker service, or cloud-processing packages for v1 unless the source-of-truth documents are updated first.

## CI

- Provider: GitHub Actions is the default once Git and remote hosting are initialized.
- Required jobs:
  - Install dependencies using the committed `pnpm-lock.yaml`.
  - Run `pnpm typecheck`.
  - Run `pnpm lint`.
  - Run `pnpm format:check`.
  - Run `pnpm test`.
  - Run `pnpm build`.
- Required commands: `pnpm check` is the minimum merge gate after scaffolding.
- Branch or PR gate: Every PR or stable branch checkpoint should pass `pnpm check`. Add `pnpm test:e2e` once the first browser workflow exists and fixtures are stable.
- Browser test timing: Playwright can be introduced with smoke tests first, then expanded to upload, image edit/export, video edit/export, and failure handling.

## Database Migration

- Migration tool: Not applicable in v1.
- Config file: Not applicable in v1.
- Migration directory: Not applicable in v1.
- Local database command: Not applicable in v1.
- Rollback or recovery note: No server database exists. Browser session/draft recovery must remain lightweight and privacy-explicit. If persistent IndexedDB, File System Access API, or cloud storage is introduced later, create/update `docs/architecture/DATABASE_DESIGN.md` first.

## Environment Config

- `.env.example` present: Required once scaffolding begins, even if it initially documents that no runtime secrets are required.
- Runtime env validation: Not required for v1 if no secrets or external services exist. Required before adding cloud APIs, analytics, storage, or backend services.
- Required variables:
  - None for the local-first v1 MVP.
  - Future deployment may require public build-time flags for WASM asset path or feature flags; if introduced, document them in `docs/ops/DEPLOYMENT.md`.
- Secret rule: No API keys, private tokens, account identifiers, sample private media, or local absolute paths may be committed.

## Testing Layers

| Layer                | Tool                                              | Covers                                                                                                                                                      | Required now                          |
| -------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| Unit                 | Vitest                                            | Zod schemas, subtitle cue validation, time-range math, export setting validation, ffmpeg command builders, image operation reducers                         | Yes, once code exists                 |
| Component            | React Testing Library + Vitest                    | Upload controls, media library list, toolbar states, export panel validation, dialogs, progress/error states                                                | Yes, once UI exists                   |
| Browser/e2e          | Playwright                                        | Upload fixture media, switch assets, image edit/export smoke, video trim/speed/subtitle/export smoke, unsupported file messaging                            | Yes, after first UI workflow exists   |
| Security regression  | Vitest + Playwright                               | No media upload/network calls in v1, unsupported formats, large-file warnings, worker failure handling, no raw media persistence beyond documented behavior | Yes, after relevant code exists       |
| Visual/canvas sanity | Playwright screenshots and targeted canvas checks | Nonblank previews, visible crop/annotation/watermark changes, export panel states                                                                           | Yes, for implemented visual workflows |

## Test Fixtures

- Keep test media tiny and purpose-built.
- Store fixtures under `apps/web/tests/fixtures/` only after scaffolding begins.
- Include at most:
  - one small PNG or JPG image,
  - one small transparent PNG if needed,
  - one short MP4/WebM clip,
  - one subtitle cue fixture if needed.
- Do not commit private user media, large sample videos, copyrighted assets of unclear origin, or generated files that can be recreated by tests.

## Media Processing Baseline

- ffmpeg.wasm work must run in a Worker, not directly in React render/event logic.
- Every processing job must have a typed job object with status: idle, queued, loading, processing, completed, canceled, or failed.
- Cancellation must be offered where technically feasible; when not feasible, the UI must say the operation cannot be canceled after a certain phase.
- Large-file warnings must be shown before expensive video processing once implementation defines size/duration thresholds.
- The app must detect and explain unsupported formats/codecs instead of failing silently.
- WASM/model loading must show progress or at least a loading state.
- COOP/COEP requirements for SharedArrayBuffer or multi-threaded WASM must be documented in deployment before release.

## Privacy And Security Baseline

- First version must not upload user media to backend services or third-party APIs.
- Any network request introduced by dependencies or app code must be reviewed for privacy impact.
- Background-removal model download is allowed only as application/model asset loading; user media must remain local.
- Raw media persistence must be explicit. Do not silently store full user media long-term in IndexedDB, OPFS, or File System Access API.
- Browser storage may keep lightweight draft metadata and edit operations when documented.
- If analytics are added later, they must not collect file names, raw media, local paths, subtitles, or derived image/video content.
- If cloud processing is proposed later, update `PROJECT_CHARTER.md`, `TECH_STACK.md`, `BACKEND_SPEC.md`, `TOOL_POLICY.md`, and `DEPLOYMENT.md` before implementation.

## Dependency And License Baseline

- All dependencies must be listed in `docs/architecture/TECH_STACK.md` before installation.
- `@imgly/background-removal` carries AGPL/license caveats. Before public or commercial distribution, re-check its license and document the acceptance or replacement path.
- Avoid commercial SDKs in v1 unless the tech stack document is updated and user approval is received.
- Avoid adding large media libraries when a native browser API or existing selected library covers the requirement.
- Run dependency audit before release and after adding media/WASM/ML dependencies.

## Commit Discipline

- Commit style: Conventional Commits, for example `docs: add engineering baseline`, `feat: scaffold web app`, `test: add media export smoke tests`.
- Husky/lint-staged/commitlint: Deferred until the repo is initialized and package scripts exist. CI remains the source of enforcement.
- Files forbidden from Git:
  - `.env`, `.env.local`, `.env.*.local`
  - API keys, tokens, private config, credentials
  - private user media, personal downloads, and unlicensed media samples
  - generated export outputs unless explicitly used as tiny deterministic fixtures
  - build artifacts such as `dist/`, coverage output, cache directories, and dependency folders
- Pre-commit or pre-push expectations:
  - Inspect `git status` and `git diff`.
  - Run `pnpm check` once scripts exist.
  - Run focused tests for the touched workflow.
  - For media-processing changes, include browser evidence or a clear reason why browser verification is not applicable.

## Implementation Readiness Dependency

Before scaffolding or writing runnable product behavior, the following documents still need to exist or be explicitly marked not applicable:

- `AGENTS.md`
- `docs/architecture/FRONTEND_PLAN.md`
- `docs/architecture/DATABASE_DESIGN.md` or an explicit v1 no-database decision
- `docs/architecture/BACKEND_SPEC.md` or an explicit v1 no-backend decision
- `docs/workflow/AI_WORKFLOW.md`
- `docs/ops/TOOL_POLICY.md`
- `docs/ops/DEPLOYMENT.md`

This baseline does not authorize scaffolding, package installation, UI code, media-processing code, or a dev server by itself.
