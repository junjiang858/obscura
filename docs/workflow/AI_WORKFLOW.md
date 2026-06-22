# AI_WORKFLOW

## Document Status

- Project charter confirmed: Yes, `docs/project/PROJECT_CHARTER.md`.
- Tech stack confirmed: Yes, `docs/architecture/TECH_STACK.md`.
- User approved writing this document: Yes, selected accelerated path B in chat on 2026-06-22.
- Last reviewed: 2026-06-22.

## Flow

1. Clarify the request and identify the current project stage.
2. Read `AGENTS.md` and the relevant source-of-truth documents under `docs/`.
3. State the current goal, completion signal, and next action.
4. If source-of-truth documents are missing, stop before implementation and offer plain-text options for steady or accelerated documentation paths.
5. If the task changes design, frontend source tree, component boundaries, contracts, data shape, permissions, tools, deployment, persistence, or operations, update the affected source-of-truth document first.
6. Produce a small implementation plan only after the relevant documents exist and align.
7. Implement the smallest useful change against the approved documents.
8. Run the appropriate checks: typecheck, lint, tests, build, browser verification, privacy/security checks.
9. Report changed files, changed decisions, commands run, verification evidence, and remaining risks.
10. Archive or hand off the current state with completed work, remaining work, and next recommended action.

## Human Confirmation Required

- Creating or updating any source-of-truth document under `docs/` or root `AGENTS.md`.
- Entering implementation after the readiness gate passes.
- Any scope change to v1 capabilities, non-goals, local-first promise, backend/API boundary, database/storage behavior, deployment, or tool permissions.
- Adding a major dependency or replacing any selected stack component.
- Adding backend upload, cloud processing, analytics, accounts, remote persistence, or public sharing.
- Handling secrets, tokens, production data, private user data, payment credentials, DNS, billing, or cloud infrastructure.
- Production deploy, rollback, public package/repo publishing, or external account actions.
- Destructive Git or filesystem operations.

## Direct Coding Is Forbidden When

- The Project Specification Readiness Gate is incomplete.
- The request changes frontend design, API/Worker contracts, persistence, permissions, deployment, tools, or operations and the relevant doc has not been updated.
- The requested work would upload user media or persist raw media contrary to v1 docs.
- The work introduces a new framework, UI kit, media pipeline, state library, database, backend, or cloud provider without documented approval.
- The operation is destructive or high risk and explicit confirmation has not been received.

## Evidence By Work Type

| Work type            | Evidence                                                                                                               |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Docs                 | Changed file paths, summary of decisions, readiness audit if applicable                                                |
| Frontend             | Typecheck/lint/test/build output when scripts exist, browser verification, responsive screenshots or interaction notes |
| Media processing     | Unit tests for command/settings logic, browser evidence for preview/export/progress/failure, Worker boundary evidence  |
| Backend/API          | Updated `BACKEND_SPEC.md`, tests, health check/API sample if a backend is later approved                               |
| Database/persistence | Updated `DATABASE_DESIGN.md`, schema/storage design, rollback/retention note, privacy evidence                         |
| Security/privacy     | Risk table, affected files, normal and forbidden path verification, network/storage inspection                         |
| Deployment           | Build output, deployment URL or preview evidence, header/env verification, rollback path                               |

When implementation changes design or contracts, docs evidence must come before code evidence.
When frontend implementation changes source tree, file responsibilities, component boundaries, state/config/i18n/utils ownership, or import boundaries, `docs/architecture/FRONTEND_PLAN.md` evidence must come before code evidence.

## Planning Rules

- Keep plans short and staged.
- Prefer one approved product slice over broad horizontal scaffolding.
- Use the documented implementation order from `docs/architecture/FRONTEND_PLAN.md`.
- Split media work into narrow flows: import/metadata, image edit/export, background removal, video edit/export, browser verification.
- Do not expand into multi-track video, cloud processing, accounts, or persistent project files without source-of-truth updates.

## Implementation Rules

- Follow the tech stack in `docs/architecture/TECH_STACK.md`.
- Follow the frontend source tree, file boundary contract, component split rules, import boundaries, and Product MVP UI Quality Gate in `docs/architecture/FRONTEND_PLAN.md`.
- Keep heavy ffmpeg/background-removal work behind Worker-facing APIs from `docs/architecture/BACKEND_SPEC.md`.
- Use Zod for boundary validation where documented.
- Keep raw user media local and session-scoped according to `docs/architecture/DATABASE_DESIGN.md`.
- Add tests in proportion to risk: pure logic first, then component tests, then browser tests for key workflows.
- For frontend UX, follow `docs/architecture/FRONTEND_PLAN.md`: real workspace first, no marketing landing page.

## Verification Rules

- Run `pnpm check` once scripts exist before claiming implementation is complete.
- Run browser verification for any user-facing workflow.
- For media features, verify nonblank preview/output where feasible.
- For privacy-sensitive flows, inspect that no user media upload path was introduced.
- If a command cannot be run, state why and provide the best available substitute evidence.

## Session Handoff

At a handoff or final project-stage message, include:

- Current goal.
- Completed documents or implementation.
- Remaining readiness or implementation work.
- Risks and open questions.
- Next recommended action.
- Whether Git is initialized and whether a checkpoint exists.
