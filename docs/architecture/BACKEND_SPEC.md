# BACKEND_SPEC

## Document Status

- Project charter confirmed: Yes, `docs/project/PROJECT_CHARTER.md`.
- Tech stack confirmed: Yes, `docs/architecture/TECH_STACK.md`.
- Database decision confirmed: Yes, `docs/architecture/DATABASE_DESIGN.md` states v1 has no server database.
- User approved writing this document: Yes, selected accelerated path B in chat on 2026-06-22.
- Last reviewed: 2026-06-23.
- Current local worker update: Approved by user on 2026-06-23. This pass keeps processing local and adds a runtime background-job layer for generated previews, encoding/export, and background removal without adding a backend.

## Decision Summary

The first MVP has no backend HTTP API, no server-side upload endpoint, no authentication service, no database service, and no cloud media processing.

The app still has backend-like processing boundaries inside the browser: ffmpeg.wasm, background removal, metadata extraction, thumbnail generation, image format encoding, export jobs, derived video preview jobs, and long-running media work must run behind explicit Worker-facing APIs. This document defines those local processing contracts so the implementation does not scatter heavy work through React components.

## Responsibilities

- Keep user media local to the browser in v1.
- Validate local media metadata, edit settings, export settings, subtitle cues, and Worker messages.
- Run heavy media processing through Web Workers where feasible.
- Expose progress, cancellation when feasible, retry, and readable errors for long-running jobs.
- Keep submitted generated-preview, encoding/export, and background-removal jobs alive when the user switches media, using the submitted input snapshot rather than current UI state.
- Insert completed generated results into the media library as new local session assets when a job produces a blob/file.
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

| Rule                                                                  | Enforced where                                                              | Failure behavior                                                        |
| --------------------------------------------------------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| User media must not be uploaded to a backend or third-party API in v1 | Frontend upload layer, Worker job layer, tool policy, browser privacy tests | Block the operation and show a privacy/scope error                      |
| Only user-selected files can enter the workspace                      | UploadDropzone/file input handlers                                          | Reject implicit file access and show unsupported input state            |
| Unsupported media formats/codecs must fail visibly                    | Metadata extraction and preview/export validation                           | Mark asset as unsupported and explain the limitation                    |
| Optional image formats must be capability-gated                       | Export format registry and encoder adapters                                 | Disable unsupported formats with a readable reason                      |
| Export requires a selected asset and valid settings                   | Export panel validation and Worker job builder                              | Disable export and show field-level error                               |
| Video trim ranges must be valid                                       | Video edit state validation                                                 | Disable export until start/end are valid                                |
| Subtitle cues must have valid timing and text                         | Subtitle cue validation                                                     | Show cue-level error and prevent export                                 |
| Derived video preview must preserve the source file                   | Video apply/export workflow                                                 | Add or preview a generated local blob without mutating the original     |
| Long-running jobs must expose status                                  | Worker job orchestration                                                    | Show loading/progress, cancellation if feasible, retry/reset on failure |
| Background jobs must capture submitted state                          | Job store and Worker-facing API launchers                                   | Use asset id, input snapshot, and fingerprint from launch time          |
| Switching media must not cancel submitted generated/encoding jobs     | App composition and job store                                               | Keep job running unless user cancels or source asset is removed         |
| Completed generated results become new local assets                   | Job completion handler and media store                                      | Insert result after source asset and mark it as generated/session-local |
| Raw media persistence is forbidden unless docs change                 | Data/storage boundary and security tests                                    | Block persistence path and update source docs before any change         |

## API Contracts

No HTTP API contracts exist in v1.

| Method         | Path           | Input                | Output           | Errors            |
| -------------- | -------------- | -------------------- | ---------------- | ----------------- |
| Not applicable | Not applicable | No HTTP request body | No HTTP response | No backend errors |

## Local Worker Contracts

These are internal browser contracts, not network APIs.

| Contract                        | Input                                                                                    | Output                                                            | Errors                                                                                                              |
| ------------------------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `extractMediaMetadata`          | `File`, generated asset id                                                               | dimensions, duration, MIME type, file size, preview URL metadata  | unsupported type, unreadable file, metadata timeout                                                                 |
| `generateVideoThumbnails`       | video `File` or object URL, sample count/time points                                     | thumbnail blobs/object URLs and timestamps                        | codec unsupported, decode failed, memory limit                                                                      |
| `runImageBackgroundRemoval`     | image blob/object URL, job id, options                                                   | foreground image blob/mask/result URL                             | model load failed, inference failed, canceled, memory limit                                                         |
| `detectImageExportCapabilities` | browser canvas support and registered encoder adapters                                   | format availability map, MIME type, extension, disabled reason    | capability probe failed, encoder unavailable                                                                        |
| `buildImageExport`              | source image, ImageEditState, export settings                                            | output blob, suggested filename, and optional preview fingerprint | invalid image state, canvas export failed, unsupported format, encoder failed                                       |
| `adaptImageInputFormat`         | image `File` and target preview format                                                   | decoded preview blob/object URL and metadata                      | HEIC/TIFF decode failed, license-gated adapter disabled, memory limit                                               |
| `runVideoDerivedPreview`        | source video, VideoEditState, operation kind                                             | derived preview blob/object URL, filename, metadata, fingerprint  | ffmpeg load failed, unsupported codec/container, invalid range, canceled, memory limit, browser preview unsupported |
| `runVideoExport`                | source video or matching derived preview, VideoEditState, subtitle cues, export settings | output blob and suggested filename                                | ffmpeg load failed, unsupported codec/container, invalid range, canceled, memory limit                              |
| `serializeWebVTT`               | subtitle cue list                                                                        | WebVTT text/blob                                                  | invalid cue timing, empty cue text where required                                                                   |

### Local Background Job Contract

`BackgroundJob` is a browser runtime contract layered on top of Worker-facing operations. It is not a backend queue and is not persisted as a database record.

| Field                         | Purpose                                                                                              |
| ----------------------------- | ---------------------------------------------------------------------------------------------------- |
| `id`                          | Local job id used for progress, cancellation, retry, and UI list actions                             |
| `type`                        | Metadata, thumbnail, image-preview, image-export, background-removal, video-preview, or video-export |
| `sourceAssetId`               | Asset that launched the job                                                                          |
| `sourceAssetName`             | Display-only source name; do not include local filesystem paths                                      |
| `sourceAssetKind`             | Image or video for icon and status grouping                                                          |
| `title`                       | Localized short label such as Generate preview, Remove background, or Export MP4                     |
| `fingerprint`                 | Submitted edit/export fingerprint used to detect whether a generated result matches current settings |
| `inputSnapshot`               | Minimal submitted settings required for retry; must not contain raw media bytes                      |
| `status`, `progress`, `error` | Existing WorkerJob lifecycle state                                                                   |
| `resultAssetId`               | Media library asset id created from the generated result, when applicable                            |

Job launchers must use values captured at submit time. They must not read mutable selected-asset state after the job has started.

## Data Flow

| Flow                  | Reads                                                                                           | Writes                                                                            | Notes                                                                                                                                                                                           |
| --------------------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Media import          | Browser-selected `File` objects                                                                 | In-memory MediaAsset list and object URLs                                         | No remote upload. Object URLs must be revoked.                                                                                                                                                  |
| Image editing         | MediaAsset and ImageEditState                                                                   | In-memory ImageEditState, layer state, crop rectangle, and preview render         | Use operation state, not destructive mutation of the original file.                                                                                                                             |
| Image format export   | Selected image, edit state, format registry                                                     | Temporary generated blob/object URL, preview fingerprint, and user download       | Browser-native formats are feature-detected; GIF/TIFF/BMP use local encoders. Matching generated previews may be reused only while their fingerprint equals the current edit/export settings.   |
| Background removal    | Selected image and job settings                                                                 | Runtime job state and generated result blob/object URL                            | Model assets may load from app/CDN path; user image remains local.                                                                                                                              |
| Video editing         | MediaAsset and VideoEditState                                                                   | In-memory VideoEditState, thumbnail metadata, subtitle cues, derived preview blob | Single-asset only; no multi-track timeline in v1.                                                                                                                                               |
| Background job launch | Source asset, submitted edit/export settings, fingerprint, and localized job label              | Runtime BackgroundJob and task-launch UI marker                                   | Switching media or editing the source after launch does not mutate the submitted job.                                                                                                           |
| Video derived preview | Source video, trim/speed/format/subtitle settings                                               | Temporary local derived blob/object URL, fingerprint, and optional library asset  | Original source remains untouched; derived URLs must be revoked. Completed generated results may be inserted into the media library as new session assets.                                      |
| Export                | Selected asset, matching derived preview when present, edit state, editor-owned export settings | Runtime ExportJob and user-downloaded blob                                        | Export result is temporary unless user downloads it. The export panel must not own duplicated format settings, and it must ignore stale generated previews whose fingerprint no longer matches. |
| Draft recovery        | Lightweight edit metadata                                                                       | Browser storage draft metadata when implemented                                   | Raw media bytes are not silently persisted.                                                                                                                                                     |

## Auth And Permissions

- Auth method: None in v1.
- Roles: Single local user.
- Ownership rules: The active browser user owns only the files they explicitly select in the current session.
- Admin-only operations: None in v1.
- Future change rule: Accounts, roles, cloud projects, sharing, collaboration, or remote storage require source-of-truth updates before code.

## Validation And Errors

- Input validation:
  - Use Zod for subtitle cues, export settings, worker messages, and draft metadata.
  - Validate MIME type, file size, duration, dimensions, crop rectangle, layer transforms, trim range, speed value, loop/current-time values, output format, and required text fields.
  - Validate image export format capability before invoking an encoder.
  - Validate video output containers before invoking ffmpeg and show a readable message when a generated result is downloadable but not browser-previewable.
  - Validate video reset actions by mapping them to documented original/default values rather than ad hoc UI-only values.
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

| Risk                     | Rule                                                                          | Verification                                                    |
| ------------------------ | ----------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Accidental media upload  | No app code or dependency integration may upload user media in v1             | Browser network inspection and tests around upload/export flows |
| Raw media in logs        | Logs must not include raw media, subtitles, local paths, or generated content | Console/log review during browser tests                         |
| Long-running UI lockup   | Heavy processing should run through Worker APIs                               | Browser interaction stays responsive during jobs                |
| Unsupported encoder path | Optional encoders must fail with readable errors instead of empty downloads   | Unit tests and browser export smoke checks                      |
| Unsafe persistence       | Raw media must not be silently stored long-term                               | Storage inspection and code review                              |
| Dependency/license risk  | Background-removal AGPL/license caveat must remain documented                 | Pre-release dependency/license review                           |

## Change Rule

- Update this document before implementing changes to APIs, request/response contracts, validation, error shape, permissions, backend workflows, integrations, workers, or data flow.
- If a future task introduces a backend, cloud API, storage provider, account system, analytics, or remote media processing, update this file plus `docs/architecture/TECH_STACK.md`, `docs/architecture/DATABASE_DESIGN.md`, `docs/ops/TOOL_POLICY.md`, and `docs/ops/DEPLOYMENT.md` before implementation.
