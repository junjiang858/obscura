# FRONTEND_PLAN

## Document Status

- Project charter confirmed: Yes, `docs/project/PROJECT_CHARTER.md`.
- Tech stack confirmed: Yes, `docs/architecture/TECH_STACK.md`.
- User approved writing this document: Yes, approved in chat on 2026-06-22.
- Last reviewed: 2026-06-22.

## Product Tone

- Target user: Personal creators who want quick, private, low-friction image and short-video edits.
- Product posture: A focused editing workspace, not a landing page and not a full professional suite.
- Product audience fit: C-end creators should feel they are in a real media workstation, with the Stitch layout making the preview canvas, media library, and inspector obvious from the first frame.
- Visual density: Stitch-restored professional studio UI. Keep the main path clear through panel structure, but do not preserve a separate marketing or guided-intro layout above the workspace.
- First-screen signal: The upload/media workspace is the first screen. Do not show a marketing hero before the tool.
- Accessibility expectations: Keyboard-accessible upload, media switching, tool buttons, tabs, dialogs, sliders, and export actions; visible focus states; accessible names for icon buttons; no text trapped inside too-small controls.
- Language expectations: The web app supports English and Simplified Chinese in v1. It should choose the initial language from `navigator.language` when possible and provide an in-app language switcher that does not require reload.

## Page Map

| Route or screen     | Goal                                                                            | Primary action                                                                              | Data needed                                                                                | States                                                                                     |
| ------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| `/` Media Workspace | Upload, preview, edit, and export selected media through a guided consumer flow | Add media, select asset, edit, export                                                       | Local files, object URLs, media metadata, edit states, export jobs, active language        | Empty, drag-over, importing, selected, unsupported, editing, processing, failed, exported  |
| Media Library Panel | Manage uploaded images/videos in the current session                            | Select previous/next asset, filter by type, remove asset                                    | MediaAsset list, selected asset id, filter mode                                            | Empty, populated, filtered-empty, metadata-loading, item-error                             |
| Image Editor Panel  | Apply image-specific operations                                                 | Crop, rotate, flip, resize, adjust, annotate, watermark, remove background, undo/redo/reset | ImageEditState, operation history, crop preset, annotation objects, background-removal job | Clean, dirty, comparing, background-loading, background-processing, failed, export-ready   |
| Video Editor Panel  | Apply single-video operations                                                   | Set trim range, adjust speed, add subtitle cue, export                                      | VideoEditState, duration, current time, thumbnail frames, subtitle cues, export settings   | Metadata-loading, ready, invalid-range, subtitle-editing, processing, failed, export-ready |
| Export Panel        | Configure and run export for current asset                                      | Choose output format/quality and download result                                            | Selected asset, edit state, export settings, ExportJob                                     | Disabled, ready, loading-engine, processing, completed, canceled, failed                   |
| Processing Feedback | Keep long-running work understandable                                           | Cancel, retry, inspect failure                                                              | ExportJob or background-removal job status                                                 | Queued, loading, progress, canceling, failed, completed                                    |

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
- Interaction model:
  - Desktop uses the Stitch workstation structure directly: media library, preview canvas, and inspector/export rail visible together.
  - The visible top bar is utility chrome only: left MagicMedia wordmark plus a concise local-only advantage tag, centered previous/next plus undo/redo controls, and right compact language switching. Do not show explanatory title/subtitle copy in the top bar.
  - Empty workspace follows the Stitch empty-state screen: the main preview canvas becomes a large dashed upload dropzone with one Import Media action, no template exploration action, short capability notes, and localized copy.
  - After media exists, upload/import has one visible entry point in the media library panel. Do not duplicate upload actions in the top toolbar.
  - Export has one visible action in the export panel. The export action should prepare the local result and immediately start the browser save/download flow when possible.
  - Compare mode lives in the preview viewport toolbar only. Do not duplicate compare in the top toolbar.
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

| Component                | Purpose                                                                                               | Reuse scope               |
| ------------------------ | ----------------------------------------------------------------------------------------------------- | ------------------------- |
| `AppShell`               | Owns full-height workspace layout and responsive panel regions                                        | App-wide                  |
| `TopToolbar`             | Brand, local-only advantage tag, undo/redo where applicable, asset navigation, and language switching | Workspace                 |
| `UploadDropzone`         | Drag/drop and file-picker entry                                                                       | Workspace and empty state |
| `MediaLibraryPanel`      | Shows media list, filters, metadata, selected item, previous/next navigation                          | Workspace                 |
| `MediaAssetCard`         | Compact thumbnail, type, name, size, dimensions/duration, error badge                                 | Media library             |
| `PreviewStage`           | Hosts selected image/video preview and edit overlay                                                   | Workspace                 |
| `ImagePreviewCanvas`     | Image display, crop preview, comparison, annotation/watermark rendering                               | Image workflow            |
| `PreviewViewportToolbar` | Zoom out/in, fullscreen/theater toggle, and before/after compare mode                                 | Workspace                 |
| `VideoPreviewPlayer`     | Video playback, current time, subtitle preview, trim markers                                          | Video workflow            |
| `EditorPanel`            | Switches between image/video tool groups based on selected asset type                                 | Workspace                 |
| `ImageToolTabs`          | Crop, transform, adjust, annotate, watermark, background removal                                      | Image workflow            |
| `VideoToolTabs`          | Trim, speed, subtitles, export options                                                                | Video workflow            |
| `CropPresetControl`      | Social crop presets and custom ratio controls                                                         | Image workflow            |
| `AdjustmentControls`     | Brightness, contrast, saturation sliders                                                              | Image workflow            |
| `AnnotationToolbar`      | Text, brush, rectangle, arrow, selection controls                                                     | Image workflow            |
| `WatermarkControls`      | Text/image watermark placement and opacity controls                                                   | Image workflow            |
| `BackgroundRemovalPanel` | Starts local background removal and shows model/job progress                                          | Image workflow            |
| `TrimRangeControl`       | Start/end inputs and visual trim range                                                                | Video workflow            |
| `SpeedControl`           | Speed preset and custom speed input                                                                   | Video workflow            |
| `SubtitleCueList`        | Manual subtitle cue creation, validation, editing, deletion                                           | Video workflow            |
| `ExportPanel`            | Output format, quality, resolution/size where feasible, and the single export/save action             | Workspace                 |
| `ProcessingJobToast`     | Progress, cancel, retry, and failure reason for long-running jobs                                     | App-wide                  |
| `EmptyState`             | First-run upload prompt and filtered-empty guidance                                                   | Workspace                 |
| `ErrorState`             | Unsupported format, metadata failure, processing failure, export failure                              | App-wide                  |
| `KeyboardShortcutLayer`  | Previous/next, play/pause, undo/redo, reset, export shortcuts                                         | Workspace                 |

## Frontend File Organization

- `apps/web/src/app`: Thin application composition. `App.tsx` should orchestrate workspace regions and avoid owning detailed panel markup, copy dictionaries, export helpers, icon imports, or store definitions.
- `apps/web/src/components/studio`: Shared studio UI primitives and region chrome such as `TopToolbar`, `MobileTabs`, `PanelHeader`, `StudioButton`, and `StudioIconButton`.
- `apps/web/src/components/media-library`: Media library panel, asset cards, filters, empty states, and asset-level status UI.
- `apps/web/src/components/preview`: Preview stage, empty upload state, selected image/video preview, image panes, and preview toolbar.
- `apps/web/src/components/editor`: Editor rail, image tool groups, crop preset grid, adjustment sliders, progressive tool rows, and video tool placeholders.
- `apps/web/src/components/export`: Export panel, export status, and job message UI.
- `apps/web/src/config`: Static UI, media, workspace, and design-system configuration such as supported filters, tab order, icon sizes, export choices, quality ranges, and crop preset metadata.
- `apps/web/src/i18n`: Language types, browser-language detection, message dictionaries, and localized label helpers.
- `apps/web/src/icons`: Studio icon adapter for the approved icon family. Components should import icons from this adapter rather than directly from the icon package.
- `apps/web/src/stores`: Zustand stores and state selectors.
- `apps/web/src/utils`: Browser, image export, media asset, formatting, and DOM utility helpers that are not React components.
- Keep files focused by ownership. A region component may compose smaller local components, but it should not define global copy, media store state, or browser export logic inline.

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
- Error and empty-state pattern:
  - Preview empty state must match the MagicMedia Stitch empty workspace composition: a centered dashed dropzone panel, import-file icon with a small add badge, `Start Your Creation`, helper copy, a single `Import Media` primary action, and supported-format capability tags. Do not render the `Explore Templates` action in v1, and do not use the older Import/Edit/Export process cards for this state.
  - Empty states should provide direct upload actions, but the persistent upload action belongs to the media library.
  - Error states must explain the failed operation and offer reset/retry where feasible.
  - Unsupported formats/codecs must be visible on the affected asset and in the preview area when selected.
- Worker interaction pattern:
  - UI dispatches typed jobs to Worker-facing APIs.
  - Job state updates flow back into `ExportJob` or background-removal job state.
  - UI must stay responsive during model/WASM loading and processing.

## Design System

- UI library: shadcn/ui components built on Radix primitives and Tailwind CSS.
- Icon library: Material Symbols SVG React through a local studio icon adapter. Keep one icon family across the app. Use outlined icons for default tools, filled or heavier symbols for selected and active states, and standard sizes of 16px, 20px, 24px, and 48px.
- Stitch reference: Google Stitch project `1201636135287513933`, titled MagicMedia Editor, is the current visual baseline for the workspace. The implementation should restore the exposed MagicMedia Studio structure as directly as possible using the available Stitch design system data.
- Style direction: Professional Studio. The interface should feel like a precise local editing suite: dark, calm, technically capable, and focused on the media canvas. It should avoid a marketing hero, bubbly consumer styling, generic white cards, and decorative dashboard chrome.
- Visual dials for the current redesign: design variance 5, motion intensity 3, visual density 7. This favors a dense but readable tool workspace with restrained motion and progressive disclosure.
- Color tokens:
  - Background: `#0f1419` for the app shell and `#0a0f14` or `#0A0A0A` for the lowest canvas layer.
  - Panel surface: `#1E1E1E` for side panels, with `#171c22`, `#1b2026`, and `#262a30` for tonal hierarchy.
  - Primary action and active state: Magic Blue/Cyan, using `#00a3ff`, `#98cbff`, and `#00D1FF` consistently as the single blue accent family.
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
  - The right inspector groups tools into media-type-aware tabs. Image tabs include transform, adjustments, layers, and background. Video tabs include trim, speed, subtitles, and format. The tab strip supports arrow-button scrolling and native horizontal gesture scrolling.
  - Use menus/selects for output format and quality options.
  - Use text labels beside unfamiliar icons for consumer-facing clarity.
  - Show visible status for export preparation and other asynchronous work.
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

## Implementation Order

1. First MVP page shell: `/` guided studio layout, upload dropzone, media tray, preview, current task panel, and language switcher.
2. Media model and selection: local file import, metadata extraction, thumbnails, previous/next navigation, type filter, empty/error states.
3. Image core: preview, crop/rotate/flip/resize/adjust, undo/redo/reset, original comparison, watermark text, image export.
4. Browser/i18n verification: English and Chinese UI, browser-language default, manual switching, upload/edit/export smoke, no media upload network path.
5. Image annotations: brush, rectangle, arrow, richer watermark controls.
6. Image background removal: local model loading, processing state, result preview, failure handling.
7. Video core: video preview, metadata, trim start/end controls, speed controls, manual subtitle cue editor.
8. Video export: ffmpeg.wasm Worker path, progress, cancel/retry where feasible, output download.

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
