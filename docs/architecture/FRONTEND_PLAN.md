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

## Design Read

- Surface type: Dense local-first media editing workspace, not a marketing landing page.
- Audience: Personal creators editing private images and short videos in the browser.
- Product tone: Professional Studio: calm, precise, dark, canvas-first, and task-focused.
- Reference signals: Google Stitch project `1201636135287513933` / MagicMedia Editor, the existing three-region studio shell, Material Symbols tool icons, and dark media workstation conventions.
- Existing brand assets: MagicMedia wordmark in the top toolbar, Magic Blue/Cyan accent family, Material Symbols SVG React icon adapter, and the current localized English/Chinese message dictionaries.
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

| Component                    | Purpose                                                                                               | Owner layer or folder                                 | Reuse scope               | State owned                                                                  |
| ---------------------------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | ------------------------- | ---------------------------------------------------------------------------- |
| `AppShell` / `App`           | Owns full-height workspace layout and responsive panel regions                                        | `apps/web/src/app`                                    | App-wide                  | Local UI composition state only                                              |
| `TopToolbar`                 | Brand, local-only advantage tag, undo/redo where applicable, asset navigation, and language switching | `apps/web/src/components/studio`                      | Workspace                 | Receives selected asset and language state from app/store                    |
| `UploadDropzone`             | Drag/drop and file-picker entry                                                                       | `apps/web/src/components/preview`                     | Workspace and empty state | File input is owned by app composition                                       |
| `MediaLibraryPanel`          | Shows media list, filters, metadata, selected item, previous/next navigation                          | `apps/web/src/components/media-library`               | Workspace                 | Reads media store state through props/selectors                              |
| `MediaAssetCard`             | Compact thumbnail, type, name, size, dimensions/duration, error badge                                 | `apps/web/src/components/media-library`               | Media library             | Stateless display plus selected/disabled props                               |
| `PreviewStage`               | Hosts selected image/video preview and edit overlay                                                   | `apps/web/src/components/preview`                     | Workspace                 | Owns preview-only controls through props from app                            |
| `ImagePreviewCanvas`         | Image display, crop preview, comparison, annotation/watermark rendering                               | `apps/web/src/components/preview`                     | Image workflow            | Receives edit state; does not own history                                    |
| `PreviewViewportToolbar`     | Zoom out/in, fullscreen/theater toggle, and before/after compare mode                                 | `apps/web/src/components/preview`                     | Workspace                 | Preview zoom/compare/fullscreen state is owned by app composition            |
| `VideoPreviewPlayer`         | Video playback, current time, subtitle preview, trim markers                                          | `apps/web/src/components/preview`                     | Video workflow            | Future local playback state only                                             |
| `EditorPanel` / `EditorRail` | Switches between image/video tool groups based on selected asset type                                 | `apps/web/src/components/editor`                      | Workspace                 | Receives selected asset and edit state                                       |
| `ImageToolTabs`              | Crop, transform, adjust, annotate, watermark, background removal                                      | `apps/web/src/components/editor`                      | Image workflow            | Tab/expanded-section state may be local; image history stays in store/core   |
| `VideoToolTabs`              | Trim, speed, subtitles, export options                                                                | `apps/web/src/components/editor`                      | Video workflow            | Future video edit draft state should live in store/core                      |
| `CropPresetControl`          | Social crop presets and custom ratio controls                                                         | `apps/web/src/components/editor`                      | Image workflow            | Stateless action dispatch                                                    |
| `AdjustmentControls`         | Brightness, contrast, saturation sliders                                                              | `apps/web/src/components/editor`                      | Image workflow            | Stateless action dispatch                                                    |
| `AnnotationToolbar`          | Text, brush, rectangle, arrow, selection controls                                                     | `apps/web/src/components/editor`                      | Image workflow            | Future annotation selection may be local until persisted to image edit state |
| `WatermarkControls`          | Text/image watermark placement and opacity controls                                                   | `apps/web/src/components/editor`                      | Image workflow            | Future draft form state local; committed watermark state in store/core       |
| `BackgroundRemovalPanel`     | Starts local background removal and shows model/job progress                                          | `apps/web/src/components/editor`                      | Image workflow            | Future job state in store/worker boundary                                    |
| `TrimRangeControl`           | Start/end inputs and visual trim range                                                                | `apps/web/src/components/editor`                      | Video workflow            | Future validated trim state in store/core                                    |
| `SpeedControl`               | Speed preset and custom speed input                                                                   | `apps/web/src/components/editor`                      | Video workflow            | Future validated speed state in store/core                                   |
| `SubtitleCueList`            | Manual subtitle cue creation, validation, editing, deletion                                           | `apps/web/src/components/editor`                      | Video workflow            | Future cue draft state in store/core with local row editing                  |
| `ExportPanel`                | Output format, quality, resolution/size where feasible, and the single export/save action             | `apps/web/src/components/export`                      | Workspace                 | Future export settings/job state in store/worker boundary                    |
| `ProcessingJobToast`         | Progress, cancel, retry, and failure reason for long-running jobs                                     | `apps/web/src/components/export` or `studio`          | App-wide                  | Future job state in store/worker boundary                                    |
| `EmptyState`                 | First-run upload prompt and filtered-empty guidance                                                   | `apps/web/src/components/preview` and `media-library` | Workspace                 | Stateless display and action callbacks                                       |
| `ErrorState`                 | Unsupported format, metadata failure, processing failure, export failure                              | Relevant feature component folder                     | App-wide                  | Error source stays with asset/job state                                      |
| `KeyboardShortcutLayer`      | Previous/next, play/pause, undo/redo, reset, export shortcuts                                         | `apps/web/src/components/studio` or `app`             | Workspace                 | Dispatches to app/store; no durable state                                    |

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
- `apps/web/src/components/editor`: Editor rail, image tool groups, crop preset grid, adjustment sliders, progressive tool rows, and video tool placeholders.
- `apps/web/src/components/export`: Export panel, export status, and job message UI.
- `apps/web/src/config`: Static UI, media, workspace, and design-system configuration such as supported filters, tab order, icon sizes, export choices, quality ranges, and crop preset metadata.
- `apps/web/src/i18n`: Language types, browser-language detection, message dictionaries, and localized label helpers.
- `apps/web/src/icons`: Studio icon adapter for the approved icon family. Components should import icons from this adapter rather than directly from the icon package.
- `apps/web/src/stores`: Zustand stores and state selectors.
- `apps/web/src/utils`: Browser, image export, media asset, formatting, and DOM utility helpers that are not React components.
- Keep files focused by ownership. A region component may compose smaller local components, but it should not define global copy, media store state, or browser export logic inline.

## File Boundary Contract

| Concern                         | Approved location                                                      | Notes                                                                                              |
| ------------------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| App boot entry                  | `apps/web/src/main.tsx`                                                | Mounts React and global providers only.                                                            |
| Compatibility app export        | `apps/web/src/App.tsx`                                                 | Re-export only; do not add UI logic here.                                                          |
| App shell and route composition | `apps/web/src/app`                                                     | Orchestrates regions, cross-region state, and route-level event handlers.                          |
| Shared studio primitives        | `apps/web/src/components/studio`                                       | Toolbar, mobile tabs, panel headers, shared studio buttons, and workspace chrome.                  |
| Business/domain components      | `apps/web/src/components/media-library`, `preview`, `editor`, `export` | Components stay near the workflow they serve.                                                      |
| Feature or workflow components  | Same workflow-specific component folders                               | Split by media library, preview, editor, export, or future approved feature.                       |
| Data/API clients or mocks       | `apps/web/src/utils` or future approved `clients` folder               | Browser adapters and export helpers live in utils until complexity warrants a documented folder.   |
| Local or global stores          | `apps/web/src/stores`                                                  | Zustand stores, selectors, and durable app state.                                                  |
| Config, constants, tokens       | `apps/web/src/config`                                                  | Supported filters, tab order, icon sizes, layout widths, crop presets, and export option metadata. |
| i18n messages                   | `apps/web/src/i18n`                                                    | Language types, detection, dictionaries, and localized label helpers.                              |
| Icons                           | `apps/web/src/icons`                                                   | Local adapter for Material Symbols; components do not import directly from the icon package.       |
| Assets/media                    | Future approved `apps/web/src/assets`                                  | Add only when local static assets are needed and documented here.                                  |
| Utilities and browser adapters  | `apps/web/src/utils`                                                   | Object URL, metadata, export, formatting, and DOM helpers.                                         |
| Global styles                   | `apps/web/src/styles.css`                                              | Theme tokens, layout classes, and shared control styling.                                          |

Rules:

- `App.tsx` and route/app composition files compose screens; they must not hold unrelated UI, config, messages, state stores, icons, mock data, and utilities.
- A catch-all `utils.ts`, `config.ts`, or flat `components/` dump is not allowed once responsibilities are distinct.
- Any new top-level frontend folder must be added here before implementation.

## Component Split Rules

- Split by user-facing concept when a file begins mixing library, preview, editor, export, or processing responsibilities.
- Split by interaction state when loading, empty, error, success, disabled, selected, editing, processing, or failure markup becomes large enough to obscure the main flow.
- Split by data or domain boundary when image edit history, video edit settings, export jobs, media metadata, or localization needs separate validation or ownership.
- Split repeated patterns after they appear in two regions with the same behavior, not merely the same visual shape.
- Keep local-only pieces inline when they are short, single-use, and have no independent state or accessibility contract.
- Extract custom hooks when DOM/browser APIs, object URL lifecycle, keyboard shortcuts, worker messages, or measurement logic would otherwise dominate a component.
- Promote state to a store when multiple regions need it, when it must survive component unmounts, or when it represents media/edit/job state rather than temporary UI affordance.

## Import Boundaries

- Route/page/app composition may import workflow components, config, i18n, stores, icons, and utilities.
- Shared studio UI may import config tokens and icon adapters, but should not import media-core editing logic or workflow-specific stores directly.
- Feature/domain modules may import shared studio components, config, i18n types/messages, stores/selectors, utilities, and package APIs from `@local-media-studio/*`.
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

## State And Interaction Contract

| State or interaction | Pattern                                                                                                          | Components affected                        | Notes                                                                           |
| -------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------- |
| Loading              | Layout-matched placeholders, metadata loading rows, or progress blocks instead of generic full-screen spinners   | Media library, preview, editor, export     | WASM/model loads must show readable progress where feasible.                    |
| Empty                | A direct next action inside the real workspace                                                                   | Preview, media library                     | First-run empty state uses one Import Media action and format capability tags.  |
| Error                | Contextual error copy plus retry/reset/remove where feasible                                                     | Asset cards, preview, editor, export       | Unsupported files are asset-level and preview-visible when selected.            |
| Success              | The edited preview/export-ready state is visible without celebratory overlay clutter                             | Preview, editor, export                    | Downloads should start directly when browser behavior allows.                   |
| Disabled             | Disabled controls remain visible with understandable labels or helper text                                       | Editor controls, export action, navigation | Export disabled state must explain missing asset/settings when useful.          |
| Validating or saving | Inline validation for trim, subtitles, numeric values, and export settings                                       | Editor, export                             | Use Zod or core validation at boundaries.                                       |
| Selected or editing  | Blue accent selection and tactile active states without heavy shadows                                            | Media library, preview toolbar, tool tabs  | Selection state must not depend on color alone.                                 |
| Destructive action   | Remove/reset actions require clear affordance and should avoid accidental activation                             | Media library, editor                      | Confirm only where data loss is non-obvious or irreversible within the session. |
| Focus and keyboard   | Visible focus rings, accessible names, and keyboard paths for upload, navigation, tool buttons, tabs, and export | All interactive regions                    | Icon-only controls need names and tooltips where helpful.                       |
| Hover, active, touch | Hover/active states are restrained; mobile controls meet touch target expectations                               | Studio chrome, tool controls, asset cards  | Pointer-drag preview handlers must not swallow toolbar clicks.                  |

Rules:

- Forms use visible labels, optional helper text, error text below fields, and accessible focus rings.
- Loading states use skeletons, stable rows, or layout-matched placeholders rather than generic spinners when possible.
- Empty states identify the next useful action.
- Error states are inline or contextual; toasts are only for transient feedback.

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
3. Image core: preview, crop/rotate/flip/resize/adjust, undo/redo/reset, original comparison, watermark text, image export.
4. Browser/i18n verification: English and Chinese UI, browser-language default, manual switching, upload/edit/export smoke, no media upload network path.
5. Image annotations: brush, rectangle, arrow, richer watermark controls.
6. Image background removal: local model loading, processing state, result preview, failure handling.
7. Video core: video preview, metadata, trim start/end controls, speed controls, manual subtitle cue editor.
8. Video export: ffmpeg.wasm Worker path, progress, cancel/retry where feasible, output download.

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
