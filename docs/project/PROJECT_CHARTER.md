# PROJECT_CHARTER

## Document Status

- Purpose summary confirmed by user: Yes, confirmed in chat on 2026-06-22.
- User approved writing this document: Yes, approved in chat on 2026-06-22.
- Last reviewed: 2026-06-22.

## Reference Project Scan

- Scan completed before purpose confirmation: Yes.
- Selected direction after reviewing references: First version combines a lightweight local media toolbox with an image-first editing experience. A short-video timeline editor is reserved for later versions.

| Project | Direct link | Source type | What to borrow | What not to copy blindly | Direction impact |
| --- | --- | --- | --- | --- | --- |
| Photopea | https://www.photopea.com/ | Commercial web image editor | Browser-based creative workspace, large preview, multi-format image handling | Full Photoshop-like layer system and professional complexity | Keep image editing powerful enough for creators, but avoid professional graphics-suite scope |
| Filerobot Image Editor | https://github.com/scaleflex/filerobot-image-editor | Open-source image editor | Crop, rotate, flip, filters, annotate, watermark, undo/redo/reset, original comparison, focused UI | Image-only scope and editor SDK assumptions | First version should include a dedicated image editing panel with simple, complete basic tools |
| Pintura Image Editor | https://pqina.nl/pintura/ | Commercial image editor SDK | Mature embedded editor structure, crop presets, annotation, mobile-friendly interaction | Commercial licensing, SDK lock-in, over-polished scope | Use as interaction reference only; build only the core experience needed for this MVP |
| CapCut Online | https://www.capcut.com/tools/online-video-editor | Commercial online video editor | Upload, preview, trim, captions, stickers, templates, export-oriented workflow | AI generation, templates, social distribution, full creator platform scope | Video MVP must avoid becoming a CapCut clone and stay focused on single-asset editing |
| FreeCut | https://github.com/walterlow/freecut | Open-source browser video editor | Local browser editing, media library, thumbnails, waveform/cache ideas, keyboard shortcuts, export panel, future timeline route | Multi-track timeline, keyframes, AI captioning, scene search, advanced export pipeline | First version borrows media management and single-asset video editing patterns; multi-track becomes the advanced roadmap |
| ffmpeg.wasm / ffmpeg-webCLI | https://github.com/ffmpegwasm/ffmpeg.wasm | Open-source browser media processing library | In-browser video/audio conversion, trimming, format conversion, worker-based heavy processing | Assuming all codecs and large files work smoothly in every browser | Use local processing as the default technical principle, with clear limits and failure states |
| bg-remove / withoutbg | https://github.com/addyosmani/bg-remove | Open-source local background removal example | Browser-side background removal and privacy-friendly AI processing | Expecting perfect hair/glass edges or fast processing on all devices | First version includes basic automatic image background removal; manual refinement is deferred |

## Product Definition

- One-sentence product: A local-first web media toolbox for personal creators to quickly preview, edit, manage, and export images and short videos without installing heavy desktop software or uploading private files.
- Target users and roles: Personal creators who frequently prepare images and short videos for social platforms, personal projects, blogs, portfolios, or lightweight marketing content.
- Core scenario: A creator opens the web app, uploads one or more images or videos, switches between assets, applies quick edits, previews the result, and exports a usable file.
- Current workaround or pain: Users often jump between desktop editors, online converters, background removal sites, and video tools; this is slow, fragmented, and may require uploading private media to third-party services.
- Product role: Provide a focused browser workspace for common media cleanup and export tasks, prioritizing privacy, fast interaction, and simple controls over professional-grade editing depth.
- Why now: Modern browsers can handle more image and video processing locally through canvas, WebAssembly, Web Workers, and emerging media APIs; creators increasingly need quick privacy-friendly tools for social media assets.

## Purpose Confirmation

- Project purpose summary: The project serves personal creators who need a lightweight, local-first web tool for everyday image and short-video editing. The first version solves quick image cleanup and short-video preparation: upload, preview, switch assets, crop, rotate, flip, adjust, annotate, watermark, remove image backgrounds, trim video, change speed, add manual subtitles, convert formats, and download results. It deliberately avoids accounts, cloud storage, team workflows, multi-track timelines, AI video generation, and template marketplaces.
- User confirmation before technical planning: Confirmed by user in chat on 2026-06-22.

## Product Lifecycle

- Lifecycle: Product MVP.
- Launch target: Local-first single web app MVP before any cloud processing or account system.
- Budget or operating constraints: Prefer open-source, inspectable, client-side processing. Avoid paid commercial editor SDK lock-in in the first version unless explicitly re-evaluated later.

## MVP Scope

### First MVP Slice

- User scenario: A personal creator uploads media, selects an image or video from the media library, performs a small set of useful edits, previews the output, and downloads the edited result.
- Primary surface or page: One media workspace with upload area, media library, main preview, editing panel, and export panel.
- Useful outcome: The user gets a processed image or short video file suitable for social posting or personal use.
- Acceptance evidence: Browser run evidence, image edit/export evidence, video trim/speed/subtitle/export evidence, format conversion evidence, and visible handling for processing progress and failure states.

### Must Have

- Unified upload for images and videos.
- Unified media library with thumbnails, file name, format, dimensions or duration, and file size.
- Previous and next asset switching, including keyboard arrow support.
- Filter by media type: all, images, videos.
- Large preview for the selected image or video.
- Image crop, rotate, flip, resize, and format conversion.
- Image basic adjustments: brightness, contrast, saturation.
- Image simple annotation: text, brush, rectangle, arrow.
- Image watermark with position adjustment.
- Image original-versus-edited comparison.
- Image undo, redo, and reset.
- Image social crop presets: 1:1, 4:5, 9:16, 16:9, avatar-style square.
- Image basic automatic background removal using a local-first approach.
- Video preview and single-asset editing.
- Video trim by start and end time, including precise numeric input.
- Video speed adjustment.
- Video manual subtitle creation and editing by time range.
- Video format conversion.
- Video thumbnail frames for easier positioning.
- Export panel with target format, resolution or size option when feasible, quality preset, progress, cancel, retry, and clear failure reason.
- Local edit draft state retained within the browser session where feasible.

### Should Have

- Optional audio waveform preview for video positioning if it does not destabilize the first version.
- Batch export for selected assets only if the single-asset export flow is already stable.
- Export naming options such as suffix, format label, or edited timestamp.
- Basic keyboard shortcuts for play/pause, previous/next asset, undo, redo, reset, and export.

### Non-Goals

- User accounts, login, cloud storage, or remote media library.
- Server-side processing in the first version.
- Team collaboration, comments, approval workflows, or shared projects.
- Multi-track video timeline.
- Keyframes, advanced transitions, masks, and professional compositing.
- AI automatic subtitles, AI video generation, template marketplace, or social publishing.
- Manual image background refinement with brush-based erase/restore.
- Full Photoshop-like layer editing.

### Later

- Hybrid processing for large video conversion, higher-quality image background removal, and cloud batch processing.
- Short-video editor route with multi-track timeline, stickers, transitions, captions, and project files.
- Manual background-removal refinement.
- AI subtitle generation, scene detection, and content-aware tools.
- Persistent local workspace using a user-selected folder.
- Optional account and cloud sync if privacy and cost boundaries are redefined.

## Core Workflows

1. Image quick edit: upload images, choose one image, preview it, crop or rotate it, optionally remove background or add watermark, compare against the original, export in the selected format.
2. Video quick edit: upload a video, preview it, set trim start and end, adjust speed, add manual subtitle cues, choose output format and quality, export with progress feedback.
3. Media management: upload mixed media, inspect thumbnails and metadata, filter by image or video, move to previous or next asset, keep draft edits during the session, and export one selected asset.

## Domain Model

### Core Objects

| Object | Why it exists | Owner |
| --- | --- | --- |
| MediaAsset | Represents an uploaded image or video and its metadata | Local user |
| MediaLibrary | Holds the current session's uploaded assets and selection state | Local user |
| ImageEditState | Stores image operations such as crop, rotate, flip, adjustments, annotations, watermark, and background removal state | Local user |
| VideoEditState | Stores video operations such as trim range, speed, subtitle cues, and export settings | Local user |
| SubtitleCue | Represents one manual subtitle segment with start time, end time, and text | Local user |
| ExportJob | Tracks local export status, progress, result file, cancellation, retry, and errors | Local user |
| LocalDraft | Stores recoverable in-browser session state where feasible | Local user |

### Operations And States

| Object or workflow | User operation | Important states | Evidence or history |
| --- | --- | --- | --- |
| MediaAsset | Upload, select, preview, switch, remove | Imported, selected, edited, exporting, exported, failed | File metadata, thumbnail, current selection |
| ImageEditState | Crop, rotate, flip, adjust, annotate, watermark, remove background, undo, redo, reset | Clean, edited, background-processing, export-ready | Operation stack, preview render, comparison state |
| VideoEditState | Trim, change speed, add subtitles, preview, export | Clean, edited, processing, export-ready | Trim times, speed value, subtitle cues, export settings |
| ExportJob | Start, cancel, retry, download | Queued, processing, completed, canceled, failed | Progress value, error reason, generated file |
| LocalDraft | Save draft, restore draft, clear draft | Available, restored, stale, cleared | Browser storage marker and recoverable edit state |

### External Systems And Resources

| System or resource | Purpose | Boundary or risk |
| --- | --- | --- |
| Browser file picker / drag-and-drop | User-selected local media input | The app must not access files outside the user's explicit selection |
| Canvas / image processing APIs | Image preview and transformations | Large images may consume memory or render slowly |
| WebAssembly media processing | Local video trimming, speed, and format conversion | Large files, codecs, and memory limits may fail depending on device/browser |
| Web Workers | Keep heavy processing off the main UI thread | Worker errors and cancellation must be visible to users |
| Local AI model for background removal | Basic automatic image cutout | Model size, processing speed, and edge quality may vary |
| Browser storage | Session draft recovery and lightweight metadata | Do not silently persist sensitive raw media beyond the agreed local behavior |

## Rules And Permissions

- Roles: Single local user in the first version.
- Permission boundaries: The app processes only files the user uploads or selects. First version does not upload media to a backend or third-party API.
- Safety constraints: Show clear warnings or limits for very large files, unsupported formats, codec failures, memory pressure, and long-running processing.
- Failure handling: Every long-running operation must have progress when feasible, cancellation when feasible, and a readable failure reason with retry or reset path.
- Privacy rule: Local-first processing is a product promise for the first version; any future cloud processing requires an explicit source-of-truth update and user confirmation.

## Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Browser video processing is slow or fails on large files | Users may think export is broken | Start with short-video expectations, show progress/cancel/failure reason, and document limits |
| Codec support varies across browsers | Some conversions or previews may not work | Detect capability where possible and provide fallback messages |
| Local background removal model is heavy | First use may feel slow and consume memory | Make it clearly asynchronous, show model loading/progress, and keep manual refinement out of first version |
| UI becomes too complex by mixing image and video tools | Users may feel lost | Use one media workspace with asset-type-specific editing panels |
| Scope creep toward CapCut or Photoshop | MVP may become too large to finish | Keep first version to single-asset workflows and defer timeline/layer complexity |
| Raw media persistence could surprise users | Privacy trust could be damaged | Keep storage behavior explicit and avoid silent cloud or long-term raw media retention |

## Acceptance Criteria

- [ ] A user can upload multiple images and videos into one media library.
- [ ] A user can switch to previous and next assets from the preview workspace.
- [ ] The media library shows thumbnails and basic metadata for each asset.
- [ ] A user can crop, rotate, flip, resize, adjust, annotate, watermark, and export an image.
- [ ] A user can compare an edited image with the original.
- [ ] A user can undo, redo, and reset image edits.
- [ ] A user can run basic local automatic background removal on an image and export the result.
- [ ] A user can preview a video, trim by start/end time, adjust speed, add manual subtitle cues, and export the result.
- [ ] Export flows show format options, quality or size options when feasible, progress, cancel or retry where feasible, and readable errors.
- [ ] The first version does not upload user media to a backend or third-party API.
- [ ] The product clearly handles unsupported formats, large files, and processing failures.

## Open Questions

- Which image and video formats are required for the first public test: PNG, JPG, WebP, GIF, MP4, WebM, MOV, or others?
- What maximum image size and video duration should the first version officially support?
- Should the first version target Chrome/Edge first, or attempt broader Safari/Firefox support from day one?
- Should local draft recovery persist only metadata/edit operations, or also retain user-selected files when browser capabilities allow it?
- Should background removal be built into the main image toolbar or launched as a separate processing modal?
