# DATABASE_DESIGN

## Document Status

- Project charter confirmed: Yes, `docs/project/PROJECT_CHARTER.md`.
- Tech stack confirmed: Yes, `docs/architecture/TECH_STACK.md`.
- User approved writing this document: Yes, selected steady path A in chat on 2026-06-22.
- Last reviewed: 2026-06-22.

## Decision Summary

The first MVP does not use a server database, ORM, schema migration tool, backend persistence layer, or cloud storage.

The product is a local-first single-user browser tool. Uploaded media stays in the user's browser session and is represented by local `File` objects, object URLs, derived metadata, in-memory edit state, and lightweight draft metadata when explicitly implemented. Raw user media must not be uploaded to a server or silently persisted long-term.

## Core Objects

These are frontend/domain objects, not database tables in v1.

| Object | Purpose | Owner |
| --- | --- | --- |
| MediaAsset | Represents one uploaded image or video plus derived metadata and local object URL | Local browser session |
| MediaLibrary | Tracks current session assets, selected asset, filter mode, and ordering | Local browser session |
| ImageEditState | Stores crop, rotation, flip, resize, adjustments, annotations, watermark, background-removal result state, and undo/redo history | Local browser session |
| VideoEditState | Stores trim range, speed, manual subtitle cues, thumbnail metadata, and export options | Local browser session |
| SubtitleCue | Represents a manually authored subtitle segment with start time, end time, and text | Local browser session |
| ExportJob | Tracks local processing job status, progress, cancellation, retry, result object URL, and failure reason | Local browser session |
| LocalDraft | Stores recoverable lightweight draft metadata/edit operations when implemented | Browser storage, if explicitly enabled |

## Persistence Boundary

| Data category | v1 storage decision | Allowed content | Forbidden content |
| --- | --- | --- | --- |
| Uploaded raw media files | In-memory browser `File` references and object URLs only | User-selected file references for the active session | Silent long-term raw media storage in IndexedDB, OPFS, localStorage, or remote services |
| Media metadata | In-memory; optional lightweight browser draft | File name, MIME type, dimensions, duration, size, last modified timestamp | Full local filesystem paths or private folder structure |
| Edit operations | In-memory; optional lightweight browser draft | Crop rectangles, rotation angle, flip flags, adjustment values, annotation objects, subtitle cue timing/text | Embedded raw media bytes unless explicitly approved later |
| Generated previews/results | In-memory object URLs; user-initiated download | Temporary preview blobs and export result blobs | Automatic cloud upload or hidden persistent archive |
| Background-removal model/cache | Browser asset/model cache where the library/runtime requires it | Model/application assets, not user media | Persisted source images or masks beyond documented session behavior |
| Analytics or telemetry | Not allowed in v1 | None | File names, media content, subtitles, local paths, derived image/video content |

## Tables

No database tables exist in v1.

### Not Applicable: media_assets

| Field | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| id | Not applicable | no | n/a | Use in-memory client-generated IDs only; no persisted table primary key. |

### Not Applicable: edit_projects

| Field | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| id | Not applicable | no | n/a | Full project persistence is deferred. |

### Not Applicable: export_jobs

| Field | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| id | Not applicable | no | n/a | Export jobs are local runtime state, not persisted database records. |

## Relationships

These relationships are runtime state relationships, not database foreign keys in v1.

| From | To | Type | Reason |
| --- | --- | --- | --- |
| MediaLibrary | MediaAsset | One-to-many runtime collection | A session can contain multiple uploaded assets. |
| MediaAsset | ImageEditState | One-to-zero-or-one runtime state | Image assets have image-specific edit operations. |
| MediaAsset | VideoEditState | One-to-zero-or-one runtime state | Video assets have video-specific edit operations. |
| VideoEditState | SubtitleCue | One-to-many runtime collection | A video can have multiple manual subtitle segments. |
| MediaAsset | ExportJob | One-to-many runtime history while active | A user may run export more than once during a session. |
| LocalDraft | MediaAsset/edit states | Snapshot reference | Draft recovery may restore lightweight metadata and operations. |

## Indexes

No database indexes exist in v1.

If a future persistent local store is introduced, indexes should be justified by real lookup needs such as recent draft listing, asset id lookup, or project restore. Do not add indexes speculatively.

| Store or table | Fields | Query reason |
| --- | --- | --- |
| Not applicable in v1 | Not applicable | No server database or persistent indexed collection exists. |

## Browser Storage Design

### Allowed v1 storage

- In-memory Zustand stores for active session state.
- Object URLs for active previews and generated blobs, with deliberate revocation.
- Optional `sessionStorage` or `localStorage` for lightweight UI preferences and draft metadata only, such as selected panel, filter mode, crop values, subtitle cue text/timing, and export settings.

### Deferred storage

- IndexedDB through Dexie.
- Origin Private File System (OPFS).
- File System Access API workspace folders.
- Persistent project files.
- Persistent local media cache.
- Server database or cloud object storage.

Any deferred storage option requires updating this document before implementation.

## Lifecycle And Retention

| Data | Created when | Cleared when | Retention rule |
| --- | --- | --- | --- |
| File object reference | User selects or drops media | User removes asset, clears workspace, closes session, or browser releases page memory | Session-scoped only in v1 |
| Object URL | App creates preview/result URL | Asset removed, preview replaced, export result cleared, or page unloads | Must be revoked deliberately |
| Edit state | User applies operations | User resets asset, removes asset, clears workspace, or draft expires | Runtime state; optional lightweight draft only |
| Export result blob | Export completes | User downloads/clears result or page unloads | Temporary local result only |
| Background-removal job state | User starts background removal | Job completes, fails, cancels, or asset clears | Runtime state only |
| Lightweight draft metadata | App saves recoverable draft | User clears draft, draft becomes stale, or feature disabled | Must not include raw media bytes unless docs are updated |

## Security Notes

- Owner or tenant boundary: Single local user only. No multi-user, tenant, organization, account, or permission model in v1.
- Sensitive fields: User media, file names, subtitles, and derived content are privacy-sensitive. Do not send them to a backend or third-party API in v1.
- Soft delete or audit needs: Not applicable because no durable server records exist. Runtime removal should release object URLs and clear associated edit/job state.
- Local path rule: Browser APIs generally do not expose full local paths; the app must not attempt to infer or store private local folder structure.
- Raw media persistence rule: Do not silently store raw files, decoded frames, masks, or generated media long-term in browser storage.
- Analytics rule: If analytics are proposed later, update the source-of-truth documents first and forbid media content, file names, subtitles, local paths, and derived content in telemetry.

## Migration Plan

- Tool: Not applicable in v1.
- First migration: Not applicable in v1.
- Rollback or recovery note: No database migration rollback exists. Runtime data is session-scoped. If persistent local storage is added later, define export/import, stale draft cleanup, versioned draft schema, and recovery behavior before implementation.

## Future Persistence Triggers

Update this document before implementing any of the following:

- Persistent local project files.
- IndexedDB/Dexie storage for drafts, media metadata, generated thumbnails, masks, or exports.
- OPFS or File System Access API integration.
- User accounts, login, cloud sync, team collaboration, or remote storage.
- Backend job history, export history, audit logs, or analytics.
- Any schema, migration, seed, index, owner field, retention rule, or rollback behavior.

## Change Rule

- Update this document before implementing changes to tables, fields, relations, indexes, enums, seeds, schemas, migrations, ownership, retention, local persistence, or rollback behavior.
- If implementation reveals a need to persist raw media, generated media, draft projects, or cloud state, pause implementation and update this document plus `docs/architecture/BACKEND_SPEC.md`, `docs/ops/TOOL_POLICY.md`, and `docs/ops/DEPLOYMENT.md` as needed.
