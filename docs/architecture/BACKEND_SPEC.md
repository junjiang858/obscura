# BACKEND_SPEC

## Document Status

- Project charter confirmed: Yes, `docs/project/PROJECT_CHARTER.md`.
- Tech stack confirmed: Yes, `docs/architecture/TECH_STACK.md`.
- Database decision confirmed: Yes, `docs/architecture/DATABASE_DESIGN.md` states v1 has no server database.
- User approved writing this document: Yes, selected accelerated path B in chat on 2026-06-22.
- Last reviewed: 2026-06-22.

## Decision Summary

The first MVP has no backend HTTP API, no server-side upload endpoint, no authentication service, no database service, and no cloud media processing.

The app still has backend-like processing boundaries inside the browser: ffmpeg.wasm, background removal, metadata extraction, thumbnail generation, export jobs, and long-running media work must run behind explicit Worker-facing APIs. This document defines those local processing contracts so the implementation does not scatter heavy work through React components.

## Responsibilities

- Keep user media local to the browser in v1.
- Validate local media metadata, edit settings, export settings, subtitle cues, and Worker messages.
- Run heavy media processing through Web Workers where feasible.
- Expose progress, cancellation when feasible, retry, and readable errors for long-running jobs.
- Prevent UI code from directly owning ffmpeg/background-removal lifecycle complexity.
- Document and reject any future backend/API/cloud-processing change before implementation.

## Explicit Non-Responsibilities In V1

- No HTTP API routes.
- No backend server process.
- No server-side file upload.
- No remote media storage.
- No user accounts, sessions, roles, or admin operations.
- No server database, migrations, ORM, or seed data.
- No production backend logs or server observability.

## Business Rules

| Rule | Enforced where | Failure behavior |
| --- | --- | --- |
| User media must not be uploaded to a backend or third-party API in v1 | Frontend upload layer, Worker job layer, tool policy, browser privacy tests | Block the operation and show a privacy/scope error |
| Only user-selected files can enter the workspace | UploadDropzone/file input handlers | Reject implicit file access and show unsupported input state |
| Unsupported media formats/codecs must fail visibly | Metadata extraction and preview/export validation | Mark asset as unsupported and explain the limitation |
| Export requires a selected asset and valid settings | Export panel validation and Worker job builder | Disable export and show field-level error |
| Video trim ranges must be valid | Video edit state validation | Disable export until start/end are valid |
| Subtitle cues must have valid timing and text | Subtitle cue validation | Show cue-level error and prevent export |
| Long-running jobs must expose status | Worker job orchestration | Show loading/progress, cancellation if feasible, retry/reset on failure |
| Raw media persistence is forbidden unless docs change | Data/storage boundary and security tests | Block persistence path and update source docs before any change |

## API Contracts

No HTTP API contracts exist in v1.

| Method | Path | Input | Output | Errors |
| --- | --- | --- | --- | --- |
| Not applicable | Not applicable | No HTTP request body | No HTTP response | No backend errors |

## Local Worker Contracts

These are internal browser contracts, not network APIs.

| Contract | Input | Output | Errors |
| --- | --- | --- | --- |
| `extractMediaMetadata` | `File`, generated asset id | dimensions, duration, MIME type, file size, preview URL metadata | unsupported type, unreadable file, metadata timeout |
| `generateVideoThumbnails` | video `File` or object URL, sample count/time points | thumbnail blobs/object URLs and timestamps | codec unsupported, decode failed, memory limit |
| `runImageBackgroundRemoval` | image blob/object URL, job id, options | foreground image blob/mask/result URL | model load failed, inference failed, canceled, memory limit |
| `buildImageExport` | source image, ImageEditState, export settings | output blob and suggested filename | invalid image state, canvas export failed, unsupported format |
| `runVideoExport` | source video, VideoEditState, subtitle cues, export settings | output blob and suggested filename | ffmpeg load failed, unsupported codec, invalid range, canceled, memory limit |
| `serializeWebVTT` | subtitle cue list | WebVTT text/blob | invalid cue timing, empty cue text where required |

## Data Flow

| Flow | Reads | Writes | Notes |
| --- | --- | --- | --- |
| Media import | Browser-selected `File` objects | In-memory MediaAsset list and object URLs | No remote upload. Object URLs must be revoked. |
| Image editing | MediaAsset and ImageEditState | In-memory ImageEditState and preview render | Use operation state, not destructive mutation of the original file. |
| Background removal | Selected image and job settings | Runtime job state and generated result blob/object URL | Model assets may load from app/CDN path; user image remains local. |
| Video editing | MediaAsset and VideoEditState | In-memory VideoEditState, thumbnail metadata, subtitle cues | Single-asset only; no multi-track timeline in v1. |
| Export | Selected asset, edit state, export settings | Runtime ExportJob and user-downloaded blob | Export result is temporary unless user downloads it. |
| Draft recovery | Lightweight edit metadata | Browser storage draft metadata when implemented | Raw media bytes are not silently persisted. |

## Auth And Permissions

- Auth method: None in v1.
- Roles: Single local user.
- Ownership rules: The active browser user owns only the files they explicitly select in the current session.
- Admin-only operations: None in v1.
- Future change rule: Accounts, roles, cloud projects, sharing, collaboration, or remote storage require source-of-truth updates before code.

## Validation And Errors

- Input validation:
  - Use Zod for subtitle cues, export settings, worker messages, and draft metadata.
  - Validate MIME type, file size, duration, dimensions, trim range, speed value, output format, and required text fields.
- Error shape:
  - Runtime jobs should return a typed error with `code`, `message`, `recoverable`, and optional `details`.
  - User-facing messages must be readable and avoid raw stack traces.
- Logging rule:
  - Browser console logs may include job status and non-sensitive technical context.
  - Logs must not include raw media bytes, subtitles, file paths, private metadata, tokens, or secrets.
- Request id:
  - No HTTP request id in v1.
  - Local jobs should use a `jobId` for progress, cancellation, retry, and debugging.

## Minimal Skeleton

- Startup line: No backend startup line in v1. The web app starts with the documented Vite dev command after scaffolding.
- Interface line: No health-check API in v1. The local app health check is the static web app loading successfully.
- Business line: Local worker contracts are the business boundary for media processing.
- Operations line: Build, typecheck, lint, unit tests, browser tests, and privacy checks provide operational evidence.
- Health check: Open the app, upload fixture media, confirm preview/edit/export UI loads, and confirm no backend endpoint is required.

## Security Boundary

| Risk | Rule | Verification |
| --- | --- | --- |
| Accidental media upload | No app code or dependency integration may upload user media in v1 | Browser network inspection and tests around upload/export flows |
| Raw media in logs | Logs must not include raw media, subtitles, local paths, or generated content | Console/log review during browser tests |
| Long-running UI lockup | Heavy processing should run through Worker APIs | Browser interaction stays responsive during jobs |
| Unsafe persistence | Raw media must not be silently stored long-term | Storage inspection and code review |
| Dependency/license risk | Background-removal AGPL/license caveat must remain documented | Pre-release dependency/license review |

## Change Rule

- Update this document before implementing changes to APIs, request/response contracts, validation, error shape, permissions, backend workflows, integrations, workers, or data flow.
- If a future task introduces a backend, cloud API, storage provider, account system, analytics, or remote media processing, update this file plus `docs/architecture/TECH_STACK.md`, `docs/architecture/DATABASE_DESIGN.md`, `docs/ops/TOOL_POLICY.md`, and `docs/ops/DEPLOYMENT.md` before implementation.
