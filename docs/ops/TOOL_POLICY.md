# TOOL_POLICY

## Document Status

- Project charter confirmed: Yes, `docs/project/PROJECT_CHARTER.md`.
- Tech stack confirmed: Yes, `docs/architecture/TECH_STACK.md`.
- User approved writing this document: Yes, selected accelerated path B in chat on 2026-06-22.
- Last reviewed: 2026-06-22.

## Default Open

The AI agent may do these without extra confirmation during normal project work:

- Read, search, and summarize local project files.
- Edit project files after the relevant document consent/source-of-truth rule is satisfied.
- Run local tests, lint, type checks, builds, and formatting checks once scripts exist.
- Start local dev servers after implementation begins.
- Inspect Git status and diff.
- Use local browser verification for the local app.
- Look up official documentation, package docs, GitHub repositories, release notes, and security/license information when current facts matter.

## Project Open

| Tool | Purpose | Allowed | Forbidden | Evidence |
| --- | --- | --- | --- | --- |
| Local shell | Engineering commands | `rg`, `find`, `sed`, package scripts, test/build commands, local dev server | Destructive filesystem operations without confirmation | Command summary and relevant output |
| apply_patch | Project file edits | Source docs and implementation edits within approved scope | Editing source-of-truth docs without consent | Changed file paths and summary |
| pnpm | Package manager and scripts | Install documented dependencies after implementation approval, run scripts | Installing undocumented major dependencies or changing package manager | `pnpm-lock.yaml`, scripts, command output |
| Local browser/Playwright | UI and privacy verification | Test local app, screenshots, upload fixture media, inspect network/storage | Uploading private user media or logging into unrelated accounts | Browser notes, screenshots, test output |
| Web search/docs | Current technical facts | Official docs, GitHub repos, package registries, security/license checks | Treating stale/unofficial sources as final for critical decisions | Links and decision summary |
| Vercel/static hosting tools | Preview/static deploy after deployment approval | Preview deploy, inspect headers/logs | Production deploy, rollback, DNS, billing without confirmation | Preview URL, build logs, header checks |
| Git | Version safety | `git status`, `git diff`, `git init` after confirmation, commits after confirmation | `reset --hard`, force push, branch deletion, checkout reverting user work without confirmation | Status/diff summary and commit hash when applicable |

## Must Confirm First

- Creating or updating source-of-truth documents, unless the user has explicitly authorized the exact document or named batch.
- Initializing Git or making commits.
- Installing dependencies or creating package manager files.
- Scaffolding apps, packages, UI code, Worker code, or runnable behavior.
- Production deploy, rollback, DNS, billing, cloud infrastructure changes, or public release.
- Real secrets, tokens, payment credentials, private user data, or private user media handling.
- Production database writes, migrations, deletes, exports, or cloud storage changes.
- Destructive Git or filesystem operations.
- Public publishing, package publication, or external account actions.
- Any feature that uploads media, stores raw media long-term, adds analytics, or changes the local-first promise.

## Forbidden In V1 Without Source-Of-Truth Update

- Uploading user media to a backend or third-party API.
- Adding accounts, cloud sync, team collaboration, or remote media storage.
- Adding a server database or persistent raw media cache.
- Adding analytics that include file names, subtitles, media content, local paths, or derived content.
- Introducing a multi-track timeline, Photoshop-like layer model, CapCut-style template system, or AI video generation.
- Replacing React/Vite, pnpm, Zustand, ffmpeg.wasm, or the selected image/media architecture without documented approval.

## Evidence Required

- State which tools were used.
- Provide changed file paths and decision summaries for docs.
- Provide tests, diffs, logs, screenshots, API responses, browser notes, network/storage inspection, or security scan output as applicable.
- For privacy-sensitive changes, explicitly state whether user media remains local and what evidence supports that claim.
- For deployment, provide build evidence, target environment, URL when available, header/env checks, and rollback path.

## High-Risk Confirmation Format

For high-risk actions, ask in plain text and name the exact action:

```text
请确认是否允许我执行：<exact action>.
风险：<risk>.
验证方式：<evidence>.
回复“确认执行”后我再继续。
```

Do not rely on UI buttons or host-specific quick actions for high-risk approval.
