# FRONTEND_PLAN

## Document Status

- Project charter confirmed: Yes, `docs/project/PROJECT_CHARTER.md`.
- Tech stack confirmed: Yes, `docs/architecture/TECH_STACK.md`.
- User approved writing this document: Yes, approved in chat on 2026-06-22.
- Last reviewed: 2026-06-22.

## Product Tone

- Target user: Personal creators who want quick, private, low-friction image and short-video edits.
- Product posture: A focused editing workspace, not a landing page and not a full professional suite.
- Visual density: Medium-dense desktop tool UI with clear scan paths, compact controls, and stable panel dimensions.
- First-screen signal: The upload/media workspace is the first screen. Do not show a marketing hero before the tool.
- Accessibility expectations: Keyboard-accessible upload, media switching, tool buttons, tabs, dialogs, sliders, and export actions; visible focus states; accessible names for icon buttons; no text trapped inside too-small controls.

## Page Map

| Route or screen | Goal | Primary action | Data needed | States |
| --- | --- | --- | --- | --- |
| `/` Media Workspace | Upload, preview, edit, and export selected media | Add media, select asset, edit, export | Local files, object URLs, media metadata, edit states, export jobs | Empty, drag-over, importing, selected, unsupported, processing, failed, exported |
| Media Library Panel | Manage uploaded images/videos in the current session | Select previous/next asset, filter by type, remove asset | MediaAsset list, selected asset id, filter mode | Empty, populated, filtered-empty, metadata-loading, item-error |
| Image Editor Panel | Apply image-specific operations | Crop, rotate, flip, resize, adjust, annotate, watermark, remove background, undo/redo/reset | ImageEditState, operation history, crop preset, annotation objects, background-removal job | Clean, dirty, comparing, background-loading, background-processing, failed, export-ready |
| Video Editor Panel | Apply single-video operations | Set trim range, adjust speed, add subtitle cue, export | VideoEditState, duration, current time, thumbnail frames, subtitle cues, export settings | Metadata-loading, ready, invalid-range, subtitle-editing, processing, failed, export-ready |
| Export Panel | Configure and run export for current asset | Choose output format/quality and download result | Selected asset, edit state, export settings, ExportJob | Disabled, ready, loading-engine, processing, completed, canceled, failed |
| Processing Feedback | Keep long-running work understandable | Cancel, retry, inspect failure | ExportJob or background-removal job status | Queued, loading, progress, canceling, failed, completed |

## First MVP Page

- Related first MVP slice: User uploads media, edits one selected image or video, previews the result, and downloads the edited file.
- Route or screen: `/` Media Workspace.
- Target user: Personal creator preparing social or personal-use image/video assets.
- Primary action: Upload local media and export an edited result.
- Success outcome: A processed image or short video is downloaded without uploading user media to a backend or third-party API.
- Required states:
  - Empty workspace with upload dropzone.
  - Drag-over upload state.
  - Importing/metadata-loading state.
  - Mixed media library with selected asset.
  - No selected asset state.
  - Unsupported format state.
  - Image edit dirty state with undo/redo/reset.
  - Image background-removal loading/processing/failed states.
  - Video metadata-loading, invalid trim range, subtitle editing, and processing states.
  - Export disabled, ready, processing, completed, canceled, and failed states.
- Data/API/mock behavior:
  - Data source is browser-local `File` objects, object URLs, derived metadata, and in-memory/session draft state.
  - No backend API in v1.
  - No user media upload in v1.
  - Worker-facing job APIs handle ffmpeg/background-removal operations after implementation.
- Browser verification evidence:
  - Upload image and video fixture.
  - Switch previous/next with UI and keyboard.
  - Perform at least one image edit and export.
  - Perform at least one video trim/speed/subtitle edit and export or export-smoke path.
  - Confirm unsupported media and failure states are visible.
  - Confirm no user media upload network request is introduced.

## Component Map

| Component | Purpose | Reuse scope |
| --- | --- | --- |
| `AppShell` | Owns full-height workspace layout and responsive panel regions | App-wide |
| `TopToolbar` | Global upload, undo/redo where applicable, compare, export, and status actions | Workspace |
| `UploadDropzone` | Drag/drop and file-picker entry | Workspace and empty state |
| `MediaLibraryPanel` | Shows media list, filters, metadata, selected item, previous/next navigation | Workspace |
| `MediaAssetCard` | Compact thumbnail, type, name, size, dimensions/duration, error badge | Media library |
| `PreviewStage` | Hosts selected image/video preview and edit overlay | Workspace |
| `ImagePreviewCanvas` | Image display, crop preview, comparison, annotation/watermark rendering | Image workflow |
| `VideoPreviewPlayer` | Video playback, current time, subtitle preview, trim markers | Video workflow |
| `EditorPanel` | Switches between image/video tool groups based on selected asset type | Workspace |
| `ImageToolTabs` | Crop, transform, adjust, annotate, watermark, background removal | Image workflow |
| `VideoToolTabs` | Trim, speed, subtitles, export options | Video workflow |
| `CropPresetControl` | Social crop presets and custom ratio controls | Image workflow |
| `AdjustmentControls` | Brightness, contrast, saturation sliders | Image workflow |
| `AnnotationToolbar` | Text, brush, rectangle, arrow, selection controls | Image workflow |
| `WatermarkControls` | Text/image watermark placement and opacity controls | Image workflow |
| `BackgroundRemovalPanel` | Starts local background removal and shows model/job progress | Image workflow |
| `TrimRangeControl` | Start/end inputs and visual trim range | Video workflow |
| `SpeedControl` | Speed preset and custom speed input | Video workflow |
| `SubtitleCueList` | Manual subtitle cue creation, validation, editing, deletion | Video workflow |
| `ExportPanel` | Output format, quality, resolution/size where feasible, export action | Workspace |
| `ProcessingJobToast` | Progress, cancel, retry, and failure reason for long-running jobs | App-wide |
| `EmptyState` | First-run upload prompt and filtered-empty guidance | Workspace |
| `ErrorState` | Unsupported format, metadata failure, processing failure, export failure | App-wide |
| `KeyboardShortcutLayer` | Previous/next, play/pause, undo/redo, reset, export shortcuts | Workspace |

## Frontend Architecture

- Framework conventions: React 19 function components, TypeScript, Vite app under `apps/web`.
- Route structure:
  - `/`: Media Workspace.
  - No additional v1 route unless a later source-of-truth update adds settings or help screens.
- Shared layout:
  - Desktop: three-region tool layout: left media library, center preview stage, right editor/export panel.
  - Tablet: media library collapses into a drawer; editor panel remains visible or tabbed below preview.
  - Mobile: segmented workflow tabs: Library, Preview, Edit, Export.
- Data fetching pattern:
  - No server fetching for user media in v1.
  - Local files enter through file input or drag/drop.
  - Object URLs must be created and revoked deliberately.
  - Browser storage may hold lightweight draft metadata/edit operations only when implementation documents behavior.
- State pattern:
  - Zustand stores for media library, selected asset, editor state, job state, UI layout state.
  - zundo for image edit history; limit history size to avoid memory growth.
  - Zod schemas for subtitle cues, export settings, draft state, worker messages, and media metadata boundaries.
- Form and validation pattern:
  - Use controlled inputs for compact tool controls where immediate preview matters.
  - Validate trim ranges, subtitle cue timing, output format, and numeric values before enabling export.
- Error and empty-state pattern:
  - Empty states should provide direct upload actions.
  - Error states must explain the failed operation and offer reset/retry where feasible.
  - Unsupported formats/codecs must be visible on the affected asset and in the preview area when selected.
- Worker interaction pattern:
  - UI dispatches typed jobs to Worker-facing APIs.
  - Job state updates flow back into `ExportJob` or background-removal job state.
  - UI must stay responsive during model/WASM loading and processing.

## Design System

- UI library: shadcn/ui components built on Radix primitives and Tailwind CSS.
- Icon library: lucide-react, imported icon-by-icon for tool buttons.
- Color tokens:
  - Background: neutral near-white and neutral dark variants for preview comfort.
  - Primary action: clear blue/cyan accent.
  - Success: green.
  - Warning: amber.
  - Error: red.
  - Selection/focus: blue/cyan ring with sufficient contrast.
  - Avoid a one-note single-hue palette; the editor should feel practical and focused.
- Typography:
  - System UI font stack.
  - No viewport-width-based font sizing.
  - Compact panel headings; reserve large type only for empty-state title.
  - Letter spacing stays normal.
- Spacing:
  - 4px base rhythm.
  - Compact controls at 32-40px height.
  - Stable panel padding: 12-16px.
- Radius:
  - 6px default.
  - 8px maximum for cards/modals unless a component requires otherwise.
- Breakpoints:
  - Desktop: three-pane layout at 1024px and above.
  - Tablet: collapsible library below 1024px.
  - Mobile: tabbed workflow below 720px.
- Stable dimensions:
  - Media thumbnails use fixed aspect ratio.
  - Toolbars use fixed-height rows.
  - Icon buttons use fixed square dimensions.
  - Preview stage uses responsive bounds and must not jump when controls change.
- Interaction:
  - Prefer icon buttons with tooltips for common tools: crop, rotate, flip, undo, redo, reset, download, play, pause, previous, next.
  - Use sliders or number inputs for numeric values.
  - Use segmented controls/tabs for mode switches.
  - Use menus/selects for output format and quality options.

## Desktop Workspace Layout

```text
┌──────────────────────────────────────────────────────────────┐
│ TopToolbar: upload, previous/next, undo/redo, compare, export │
├───────────────┬──────────────────────────────┬───────────────┤
│ Media Library │ Preview Stage                │ Editor Panel  │
│ filters/list  │ image canvas or video player │ tools/export  │
│ metadata      │ processing overlays          │ job status    │
└───────────────┴──────────────────────────────┴───────────────┘
```

- The preview stage is the visual center of the product.
- The media library and editor panel should be dense but not cramped.
- Do not place cards inside cards. Use panels, separators, tabs, drawers, and repeated media cards only where appropriate.

## Responsive Behavior

- Desktop:
  - Left library width: stable, roughly 260-320px.
  - Right editor width: stable, roughly 320-380px.
  - Center preview fills remaining space.
- Tablet:
  - Library can collapse to a drawer or compact rail.
  - Editor panel can remain side-by-side if width allows; otherwise move below preview.
- Mobile:
  - Bottom or top segmented tabs: Library, Preview, Edit, Export.
  - Preview remains inspectable and not hidden behind controls.
  - Text labels may wrap, but must not overflow buttons or panels.

## State Matrix

| Area | Empty | Loading/processing | Error | Success |
| --- | --- | --- | --- | --- |
| Upload | Dropzone invites file selection | Importing files and reading metadata | Some files unsupported or unreadable | Media appears in library |
| Media library | No assets or filtered-empty | Metadata or thumbnail generating | Asset-level error badge | Selected asset highlighted |
| Image editor | No image selected | Background removal/model loading/exporting | Operation failed with retry/reset | Preview updates and export enabled |
| Video editor | No video selected | Metadata loading, thumbnail generating, exporting | Invalid range, unsupported codec, export failed | Preview plays and export enabled |
| Export | Disabled until valid asset/settings | Progress with cancel when feasible | Failure reason plus retry/reset | Download action/result visible |

## Implementation Order

1. First MVP page shell: `/` workspace layout, upload dropzone, media library, preview placeholder, editor/export panel placeholders.
2. Media model and selection: local file import, metadata extraction, thumbnails, previous/next navigation, type filter, empty/error states.
3. Image core: preview, crop/rotate/flip/resize/adjust, undo/redo/reset, original comparison, image export.
4. Image annotations: text, brush, rectangle, arrow, watermark controls.
5. Image background removal: local model loading, processing state, result preview, failure handling.
6. Video core: video preview, metadata, trim start/end controls, speed controls, manual subtitle cue editor.
7. Video export: ffmpeg.wasm Worker path, progress, cancel/retry where feasible, output download.
8. Browser verification: responsive layout, keyboard shortcuts, no media upload network path, smoke export flows.

## Change Rule

- Update this document before implementing changes to routes, components, UI states, data dependencies, permissions, persistence, or interaction behavior.
- If implementation reveals a new backend/API/database/cloud requirement, pause frontend implementation and update the relevant source-of-truth document first.
- If a new UI library, canvas library, media library, or state pattern is needed, update `docs/architecture/TECH_STACK.md` first.

## Verification

- [ ] Type/build check once scripts exist.
- [ ] Browser verification for upload, select, preview, edit, and export flow.
- [ ] Responsive layout check for desktop, tablet, and mobile.
- [ ] Keyboard navigation check for upload focus, media switching, tool buttons, dialogs, and export.
- [ ] Canvas/video nonblank preview check.
- [ ] Privacy check that user media is not uploaded in v1.
