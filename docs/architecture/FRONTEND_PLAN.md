# FRONTEND_PLAN

## Document Status

- Project charter confirmed: Yes, `docs/project/PROJECT_CHARTER.md`.
- Tech stack confirmed: Yes, `docs/architecture/TECH_STACK.md`.
- User approved writing this document: Yes, approved in chat on 2026-06-22.
- Last reviewed: 2026-06-23.
- Current background processing checkpoint: Approved by user on 2026-06-23. Scope adds a local background processing center for generated-preview, encoding/export, and background-removal jobs; completed generated results are inserted into the media library as new session assets; new jobs use a launch animation that sends a task token into the queue.

## Product Tone

- Target user: Personal creators who want quick, private, low-friction image and short-video edits.
- Product posture: A focused editing workspace, not a landing page and not a full professional suite.
- Product audience fit: C-end creators should feel they are in a real media workstation, with the Stitch layout making the preview canvas, media library, and inspector obvious from the first frame.
- Visual density: Stitch-restored professional studio UI. Keep the main path clear through panel structure, but do not preserve a separate marketing or guided-intro layout above the workspace.
- First-screen signal: The upload/media workspace is the first screen. Do not show a marketing hero before the tool.
- Accessibility expectations: Keyboard-accessible upload, media switching, tool buttons, tabs, dialogs, sliders, and export actions; visible focus states; accessible names for icon buttons; no text trapped inside too-small controls.
- Language expectations: The web app supports English and Simplified Chinese in v1. It should choose the initial language from `navigator.language` when possible and provide an in-app language switcher that does not require reload.

## Design Read

- Surface type: Dense local-first media editing workspace, not a marketing landing page.
- Audience: Personal creators editing private images and short videos in the browser.
- Product tone: Professional Studio: calm, precise, dark, canvas-first, and task-focused.
- Reference signals: Google Stitch project `1201636135287513933`, the existing three-region studio shell, Material Symbols tool icons, dark media workstation conventions, and Clypra Studio's composition/video preview workbench inspected on 2026-06-23.
- Existing brand assets: Obscura wordmark in the top toolbar, a Canvas-drawn darkroom/aperture brand mark, cyan/green accent family, Material Symbols SVG React icon adapter, and the current localized English/Chinese message dictionaries.
- Quiet constraints: User media stays local; import and export each have one primary visible entry point; desktop stays dense but readable; mobile uses stacked workflow tabs; UI copy must localize; browser controls must not hide long-running media job states.
- One-sentence direction: Build a real local media workstation whose first frame makes upload, preview, editing, and export immediately inspectable without adding marketing chrome.

## Design Dials

| Dial             | Value | Rationale                                                                                             |
| ---------------- | ----- | ----------------------------------------------------------------------------------------------------- |
| Design variance  | 5     | Stay close to the Stitch visual baseline while allowing project-specific tool ergonomics.             |
| Motion intensity | 3     | Use restrained feedback for active states and processing without distracting from the preview canvas. |
| Visual density   | 7     | Keep the library, preview, editor, and export controls visible on desktop for repeated editing work.  |

Rules:

- Do not apply landing-page taste rules blindly to this product UI.
- Prioritize scannable density, efficient controls, clear state, restrained motion, and mature design-system patterns.
- Document any future marketing or brand surface separately from the editing workspace before implementation.

## Product MVP UI Quality Gate

- MVP UI quality standard: The first MVP may be narrow, but the visible workspace must feel like a coherent media tool, with real controls, stable layout, complete states, and localized copy.
- First user loop: Import local media, select an asset, inspect the preview, apply an edit, understand processing state, and export/download without uploading private media.
- Design system foundation: Use the documented dark studio theme, one Material Symbols icon family through the local adapter, shadcn/Radix primitives where available, 8px-or-less working radii, and stable panel/control dimensions.
- Layout contract: Desktop uses fixed library, fluid preview, and fixed inspector/export rail; empty state hides the inspector rail; mobile uses Library, Preview, Edit, and Export tabs instead of squeezing desktop panels.
- Interaction completeness: Upload, selection, previous/next, undo/redo, compare, zoom, edit controls, export, failure, cancellation where feasible, disabled states, focus states, and keyboard/touch paths must be represented.
- Responsive requirement: Desktop and mobile must both be checked for non-overlap, readable labels, visible export action, and inspectable media preview.
- Accessibility requirement: Icon-only controls require accessible names and tooltips where helpful; focus rings, labels, contrast, touch targets, and keyboard navigation must remain usable.
- Anti-slop constraints: No generic AI gradient/glow, fake preview rectangles, card-in-card clutter, duplicate CTAs, placeholder-as-label forms, invisible focus states, clipped text, or decorative motion that competes with the editing task.
- Browser UI quality verification: Browser evidence must cover upload/empty state, populated desktop workspace, mobile tabs, selected preview, editor controls, export state, and at least one failure or disabled path.

## Page Map

| Route or screen     | Goal                                                                                | Primary action                                                                                                       | Data needed                                                                                          | States                                                                                                                              |
| ------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/` Media Workspace | Upload, preview, edit, and export selected media through a guided consumer flow     | Add media, select asset, edit, export                                                                                | Local files, object URLs, media metadata, edit states, export jobs, active language                  | Empty, drag-over, importing, selected, unsupported, editing, processing, failed, exported                                           |
| Media Library Panel | Manage uploaded images/videos in the current session                                | Select previous/next asset, filter by type, remove asset                                                             | MediaAsset list, selected asset id, filter mode                                                      | Empty, populated, filtered-empty, metadata-loading, item-error                                                                      |
| Image Editor Panel  | Apply image-specific operations                                                     | Crop rectangle, rotate, flip, resize, beautify/filter, annotate, watermark layer, remove background, undo/redo/reset | ImageEditState, operation history, crop rectangle, layer objects, background-removal job             | Clean, dirty, comparing, crop-editing, layer-selected, background-loading, background-processing, failed, export-ready              |
| Video Editor Panel  | Apply single-video operations                                                       | Scrub preview, set trim handles, reset values, adjust speed, add subtitle cue, apply derived preview, export         | VideoEditState, duration, current time, loop state, thumbnail frames, subtitle cues, export settings | Metadata-loading, ready, timeline-editing, invalid-range, subtitle-editing, processing, derived-preview-ready, failed, export-ready |
| Export Panel        | Save or download the current edited asset using the editor-selected output settings | Start export, inspect progress/failure, download result                                                              | Selected asset, edit state, current editor format/quality settings, ExportJob                        | Disabled, unsupported-format, ready, loading-engine, processing, completed, canceled, failed                                        |
| Processing Center   | Keep local long-running work visible across media switching                         | Inspect current-session queued/running/completed jobs, cancel, retry, open generated result, clear record            | BackgroundJob list, launch animation state, generated result asset ids                               | Hidden, active, expanded, queued, loading, processing, completed, canceled, failed                                                  |
| Generated Preview   | Make rendered image/video outputs explicit and reusable                             | Generate preview, inspect freshness, export matching preview                                                         | MediaAsset, ImageEditState or VideoEditState, generated preview fingerprint                          | Live preview, generating, generated-preview-ready, stale, failed                                                                    |

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
  - Image crop-editing state with visible crop rectangle and apply/cancel affordances.
  - Image layer-selected state with visible transform handles for annotation and watermark objects.
  - Image background-removal loading/processing/failed states.
  - Video metadata-loading, timeline-editing, invalid trim range, resettable control, subtitle editing, derived-preview-ready, and processing states.
  - Export disabled, ready, processing, completed, canceled, and failed states.
- Interaction model:
  - Desktop uses the Stitch workstation structure directly: media library, preview canvas, and inspector/export rail visible together.
  - The visible top bar is utility chrome only: left Obscura Canvas darkroom/aperture mark plus wordmark, a concise local-only advantage tag, centered previous/next plus undo/redo controls, and right compact language switching. In Simplified Chinese the redo action is labeled `恢复` to avoid confusion with `恢复原图`; English keeps the standard `Redo`. Do not show explanatory title/subtitle copy in the top bar.
  - Empty workspace follows the Stitch empty-state screen: the main preview canvas becomes a large dashed upload dropzone with one Import Media action, no template exploration action, short capability notes, and localized copy.
  - After media exists, upload/import has one visible entry point in the media library panel. Do not duplicate upload actions in the top toolbar.
  - Export has one visible action in the export panel. The export action should prepare the local result and immediately start the browser save/download flow when possible.
  - Compare mode lives in the preview viewport toolbar only. Do not duplicate compare in the top toolbar.
  - Image annotation and watermark editing use an object-layer interaction model: selected objects show a visible transform rectangle and handles; dragging an annotation must not pan the underlying preview.
  - Image crop uses a visible crop selection rectangle with handles. Presets set the rectangle ratio, while custom lets users drag or enter exact width/height ratio before applying.
  - Preview background has a localized `transparent`/`black` switch. Transparent keeps the checkerboard canvas used for alpha inspection. Black paints the preview stage background black for image and video inspection, but it is preview-only unless a later source-of-truth update explicitly adds background baking into export. The video element itself must not add a default black background; black sidebars should only come from the source pixels or the explicit black preview background mode.
  - Image preview owns the viewport toolbar for zoom, compare, and fullscreen. Video preview does not render the image viewport toolbar; it borrows the Clypra workbench pattern where it fits the product: a compact preview header with media dimensions and format state, a main preview surface, and bottom playback controls fixed to the preview frame with play/pause, reset time, scrubber, timestamp, loop, and timeline affordances.
  - Video trim and format conversion are explicit apply actions that create a derived local preview asset. Changing a select alone must not silently overwrite the source preview.
  - Generated preview, background removal, and encoding/export operations submit local background jobs. A submitted job captures the current asset id, edit/export settings, and generated-preview fingerprint at launch, then continues while the user switches media or keeps editing.
  - When a background job completes with a generated blob, the app inserts the result as a new media-library asset, placed immediately after the source asset when the source still exists. Do not automatically steal selection unless a later source-of-truth update explicitly changes this behavior.
  - Selecting a different media asset starts a fresh editor draft for that asset. Image history/export settings and video trim/speed/subtitles/format are rebuilt from the selected asset's source metadata so draft edits do not leak when the user switches away and back.
  - The top toolbar includes a compact Processing Center only when current-session local jobs exist. Hover/focus opens a job list on desktop; mobile uses click/focus behavior suitable for a bottom-sheet-like compact panel. The list keeps each submitted job as its own entry instead of replacing earlier jobs for the same asset.
  - Starting a background job gives immediate task-submit feedback: a small task token animates from the triggering button toward the Processing Center icon, then the queue badge pulses. In reduced-motion mode, skip the flying token and use a badge bump plus an `aria-live` message.
  - Video editing controls with reversible numeric state, including trim, speed, subtitle timing, and format draft, provide local reset buttons that restore original/default values.
  - The inspector/editor/export rail is hidden while there is no uploaded media and appears only after a media asset exists.
  - The Import, Edit, Export flow may remain in semantic or mobile navigation, but it must not appear as a large visible header block on desktop.
  - Advanced controls should be grouped into short sections with visible labels and helper copy.
  - Mobile should show the same flow as stacked tabs instead of a cramped desktop panel.
- Localization:
  - All user-facing UI strings in the first MVP screen should come from an English/Chinese message dictionary.
  - Initial language should be detected from the browser language with English fallback.
  - Manual language switching should be available from the top toolbar as a compact icon-plus-select control.
  - Export filenames may remain ASCII-safe for now, but visible labels and status messages should localize.
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

| Component                    | Purpose                                                                                                    | Owner layer or folder                                 | Reuse scope               | State owned                                                                    |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | ------------------------- | ------------------------------------------------------------------------------ |
| `AppShell` / `App`           | Owns full-height workspace layout and responsive panel regions                                             | `apps/web/src/app`                                    | App-wide                  | Local UI composition state only                                                |
| `TopToolbar`                 | Brand, local-only advantage tag, undo/redo where applicable, asset navigation, and language switching      | `apps/web/src/components/studio`                      | Workspace                 | Receives selected asset and language state from app/store                      |
| `UploadDropzone`             | Drag/drop and file-picker entry                                                                            | `apps/web/src/components/preview`                     | Workspace and empty state | File input is owned by app composition                                         |
| `MediaLibraryPanel`          | Shows media list, filters, metadata, selected item, previous/next navigation                               | `apps/web/src/components/media-library`               | Workspace                 | Reads media store state through props/selectors                                |
| `MediaAssetCard`             | Compact thumbnail, type, name, size, dimensions/duration, error badge                                      | `apps/web/src/components/media-library`               | Media library             | Stateless display plus selected/disabled props                                 |
| `PreviewStage`               | Hosts selected image/video preview and edit overlay                                                        | `apps/web/src/components/preview`                     | Workspace                 | Owns preview-only controls through props from app                              |
| `ImagePreviewCanvas`         | Image display, crop preview, comparison, annotation/watermark rendering                                    | `apps/web/src/components/preview`                     | Image workflow            | Receives edit state; does not own history                                      |
| `ImageLayerCanvas`           | Konva-backed selectable/draggable annotation and watermark layer surface                                   | `apps/web/src/components/preview`                     | Image workflow            | Receives layer state and selected layer id; commits transforms through actions |
| `ImageCropOverlay`           | Cropper-backed crop rectangle and custom ratio interaction                                                 | `apps/web/src/components/preview` or `editor`         | Image workflow            | Local crop drag state; committed crop rectangle lives in image edit state      |
| `PreviewViewportToolbar`     | Zoom out/in, fullscreen/theater toggle, and before/after compare mode                                      | `apps/web/src/components/preview`                     | Workspace                 | Preview zoom/compare/fullscreen state is owned by app composition              |
| `VideoPreviewPlayer`         | Video playback, current time, subtitle preview, trim markers                                               | `apps/web/src/components/preview`                     | Video workflow            | Local playback state; committed video edit state remains in store/core         |
| `VideoPreviewWorkbench`      | Clypra-inspired video preview header, fit/zoom metadata, playback controls, scrubber, loop, and reset time | `apps/web/src/components/preview`                     | Video workflow            | Owns transient playback UI and dispatches edit/reset actions                   |
| `EditorPanel` / `EditorRail` | Switches between image/video tool groups based on selected asset type                                      | `apps/web/src/components/editor`                      | Workspace                 | Receives selected asset and edit state                                         |
| `ImageToolTabs`              | Crop, transform, adjust, annotate, watermark, background removal                                           | `apps/web/src/components/editor`                      | Image workflow            | Tab/expanded-section state may be local; image history stays in store/core     |
| `VideoToolTabs`              | Trim, speed, subtitles, export options                                                                     | `apps/web/src/components/editor`                      | Video workflow            | Future video edit draft state should live in store/core                        |
| `CropPresetControl`          | Social crop presets and custom ratio controls                                                              | `apps/web/src/components/editor`                      | Image workflow            | Stateless action dispatch                                                      |
| `BeautifyControls`           | Brightness, contrast, saturation sliders plus filter presets and filter strength                           | `apps/web/src/components/editor`                      | Image workflow            | Stateless action dispatch                                                      |
| `AnnotationToolbar`          | Text, brush, rectangle, arrow, selection controls                                                          | `apps/web/src/components/editor`                      | Image workflow            | Future annotation selection may be local until persisted to image edit state   |
| `WatermarkControls`          | Text/image watermark placement and opacity controls                                                        | `apps/web/src/components/editor`                      | Image workflow            | Future draft form state local; committed watermark state in store/core         |
| `BackgroundRemovalPanel`     | Starts local background removal and shows model/job progress                                               | `apps/web/src/components/editor`                      | Image workflow            | Future job state in store/worker boundary                                      |
| `TrimTimelineControl`        | Thumbnail strip, playhead, draggable trim handles, exact inputs, reset, and apply trim                     | `apps/web/src/components/editor`                      | Video workflow            | Validated trim state in store/core; drag draft can be local                    |
| `SpeedControl`               | Speed preset/custom input with reset to original                                                           | `apps/web/src/components/editor`                      | Video workflow            | Validated speed state in store/core                                            |
| `SubtitleTimeline`           | Manual subtitle cue creation, row editing, draggable cue blocks, validation, deletion, reset timing        | `apps/web/src/components/editor`                      | Video workflow            | Cue state in store/core with local row editing                                 |
| `VideoFormatControl`         | Draft output format selection, reset to source/default, and apply conversion to derived preview            | `apps/web/src/components/editor` or `export`          | Video workflow            | Format draft in video state; conversion job in job store                       |
| `ExportPanel`                | Output format, quality, resolution/size where feasible, capability reasons, and single export/save action  | `apps/web/src/components/export`                      | Workspace                 | Export settings/job state in store/worker boundary                             |
| `ProcessingCenter`           | Toolbar queue icon, active job count, hover/focus job popover, result-open/retry/cancel actions            | `apps/web/src/components/studio`                      | App-wide                  | Background job state in store/worker boundary                                  |
| `TaskLaunchAnimation`        | Visual task token that moves from a generating/export button into the Processing Center queue              | `apps/web/src/components/studio`                      | App-wide                  | Ephemeral launch marker state only                                             |
| `ProcessingJobToast`         | Sonner-backed bottom-right success, cancellation, and failure feedback for background jobs                 | `apps/web/src/components/studio`                      | App-wide                  | Mirrors job state; does not replace the Processing Center                      |
| `EmptyState`                 | First-run upload prompt and filtered-empty guidance                                                        | `apps/web/src/components/preview` and `media-library` | Workspace                 | Stateless display and action callbacks                                         |
| `ErrorState`                 | Unsupported format, metadata failure, processing failure, export failure                                   | Relevant feature component folder                     | App-wide                  | Error source stays with asset/job state                                        |
| `KeyboardShortcutLayer`      | Previous/next, play/pause, undo/redo, reset, export shortcuts                                              | `apps/web/src/components/studio` or `app`             | Workspace                 | Dispatches to app/store; no durable state                                      |

## Frontend Source Tree

Approved current structure:

```text
apps/web/src/
  app/
  components/
    editor/
    export/
    media-library/
    preview/
    studio/
  config/
  i18n/
    messages/
  icons/
  stores/
  utils/
  App.tsx
  main.tsx
  styles.css
```

Rules:

- `apps/web/src/App.tsx` is a compatibility export and should stay thin.
- `apps/web/src/app/App.tsx` composes the workspace and may own cross-region UI state such as language, mobile tab, compare mode, fullscreen, zoom, file input, and top-level event handlers.
- New top-level frontend folders require an update to this document before implementation.
- New feature folders under `components/` must map to a user-facing region or workflow, not to a vague technical bucket.

## Frontend File Organization

- `apps/web/src/app`: Thin application composition. `App.tsx` should orchestrate workspace regions and avoid owning detailed panel markup, copy dictionaries, export helpers, icon imports, or store definitions.
- `apps/web/src/components/studio`: Shared studio UI primitives and region chrome such as `TopToolbar`, `MobileTabs`, `PanelHeader`, `StudioButton`, and `StudioIconButton`.
- `apps/web/src/components/media-library`: Media library panel, asset cards, filters, empty states, and asset-level status UI.
- `apps/web/src/components/preview`: Preview stage, empty upload state, selected image/video preview, image panes, and preview toolbar.
- `apps/web/src/components/editor`: Editor rail, image tool groups, crop preset grid, beautify/filter controls, annotation/watermark controls, video timeline controls, resettable video controls, and subtitle timeline rows.
- `apps/web/src/components/export`: Export panel, export status, and job message UI.
- `apps/web/src/config`: Static UI, media, workspace, and design-system configuration such as supported filters, tab order, icon sizes, export choices, format capability metadata, quality ranges, and crop preset metadata.
- `apps/web/src/i18n`: Language types, browser-language detection, message dictionaries, and localized label helpers.
- `apps/web/src/icons`: Studio icon adapter for the approved icon family. Components should import icons from this adapter rather than directly from the icon package.
- `apps/web/src/stores`: Zustand stores and state selectors.
- `apps/web/src/utils`: Browser, image export/encoder adapters, media asset, video export/timeline helpers, formatting, and DOM utility helpers that are not React components.
- Keep files focused by ownership. A region component may compose smaller local components, but it should not define global copy, media store state, or browser export logic inline.

## File Boundary Contract

| Concern                         | Approved location                                                      | Notes                                                                                                     |
| ------------------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| App boot entry                  | `apps/web/src/main.tsx`                                                | Mounts React and global providers only.                                                                   |
| Compatibility app export        | `apps/web/src/App.tsx`                                                 | Re-export only; do not add UI logic here.                                                                 |
| App shell and route composition | `apps/web/src/app`                                                     | Orchestrates regions, cross-region state, and route-level event handlers.                                 |
| Shared studio primitives        | `apps/web/src/components/studio`                                       | Toolbar, mobile tabs, panel headers, shared studio buttons, and workspace chrome.                         |
| Business/domain components      | `apps/web/src/components/media-library`, `preview`, `editor`, `export` | Components stay near the workflow they serve.                                                             |
| Feature or workflow components  | Same workflow-specific component folders                               | Split by media library, preview, editor, export, or future approved feature.                              |
| Data/API clients or mocks       | `apps/web/src/utils` or future approved `clients` folder               | Browser adapters and export helpers live in utils until complexity warrants a documented folder.          |
| Local or global stores          | `apps/web/src/stores`                                                  | Zustand stores, selectors, and durable app state.                                                         |
| Config, constants, tokens       | `apps/web/src/config`                                                  | Supported filters, tab order, icon sizes, layout widths, crop presets, and export option metadata.        |
| i18n messages                   | `apps/web/src/i18n`                                                    | Language types, detection, dictionaries, and localized label helpers.                                     |
| Icons                           | `apps/web/src/icons`                                                   | Local adapter for Material Symbols; components do not import directly from the icon package.              |
| Assets/media                    | Future approved `apps/web/src/assets`                                  | Add only when local static assets are needed and documented here.                                         |
| Utilities and browser adapters  | `apps/web/src/utils`                                                   | Object URL, metadata, image/video export adapters, format capability checks, formatting, and DOM helpers. |
| Global styles                   | `apps/web/src/styles.css`                                              | Theme tokens, layout classes, and shared control styling.                                                 |

Rules:

- `App.tsx` and route/app composition files compose screens; they must not hold unrelated UI, config, messages, state stores, icons, mock data, and utilities.
- A catch-all `utils.ts`, `config.ts`, or flat `components/` dump is not allowed once responsibilities are distinct.
- Any new top-level frontend folder must be added here before implementation.

## Component Split Rules

- Split by user-facing concept when a file begins mixing library, preview, editor, export, or processing responsibilities.
- Split by interaction state when loading, empty, error, success, disabled, selected, editing, processing, or failure markup becomes large enough to obscure the main flow.
- Split by data or domain boundary when image edit history, video edit settings, export jobs, media metadata, or localization needs separate validation or ownership.
- Split interactive canvas code when event handling, layer transforms, crop selection, playback controls, or timeline drag math begins to obscure preview composition.
- Split repeated patterns after they appear in two regions with the same behavior, not merely the same visual shape.
- Keep local-only pieces inline when they are short, single-use, and have no independent state or accessibility contract.
- Extract custom hooks when DOM/browser APIs, object URL lifecycle, keyboard shortcuts, worker messages, or measurement logic would otherwise dominate a component.
- Promote state to a store when multiple regions need it, when it must survive component unmounts, or when it represents media/edit/job state rather than temporary UI affordance.

## Import Boundaries

- Route/page/app composition may import workflow components, config, i18n, stores, icons, and utilities.
- Shared studio UI may import config tokens and icon adapters, but should not import media-core editing logic or workflow-specific stores directly.
- Feature/domain modules may import shared studio components, config, i18n types/messages, stores/selectors, utilities, and package APIs from `@obscura/*`.
- Stores may import pure logic/types from workspace packages and utilities, but should not import React components.
- i18n, config, and icons should not import feature components or stores.
- Forbidden imports: UI components importing from sibling feature folders just to reach hidden helpers; direct icon-package imports outside `icons`; workflow logic hidden in `styles.css`; store definitions inside route or component files.
- Public entry files required for now: `apps/web/src/App.tsx`, `apps/web/src/app/App.tsx`, `apps/web/src/main.tsx`, and package entry points under `packages/*` when shared logic changes.

## Frontend Architecture

- Framework conventions: React 19 function components, TypeScript, Vite app under `apps/web`.
- Route structure:
  - `/`: Media Workspace.
  - No additional v1 route unless a later source-of-truth update adds settings or help screens.
- Shared layout:
  - Desktop: Stitch-restored professional studio layout with a compact top app bar, fixed-width media library, fluid preview stage, and fixed-width editor/export rail. No standalone intro/hero region or explanatory title/subtitle copy may sit above the workspace.
  - Empty desktop state: fixed-width media library plus a full remaining preview/upload stage. The inspector/export rail is not rendered until there is uploaded media.
  - Tablet: media library collapses into a compact rail or drawer; editor and export controls can stack below the preview if the viewport cannot preserve readable side panels.
  - Mobile: tabbed workflow with Library, Preview, Edit, and Export views; Preview stays inspectable and tool controls behave like dark studio drawers rather than a cramped desktop layout.
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
  - Reset buttons restore the documented default/original values for video trim, speed, time, loop, subtitle cue timing, and format draft. Reset should be local, immediate, and undoable where it changes durable edit state.
- Error and empty-state pattern:
  - Preview empty state must match the Stitch reference empty workspace composition: a centered dashed dropzone panel, import-file icon with a small add badge, `Start Your Creation`, helper copy, a single `Import Media` primary action, and supported-format capability tags. Do not render the `Explore Templates` action in v1, and do not use the older Import/Edit/Export process cards for this state.
  - Empty states should provide direct upload actions, but the persistent upload action belongs to the media library.
  - Error states must explain the failed operation and offer reset/retry where feasible.
  - Unsupported formats/codecs must be visible on the affected asset and in the preview area when selected.
- Worker interaction pattern:
  - UI dispatches typed jobs to Worker-facing APIs.
  - Job state updates flow back into `ExportJob` or background-removal job state.
  - UI must stay responsive during model/WASM loading and processing.
  - Derived video results from trim/speed/format/subtitle work become selectable local assets or preview results with object URLs that are revoked when replaced or removed.

## Design System

- UI library: shadcn/ui components built on Radix primitives and Tailwind CSS.
- Icon library: Material Symbols SVG React through a local studio icon adapter. Keep one icon family across the app. Use outlined icons for default tools, filled or heavier symbols for selected and active states, and standard sizes of 16px, 20px, 24px, and 48px.
- Stitch reference: Google Stitch project `1201636135287513933` is the current visual baseline for the workspace. The implementation should preserve the exposed studio structure as directly as possible using the available Stitch design system data while expressing the product as Obscura.
- Clypra reference: the video preview workbench may borrow a compact composition header, fit/zoom controls, quick export/status buttons, playback strip, reset-time button, scrubber, loop toggle, and right-side contextual inspector pattern. Do not borrow its text-effect templates, AI/account controls, or keyframe-heavy scope.
- Style direction: Professional Studio. The interface should feel like a precise local editing suite: dark, calm, technically capable, and focused on the media canvas. It should avoid a marketing hero, bubbly consumer styling, generic white cards, and decorative dashboard chrome.
- Visual dials for the current redesign: design variance 5, motion intensity 3, visual density 7. This favors a dense but readable tool workspace with restrained motion and progressive disclosure.
- Color tokens:
  - Background: `#0f1419` for the app shell and `#0a0f14` or `#0A0A0A` for the lowest canvas layer.
  - Panel surface: `#1E1E1E` for side panels, with `#171c22`, `#1b2026`, and `#262a30` for tonal hierarchy.
  - Primary action and active state: cyan/blue, using `#00a3ff`, `#98cbff`, and `#00D1FF` consistently as the single blue accent family.
  - Text: `#dfe3ea` for primary text and `#bec7d4` for secondary text.
  - Border and separators: `#3f4852` for low-emphasis structure and `#88919d` only where stronger separation is needed.
  - Success: `#10B981`; error: `#EF4444` or the documented accessible error tokens.
  - Avoid pure black, pure white surfaces, oversaturated neon glows, and sudden light-mode sections inside the dark workspace.
- Typography:
  - Prefer Geist for display, panel titles, and tool group headings when available; fallback to system UI.
  - Inter may remain the dense body/control workhorse because the Stitch system and current tech direction use it for legibility at small sizes.
  - JetBrains Mono is used for metadata, dimensions, file sizes, timestamps, and numeric tool values where feasible.
  - No viewport-width-based font sizing.
  - Compact panel headings; reserve large type only for empty-state title.
  - Use slight negative tracking for display text and modest positive tracking only for compact utility labels.
- Spacing:
  - 4px base rhythm.
  - Compact controls at 32-40px height, with 44px touch targets for key actions and mobile controls.
  - Stable panel padding: 12-16px.
  - Panel library width should target 280-320px; editor/export rail should target 340-380px.
- Radius:
  - 8px default for panels, media assets, inputs, and buttons.
  - 4px may be used for dense hover highlights inside panels.
  - Larger radii should be reserved for modals or mobile drawers only when a component requires it.
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
  - Follow the `design-taste-frontend` constraints where they fit a dense product UI: one design system, one icon family, one dark theme, one accent family, consistent radius, readable controls, full empty/loading/error/disabled states, no duplicate CTA intent, and explicit mobile collapse.
  - Prefer icon buttons with tooltips for common tools: crop, rotate, flip, undo, redo, reset, download, play, pause, previous, next.
  - Undo/redo are global workspace controls in the top app bar when an image is selected, while the right rail keeps the detailed image tool form.
  - The top app bar must not contain the primary Add Media action. The persistent Add Media action lives in the media library header. The preview empty state may keep an Import Media first-run guide action.
  - Preview stage controls include zoom out, zoom in, fullscreen/theater, and icon-only compare. Do not include a separate Fit to Screen button unless it is wired to a meaningful canvas reset behavior.
  - Top app bar branding shows the product title only; do not render a secondary "image editing details" subtitle. The language control shows the language icon and select value only; do not render a separate "Language" text label.
  - Selected preview stage uses one visually dominant curtain/checkerboard canvas background. Avoid stacked checkerboard rectangles or redundant bordered inner canvases that make the stage look like multiple nested frames. Media is centered and supports wheel zoom, trackpad pinch zoom where the browser exposes it through wheel gestures, and pointer-drag panning. Stage-level previous/next edge buttons are not rendered; asset switching stays in the top app bar.
  - On import, image preview enters an automatic fit-to-canvas mode based on the source media dimensions and the current preview stage bounds. The full source image must be visible for the original/free aspect state without requiring user zoom or pan.
  - Crop aspect switching must calculate a centered crop viewport that fits inside the available preview stage width and height, including space reserved for the bottom preview toolbar. Tall ratios such as 9:16 must not overflow upward or downward by default.
  - Preview metadata includes a compact info icon. Hover and keyboard focus reveal a local-only metadata popover with full media name, size, original dimensions when available, MIME/format, and video duration when available. Do not also show file size as separate header text, because that duplicates the info popover.
  - Compare mode shows original and edited image previews side by side instead of only toggling between states.
  - Upload and export must each have only one visible primary entry point to avoid duplicate CTA intent.
  - Media library metadata should show meaningful session information only. Do not render static labels such as "privacy status" when they do not represent a changing state or actionable control.
  - Preview toolbar buttons must remain clickable and must not be swallowed by stage pan/drag handlers. Dragging starts only from the canvas surface, not from toolbar or metadata controls.
  - Use themed sliders or number inputs for numeric values. Range controls should visually match the dark studio theme globally instead of using browser-default styling.
  - Use segmented controls/tabs for mode switches.
  - Crop aspect selection uses the visual preset cards only; do not duplicate the same control as both a select and cards in the inspector. Changing crop aspect must keep the preview centered by resetting or recalculating pan around the current media.
  - Crop custom mode shows a direct crop rectangle instead of a passive preset. Apply commits the rectangle to state; cancel exits crop mode without changing export output.
  - Annotation and watermark tools use select/move/draw modes. Pointer events over selected objects transform the layer; pointer events over empty preview canvas pan the preview only in view mode.
  - Watermarks are layers. Text and image watermarks can be moved, transformed, hidden, deleted, and exported through the same layer renderer as annotations.
  - Beautify replaces the older "adjustments" naming in user-facing UI. Basic adjustment sliders remain, and filter presets are additive local transforms with a visible strength control.
  - The right inspector groups tools into media-type-aware tabs. Image tabs include transform, beautify, layers, and background. Video tabs include trim, speed, subtitles, and format. The tab strip supports arrow-button scrolling and native horizontal gesture scrolling.
  - Video preview uses a workbench layout: preview metadata/fit controls above or near the video, the video surface in the center, and playback controls below it with play/pause, reset time, scrubber, timestamp, loop, and thumbnail timeline.
  - Video trim uses draggable handles over thumbnail frames and an Apply button. Applying trim queues a background preview/export result; the original source preview remains available and selected.
  - Video format changes use a draft selection plus Apply conversion. Applying conversion queues a background result instead of silently changing the source preview output.
  - Image and video previews use two layers of feedback. Live preview responds immediately to reversible edit parameters, while Generate Preview creates a local derived Blob that represents the renderable output. The generated preview records a fingerprint of the edit/export parameters that produced it, is inserted into the media library as a generated asset, and must not replace the source asset's preview or operation-bar badges. Background generation progress belongs in the Processing Center rather than the source preview operation bar.
  - The video source operation bar omits static "source preview" copy. Its compact badges describe the source/realtime preview, such as source container format and current playback speed, and must not mirror pending encoded output targets such as a selected MOV/WebM conversion.
  - Generated previews become stale when crop/transform/adjust/layer/background-removal output, trim, speed, subtitle cues, format, quality, or other export-affecting settings change. Stale generated previews must not be presented as current output; export may still reuse a matching generated Blob while the media library result remains a separate asset.
  - Resetting edit parameters updates live preview immediately and invalidates or clears any generated preview whose fingerprint no longer matches the reset state.
  - Export may reuse a generated preview Blob only when its fingerprint matches the current asset, edit state, and export settings. If it does not match, export must generate a fresh result.
  - Video subtitles appear both as cue rows and as draggable blocks on the subtitle timeline. Manual text entry remains v1 scope; AI subtitles remain out of scope.
  - Image and video format conversion live in the editor rail, not the bottom export panel. Image format controls support PNG, JPEG, WebP, AVIF, BMP, GIF, and TIFF with browser/encoder capability states; the selected format defaults from the current media type where possible. Video format controls support common ffmpeg.wasm container targets that are practical for v1, starting with MP4 and WebM and including MOV, MKV, and AVI with clear preview/browser-compatibility copy when needed.
  - Quality controls are shown only when they affect the current format. For images, JPEG/WebP/AVIF expose a numeric quality control; PNG/BMP/GIF/TIFF hide quality. Video quality remains deferred to future named presets instead of a misleading bottom-panel number.
  - Use text labels beside unfamiliar icons for consumer-facing clarity.
  - Show visible status for export preparation and other asynchronous work.
  - The export panel does not duplicate editor format or quality controls. It summarizes the current target format and is responsible for export, progress, errors, retry/download, and save handoff.
  - The export panel must keep the export button fully visible in the inspector rail; dense editor content scrolls independently above it.
  - Use tactile active states and restrained transform/opacity transitions only. Do not add scroll hijacks, decorative marquees, custom cursors, or unmotivated motion to the editing workspace.
  - Selection uses a ghost border in the blue accent family without heavy drop shadows.

## Desktop Workspace Layout

```text
┌────────────────────────────────────────────────────────────────────┐
│ TopToolbar: brand+local tag | previous/next+undo/redo | language │
├────────────────┬─────────────────────────────────┬─────────────────┤
│ Media Library  │ Preview Stage                   │ Inspector Rail  │
│ filters/list   │ image canvas or video player    │ tools + export  │
│ metadata       │ comparison and processing state  │ job status      │
└────────────────┴─────────────────────────────────┴─────────────────┘
```

- The preview stage is the visual center of the product.
- The preview stage owns viewport tools for zoom, fullscreen/theater, side-by-side comparison, pointer panning, and local metadata inspection.
- The desktop layout follows a fixed-fluid-fixed model: stable media library, flexible canvas, stable inspector/export rail.
- The media library and editor panel should be dense but not cramped.
- The upload/empty state should live inside the actual workspace, not as a marketing landing page or oversized guided intro above it.
- The privacy/local-only promise should be visible as a concise tag beside the wordmark without becoming a decorative badge wall or competing with primary edit/export actions.
- Do not place cards inside cards. Use panels, separators, tabs, drawers, and repeated media cards only where appropriate.

## Responsive Behavior

- Desktop:
  - Left library width: stable, roughly 280-320px.
  - Right inspector/export rail width: stable, roughly 340-380px.
  - Center preview fills remaining space.
  - The full shell should use `min-height: 100dvh` and avoid layout jumps when tools expand.
- Tablet:
  - Library can collapse to a drawer or compact rail.
  - Editor panel can remain side-by-side if width allows; otherwise move below preview.
- Mobile:
  - Bottom or top segmented tabs: Library, Preview, Edit, Export.
  - Preview remains inspectable and not hidden behind controls.
  - Text labels may wrap, but must not overflow buttons or panels.

## State Matrix

| Area          | Empty                               | Loading/processing                                | Error                                           | Success                            |
| ------------- | ----------------------------------- | ------------------------------------------------- | ----------------------------------------------- | ---------------------------------- |
| Upload        | Dropzone invites file selection     | Importing files and reading metadata              | Some files unsupported or unreadable            | Media appears in library           |
| Media library | No assets or filtered-empty         | Metadata or thumbnail generating                  | Asset-level error badge                         | Selected asset highlighted         |
| Image editor  | No image selected                   | Background removal/model loading/exporting        | Operation failed with retry/reset               | Preview updates and export enabled |
| Video editor  | No video selected                   | Metadata loading, thumbnail generating, exporting | Invalid range, unsupported codec, export failed | Preview plays and export enabled   |
| Export        | Disabled until valid asset/settings | Progress with cancel when feasible                | Failure reason plus retry/reset                 | Download action/result visible     |

## State And Interaction Contract

| State or interaction | Pattern                                                                                                          | Components affected                        | Notes                                                                                                                                                                                          |
| -------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Loading              | Layout-matched placeholders, metadata loading rows, or progress blocks instead of generic full-screen spinners   | Media library, preview, editor, export     | WASM/model loads must show readable progress where feasible.                                                                                                                                   |
| Empty                | A direct next action inside the real workspace                                                                   | Preview, media library                     | First-run empty state uses one Import Media action and format capability tags.                                                                                                                 |
| Error                | Contextual error copy plus retry/reset/remove where feasible                                                     | Asset cards, preview, editor, export       | Unsupported files are asset-level and preview-visible when selected.                                                                                                                           |
| Success              | The edited preview/export-ready state is visible without celebratory overlay clutter                             | Preview, editor, export                    | Downloads should start directly when browser behavior allows.                                                                                                                                  |
| Disabled             | Disabled controls remain visible with understandable labels or helper text                                       | Editor controls, export action, navigation | Export disabled state must explain missing asset/settings when useful.                                                                                                                         |
| Validating or saving | Inline validation for trim, subtitles, numeric values, and export settings                                       | Editor, export                             | Use Zod or core validation at boundaries.                                                                                                                                                      |
| Resetting            | Small reset actions restore original/default values without destructive dialogs                                  | Video editor, image beautify/filter        | Use reset buttons for trim, speed, time, loop, format draft, subtitle timing, and filter strength.                                                                                             |
| Generated preview    | Explicit background-task state with generated media-library badges or concise status copy                        | Media library, editor, export              | Live preview is instant and reversible; generated preview is a derived Blob that may be reused for export only while its fingerprint is current and is inserted as a separate generated asset. |
| Selected or editing  | Blue accent selection and tactile active states without heavy shadows                                            | Media library, preview toolbar, tool tabs  | Selection state must not depend on color alone.                                                                                                                                                |
| Destructive action   | Remove/reset actions require clear affordance and should avoid accidental activation                             | Media library, editor                      | Confirm only where data loss is non-obvious or irreversible within the session.                                                                                                                |
| Focus and keyboard   | Visible focus rings, accessible names, and keyboard paths for upload, navigation, tool buttons, tabs, and export | All interactive regions                    | Icon-only controls need names and tooltips where helpful.                                                                                                                                      |
| Hover, active, touch | Hover/active states are restrained; mobile controls meet touch target expectations                               | Studio chrome, tool controls, asset cards  | Pointer-drag preview handlers must not swallow toolbar clicks.                                                                                                                                 |

Rules:

- Forms use visible labels, optional helper text, error text below fields, and accessible focus rings.
- Loading states use skeletons, stable rows, or layout-matched placeholders rather than generic spinners when possible.
- Empty states identify the next useful action.
- Error states are inline or contextual; sonner toasts are only for transient feedback and should appear at bottom-right by default.
- Normal success, info, cancellation, and failure toasts auto-dismiss after about 3 seconds. Long-running jobs may use a persistent loading toast that resolves into a 3-second success or failure toast while persistent progress remains inline where the user needs it.

## Anti-Slop Preflight

- [ ] No generic AI-purple gradient default, random glow, or decorative effect replacing information architecture.
- [ ] No fake product previews made from decorative div rectangles.
- [ ] No gratuitous glassmorphism, bento, marquee, or motion in this dense editing UI.
- [ ] No ungrounded metrics, fake-precise numbers, or generic placeholder names.
- [ ] No placeholder-as-label forms.
- [ ] No low-contrast ghost buttons or invisible focus states.
- [ ] No text overflow, clipped labels, button wrapping on desktop, or incoherent overlap.
- [ ] No card-in-card layout unless the nested frame represents a real tool, modal, or repeated item.
- [ ] UI library components are customized through tokens or documented component variants, not scattered one-off styles.
- [ ] Upload and export each have one visible primary entry point in the relevant state.
- [ ] Media preview remains inspectable on desktop and mobile.

## Implementation Order

1. First MVP page shell: `/` guided studio layout, upload dropzone, media tray, preview, current task panel, and language switcher.
2. Media model and selection: local file import, metadata extraction, thumbnails, previous/next navigation, type filter, empty/error states.
3. Image core: preview, crop/rotate/flip/resize/beautify/filter, undo/redo/reset, original comparison, watermark layer, image export.
4. Browser/i18n verification: English and Chinese UI, browser-language default, manual switching, upload/edit/export smoke, no media upload network path.
5. Image interactive editing: Cropper.js crop rectangle, Konva annotation/watermark layers, layer selection, drag, transform, hide, delete, and export parity.
6. Image background removal: local model loading, processing state, result preview, failure handling.
7. Rich image formats: browser-native feature detection plus local BMP/GIF/TIFF encoders, unsupported-format messaging, and export tests.
8. Video preview workbench: Clypra-inspired preview header, fit/zoom/status controls, play/pause, reset time, scrubber, loop, and keyboard-safe toolbar behavior.
9. Video timeline editing: thumbnail trim handles, resettable trim/speed/format controls, subtitle timeline blocks, apply-to-derived-preview jobs, and export.

## Change Rule

- Update this document before implementing changes to routes, components, UI states, data dependencies, permissions, persistence, or interaction behavior.
- Update the Frontend Source Tree, File Boundary Contract, Component Split Rules, and Import Boundaries before moving frontend code across directories or adding new frontend layers.
- If implementation reveals a new backend/API/database/cloud requirement, pause frontend implementation and update the relevant source-of-truth document first.
- If a new UI library, canvas library, media library, or state pattern is needed, update `docs/architecture/TECH_STACK.md` first.

## Verification

- [ ] Type/build check once scripts exist.
- [ ] Browser verification for upload, select, preview, edit, and export flow.
- [ ] Desktop responsive layout check.
- [ ] Mobile responsive layout check.
- [ ] Tablet responsive layout check when relevant to the changed surface.
- [ ] Keyboard navigation check for upload focus, media switching, tool buttons, dialogs, and export.
- [ ] Canvas/video nonblank preview check.
- [ ] Privacy check that user media is not uploaded in v1.
- [ ] Source tree matches this document.
- [ ] Entry and route files are orchestration-focused.
- [ ] UI, config, messages, state, icons, assets, and utilities have separate approved locations.
- [ ] Components are split by documented user/domain/interaction boundaries.
- [ ] Design Read, Design Dials, and Product MVP UI Quality Gate are followed.
- [ ] Required loading, empty, error, success, disabled, and saving states render.
- [ ] Text fits controls, cards, table cells, badges, and empty/error states.
- [ ] Contrast, focus rings, keyboard navigation, and touch targets are usable.
