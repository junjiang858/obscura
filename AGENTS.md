# AGENTS

## Project Goal

Build Local Media Studio, a local-first web media workspace for personal creators to quickly preview, edit, manage, and export images and short videos without installing heavy desktop software or uploading private media.

The first version is an image-first and single-video editing MVP. It includes media upload, media library, large preview, previous/next switching, image crop/rotate/flip/resize/adjust/annotate/watermark/background removal/format export, and video preview/trim/speed/manual subtitles/format export. It does not include accounts, cloud storage, backend upload, team collaboration, multi-track timelines, advanced keyframes, AI video generation, or template marketplaces.

## Project Documents

Read these before implementation:

1. `docs/project/PROJECT_CHARTER.md`
2. `docs/architecture/TECH_STACK.md`
3. `docs/architecture/ENGINEERING_BASELINE.md`
4. `docs/workflow/AI_WORKFLOW.md`
5. `docs/ops/TOOL_POLICY.md`
6. `docs/ops/DEPLOYMENT.md`

Read task-specific docs when relevant:

- Frontend: `docs/architecture/FRONTEND_PLAN.md`
- Backend/API or cloud processing: `docs/architecture/BACKEND_SPEC.md`
- Database, IndexedDB, OPFS, File System Access API, or persistence: `docs/architecture/DATABASE_DESIGN.md`

If a required document is missing, stop before implementation and ask to create or update the source-of-truth document first.

## Source Of Truth

Resolve conflicts in this order:

1. Latest explicit user instruction
2. `docs/project/PROJECT_CHARTER.md`
3. `docs/architecture/TECH_STACK.md`
4. `docs/architecture/ENGINEERING_BASELINE.md`
5. Task-specific docs under `docs/architecture/`, `docs/workflow/`, and `docs/ops/`
6. This `AGENTS.md`
7. Existing code conventions

## Technical Route

- Architecture: Single Web App.
- Runtime and package manager: Node.js 24 LTS with pnpm workspace.
- Frontend: React 19 + TypeScript + Vite.
- UI: Tailwind CSS v4 + shadcn/ui + Radix UI + Material Symbols SVG React.
- State and validation: Zustand + zundo + Zod.
- Image editing: Canvas API + Cropper.js + Konva/react-konva.
- Background removal: `@imgly/background-removal`, with documented AGPL/license caveat.
- Video processing: ffmpeg.wasm in Web Workers coordinated through Comlink.
- Testing: Vitest + React Testing Library + Playwright.

Do not introduce a new framework, UI kit, state library, media pipeline, package manager, deployment model, database, backend, or cloud-processing provider without updating the relevant source-of-truth document and receiving user approval.

## Working Rules

- Keep the first MVP single-user and local-first.
- Do not upload user media to a backend or third-party API in v1.
- Do not silently persist raw user media beyond documented local draft behavior.
- Keep detailed project documents under `docs/`; keep this file short as the root index.
- Update the relevant source-of-truth document before code when design, API, database, permission, deployment, tool, persistence, or operational behavior changes.
- For frontend work, follow `docs/architecture/FRONTEND_PLAN.md` for source tree, file responsibilities, component split rules, state/config/i18n/utils ownership, and import boundaries before editing UI code.
- For frontend work, also follow the Product MVP UI Quality Gate in `docs/architecture/FRONTEND_PLAN.md`: Design Read, design system tokens, state and interaction contract, responsive/accessibility expectations, anti-slop guardrails, and browser UI quality verification.
- Keep changes small, reviewable, and aligned with the documented tech stack.
- Prefer existing project patterns before adding abstractions.
- Run heavy media processing and model inference behind explicit Worker-facing APIs.
- Show progress, cancellation when feasible, and readable failure reasons for long-running media jobs.
- Never put secrets, private config, private user media, or local-only personal paths in code or Git history.

## Interaction Defaults

### Confirmation Prompt Rule

Any request for confirmation, consent, approval, or a path choice must include plain-text options in the assistant message. Do not rely only on UI buttons, `request_user_input`, AskUserQuestion, or host-specific quick actions. State what each option authorizes before waiting for the user's reply.

### User Language Rule

Use the user's current language for questions, confirmations, progress updates, final answers, and milestone messages unless the user asks for another language.

## Implementation Readiness

Do not create runnable product code, package manager files, app scaffolding, API skeletons, database schemas, migrations, or dev-server behavior until the readiness gate is satisfied.

Required before implementation:

- `AGENTS.md`
- `docs/project/PROJECT_CHARTER.md`
- `docs/architecture/TECH_STACK.md`
- `docs/architecture/ENGINEERING_BASELINE.md`
- `docs/architecture/FRONTEND_PLAN.md`
- `docs/architecture/DATABASE_DESIGN.md` or explicit v1 no-database decision
- `docs/architecture/BACKEND_SPEC.md` or explicit v1 no-backend decision
- `docs/workflow/AI_WORKFLOW.md`
- `docs/ops/TOOL_POLICY.md`
- `docs/ops/DEPLOYMENT.md`

When frontend UI is in scope, `docs/architecture/FRONTEND_PLAN.md` must define the frontend engineering contract, not only visual style or page lists. It must cover source tree, route/page responsibilities, shared UI and business component locations, state ownership, config/messages/icons/assets/utilities ownership, and import boundaries.

It must also define the Product MVP UI Quality Gate before UI code starts. The plan must include Design Read, Design Dials, design system tokens, UI component strategy, state and interaction contract, responsive and accessibility expectations, anti-slop guardrails, and browser UI quality verification. Do not use the accelerated path to skip this gate; after creating or updating the named missing batch, rerun the implementation readiness audit and block frontend code if the UI quality gate is incomplete.

If multiple readiness documents are missing, do not give only a single next-document suggestion. Offer plain-text options and do not depend on UI buttons:

- `A. Steady path`: create or update the single most important next document, then ask for review.
- `B. Accelerated path`: ask for consent to create or update the named missing batch for this stage, then run the implementation readiness audit.

Batch consent applies only to the named missing batch and does not authorize implementation code, scaffolding, package manager files, UI pages, APIs, schemas, migrations, or runnable behavior.

## Completion Definition

A task is complete only when evidence appropriate to the work is provided:

- Docs: updated file path and summary of changed decisions.
- Frontend: typecheck, lint, tests/build when available, plus browser evidence for user-facing workflows.
- Media processing: focused tests or browser evidence for success, progress, failure, and cancellation paths where feasible.
- Security/privacy: evidence that v1 media remains local and no forbidden upload or persistence path was introduced.
- Source-of-truth changes: updated docs must be listed before code evidence.
- Frontend browser UI quality evidence must cover desktop and mobile when UI is changed.
- Frontend files must follow the documented source tree and component boundaries when UI is changed.
- Git: inspect status and diff before committing once Git is initialized.

## Commit Discipline

- Commit stable stage boundaries.
- Use Conventional Commits, for example `docs: add agent constitution` or `feat: scaffold web app`.
- Before committing, inspect `git status` and `git diff`.
- Run `pnpm check` once scripts exist.
- Do not commit generated build artifacts, dependency folders, private media, `.env*` files with secrets, coverage output, or local caches.

## Forbidden Actions

- Production changes without explicit confirmation.
- Destructive Git or filesystem operations without explicit confirmation.
- Broad rewrites without a documented plan and approval.
- New major dependencies without documented approval.
- Cloud media upload, analytics over user media, accounts, remote persistence, or backend processing in v1 without source-of-truth updates and user approval.
- Multi-track timeline, Photoshop-like layer editor, CapCut-style template system, or AI video generation in v1 without changing the project scope first.
- Packing unrelated frontend UI, config, messages, state, mock data, icons, and utilities into a single app, page, or route file.
