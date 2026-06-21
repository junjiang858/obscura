# TECH_STACK

## Decision Status

- Project charter or equivalent facts confirmed: Yes, `docs/project/PROJECT_CHARTER.md` was confirmed by the user on 2026-06-22.
- User agreed to enter technology selection: Yes, confirmed in chat on 2026-06-22.
- Capability library scan reviewed by user: Yes, reviewed in chat on 2026-06-22.
- User confirmed this stack: Yes, confirmed in chat on 2026-06-22.
- User approved writing this document: Yes, approved in chat on 2026-06-22.
- Last reviewed: 2026-06-22.

## Selection Context

- Product form: Local-first browser web app for image and short-video editing.
- Product lifecycle: Product MVP, not a throwaway prototype.
- Target users or expected scale: Personal creators; first version optimizes for single-user local sessions and short media assets.
- Team capability: AI-assisted solo or small-team development; prefer mature, inspectable, TypeScript-friendly libraries.
- Launch pressure: Build a usable first MVP slice before expanding into a full timeline editor.
- Budget, hosting, compliance, or operational constraints: Prefer open-source or inspectable libraries. First version must not upload user media to a backend or third-party API. Any future cloud processing requires an explicit source-of-truth update.

## Architecture Track

- Track: Single Web App.
- Repository shape: `apps/web` for the web app, `packages/shared` for shared schemas/types, and `packages/media-core` for reusable media-processing helpers when implementation begins.
- Product lifecycle: Product MVP.

## Default Route

| Layer | Choice | Reason |
| --- | --- | --- |
| Package manager | pnpm workspace | Keeps the repo ready for app/package boundaries without heavy orchestration. |
| Runtime | Node.js 24 LTS | Current LTS runtime for new JavaScript projects as of 2026-06-22. |
| Frontend | React 19 + TypeScript + Vite | Best fit for a client-heavy SPA using Canvas, Web Workers, and WASM without SSR needs. |
| Backend | None in v1 | First version is local-first and does not upload media. |
| Database | None in v1 | Session and lightweight draft state can use browser storage; no server persistence. |
| Migrations | Not applicable in v1 | No database schema exists in the first version. |
| UI | Tailwind CSS v4 + shadcn/ui + Radix UI + lucide-react | Accessible, editable, AI-friendly components and icons for a dense tool workspace. |
| Image editing | Canvas API + Cropper.js + Konva/react-konva | Separates precise crop behavior from annotation/watermark object editing. |
| Background removal | `@imgly/background-removal`, with AGPL/license caveat | Local browser background removal fits v1 privacy goals, but the license must be rechecked before closed-source or commercial distribution. |
| Video processing | ffmpeg.wasm in Web Workers, coordinated through Comlink | Enables local trim, speed, subtitle burn-in/attachment where feasible, and format conversion. |
| Subtitles | In-app subtitle cue state + WebVTT export/preview | Manual subtitles are simple enough to manage without adding a parser library in v1. |
| Deployment | Vercel static deployment or equivalent static host with COOP/COEP support | Static hosting is enough, but WASM/SharedArrayBuffer paths may require cross-origin isolation headers. |
| Testing | Vitest + React Testing Library + Playwright | Covers media logic, UI components, and browser workflows. |

## Capability Library Scan

### Required Technical Capabilities

| Capability | Requirement source | Needed in MVP? |
| --- | --- | --- |
| Single-page tool workspace | Project charter product definition | Yes |
| Mixed image/video upload and media library | Project charter must-have scope | Yes |
| Large preview and previous/next switching | Project charter must-have scope | Yes |
| Image crop, rotate, flip, resize, adjustments, annotations, watermark | Project charter image scope | Yes |
| Image undo, redo, reset, and original comparison | Filerobot-inspired MVP scope | Yes |
| Basic automatic image background removal | User-selected v1 background removal direction | Yes |
| Video preview, trim, speed adjustment, manual subtitles, conversion | Project charter video scope | Yes |
| Long-running processing progress, cancel, retry, and errors | Project charter failure-handling rule | Yes |
| Local-first processing with no media uploads | Project charter privacy rule | Yes |
| Session draft recovery | Project charter should-have and local draft object | Yes |
| Audio waveform preview | Project charter should-have | Later |
| Persistent local workspace folder | Project charter later roadmap | Later |
| Multi-track timeline, keyframes, advanced transitions | Project charter non-goals/later roadmap | Later |
| Cloud processing, accounts, sync, collaboration | Project charter non-goals/later roadmap | Later |

### Third-Party Library Decisions

| Capability | Library name | Direct link | Ecosystem | Open-source or inspectable | Maintenance evidence | Why include/defer/reject | Risk or lock-in note | Decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Frontend framework | React | https://react.dev/ | JavaScript/TypeScript | Open source | React docs list React 19 as the current major documentation line. | Good default for a component-heavy editor with stateful panels. | Replacing later would rewrite most UI. | Included |
| Build tool | Vite | https://vite.dev/ | JavaScript/TypeScript | Open source | Official Vite docs recommend create-vite for modern web apps. | Fast local dev, simple static build, good Worker/WASM story. | Vite plugin/config choices should stay simple. | Included |
| Language | TypeScript | https://www.typescriptlang.org/ | JavaScript | Open source | Official docs and ecosystem support are mature. | Media state, export jobs, subtitles, and worker messages need typed contracts. | Runtime validation still needs Zod for user/draft data. | Included |
| Package manager | pnpm workspaces | https://pnpm.io/workspaces | JavaScript | Open source | pnpm has first-class workspace documentation. | Supports `apps/*` and `packages/*` without adding Turborepo yet. | Workspace boundaries must remain modest in v1. | Included |
| UI primitives/components | shadcn/ui | https://ui.shadcn.com/ | React/Tailwind | Open source / copied source | Official docs position it as editable component code, not a black-box package. | Lets the project own dense tool UI components. | Generated components become project-owned code to maintain. | Included |
| Accessible primitives | Radix UI | https://www.radix-ui.com/primitives | React | Open source, MIT | Official docs describe accessible, customizable primitives. | Useful for dialogs, menus, sliders, tabs, tooltips, popovers. | Keep direct use limited to primitives needed by shadcn/ui/components. | Included |
| Styling | Tailwind CSS v4 | https://tailwindcss.com/ | CSS | Open source | Official v4 docs and upgrade guide are current. | Fast to build a restrained utility-style editor layout. | Avoid one-off arbitrary styling drift. | Included |
| Icons | lucide-react | https://lucide.dev/guide/react | React | Open source, ISC | Official React package and icon docs are active. | Fits tool buttons: crop, rotate, undo, redo, download, play, etc. | Import icons individually to preserve tree-shaking. | Included |
| Image crop | Cropper.js | https://fengyuanchen.github.io/cropperjs/ | JavaScript | Open source, MIT | Official docs show v2.x documentation and npm distribution. | Focused crop component with aspect-ratio presets. | Do not let it own unrelated editor state. | Included |
| Canvas annotations/watermark | Konva + react-konva | https://konvajs.org/docs/react/index.html | React/Canvas | Open source, MIT | React Konva has current React 19-compatible releases and official docs. | Good fit for text, arrows, rectangles, brush paths, drag/resize watermarks. | Canvas object model must be wrapped behind project state APIs. | Included |
| Full image editor reference | Filerobot Image Editor | https://github.com/scaleflex/filerobot-image-editor | React/Canvas | Open source, MIT | NPM/GitHub show recent v5 beta activity and mature existing feature set. | Use as a UX/reference model, not as the core dependency. | Direct dependency could constrain UI and introduce beta/runtime coupling. | Deferred |
| Background removal | `@imgly/background-removal` | https://github.com/imgly/background-removal-js | Browser ML / ONNX | Source-available/open source with AGPL-3.0 license constraints | GitHub and npm show browser background removal support and current package availability. | Best available fit for local automatic background removal in v1. | AGPL/license obligations may conflict with future closed-source commercial distribution; must be rechecked before launch. | Included with license caveat |
| General browser ML runtime | Transformers.js | https://github.com/huggingface/transformers.js/ | Browser ML | Open source, Apache-2.0 | Active Hugging Face project with browser model support. | Useful if replacing or expanding background removal later. | Model licenses vary and must be checked per model. | Deferred |
| Video trim/speed/format conversion | ffmpeg.wasm | https://ffmpegwasm.netlify.app/ | WebAssembly media processing | Open source, MIT | Official docs state browser FFmpeg support and local data security. | Broadest browser-side option for v1 media conversion. | Large binary, memory limits, codec limitations, and COOP/COEP needs. | Included |
| Worker bridge | Comlink | https://github.com/googlechromelabs/comlink | Web Workers | Open source, Apache-2.0 | Maintained by GoogleChromeLabs and widely used for Worker RPC. | Keeps ffmpeg/background-removal worker APIs manageable. | Async boundary must be explicit; no hidden UI-blocking calls. | Included |
| High-performance WebCodecs media path | Mediabunny | https://mediabunny.dev/ | Browser media/WebCodecs | Open source / inspectable | Official site describes active TypeScript browser media toolkit. | Promising future path for faster media operations. | Younger ecosystem; browser support and complexity are higher. | Deferred |
| MP4 parsing/metadata | MP4Box.js | https://github.com/gpac/mp4box.js/ | JavaScript media | Open source | GPAC announced TypeScript-supported MP4Box.js 1.0.0 in 2025. | Useful if the app needs deeper MP4 metadata or segmentation later. | Adds specialized complexity before v1 needs it. | Deferred |
| State management | Zustand | https://github.com/pmndrs/zustand | React | Open source, MIT | Widely used pmndrs package with active ecosystem. | Simple store for media library, selected asset, editor panels, export jobs. | Keep stores feature-scoped to avoid a single tangled global store. | Included |
| Undo/redo | zundo | https://github.com/charkour/zundo | Zustand middleware | Open source | Provides undo/redo utilities for Zustand. | Matches image undo/redo/reset requirement. | Limit history size to avoid memory growth with large media state. | Included |
| Runtime schema validation | Zod | https://zod.dev/ | TypeScript | Open source | Official docs describe TypeScript-first validation. | Validates subtitle cues, export settings, draft state, and worker messages. | Do not over-model every UI field; validate boundaries and persisted data. | Included |
| Local persistent database | Dexie | https://dexie.org/ | IndexedDB | Open source | Mature IndexedDB wrapper with TypeScript docs. | Useful for persistent workspace/cache later. | Raw media persistence can surprise users and create privacy concerns. | Deferred |
| Subtitle parsing/rendering library | videojs-vtt.js | https://www.npmjs.com/package/videojs-vtt.js | WebVTT | Open source, Apache-2.0 | NPM package exists but last published years ago. | Not needed for manually authored cue state in v1. | Adds old dependency for a simple v1 need. | Rejected for v1 |
| Audio waveform | wavesurfer.js | https://wavesurfer.xyz/ | Web Audio/Canvas | Open source | Current npm/package docs show active waveform library. | Useful for optional video positioning enhancement. | Not core to first slice; can increase media complexity. | Deferred |
| Commercial image editor SDK | Pintura | https://pqina.nl/pintura/ | Web SDK | Commercial/inspectable docs | Mature commercial SDK. | Good interaction reference only. | License cost and SDK lock-in conflict with v1 self-owned core. | Rejected for v1 |
| Commercial creative/video SDK | IMG.LY CE.SDK | https://img.ly/products/creative-sdk/ | Web/mobile SDK | Commercial/inspectable docs | Mature SDK vendor. | Could speed up a later commercial editor. | High lock-in and licensing complexity; over-scoped for v1. | Rejected for v1 |
| Next.js | Next.js | https://nextjs.org/ | React framework | Open source | Mature web framework. | Strong framework, but SSR/API routes are not needed for v1. | Adds server/app-router decisions unrelated to local media MVP. | Rejected for v1 |
| Full online video editor clone | FreeCut as dependency | https://github.com/walterlow/freecut | Browser video editor | Open source, MIT | Active, sophisticated local browser editor. | Use as architecture and UX reference only. | Direct adoption would pull in multi-track/keyframe scope. | Rejected for v1 |
| Unit and logic tests | Vitest | https://vitest.dev/ | Vite/TypeScript | Open source | Official Vite-native test runner. | Fits Vite and media utility tests. | Heavy browser APIs need targeted mocks or browser/e2e tests. | Included |
| Component tests | React Testing Library | https://testing-library.com/docs/react-testing-library/intro/ | React testing | Open source | Official docs emphasize user-like tests. | Good for toolbar, panels, validation, and state-driven UI. | Do not use for pixel-perfect canvas rendering assertions alone. | Included |
| Browser workflow tests | Playwright | https://playwright.dev/ | Browser automation | Open source | Official docs cover Chromium/Firefox/WebKit automation. | Needed for upload, preview, edit, export, and visual/browser checks. | Large media e2e fixtures must stay small. | Included |

## Production Compatibility

- Choices intended to survive launch: React, TypeScript, Vite, pnpm workspace, Tailwind, shadcn/ui, Radix UI, lucide-react, Zustand, Zod, Cropper.js, Konva/react-konva, ffmpeg.wasm, Comlink, Vitest, React Testing Library, Playwright.
- Choices that are acceptable only for prototype or local development: Browser-only draft recovery without explicit persistence guarantees; single-thread or simplified ffmpeg.wasm processing when advanced codec support is not available.
- What must not be replaced later without explicit approval: frontend framework, package manager, deployment model, local-first processing promise, state library, image editor architecture, video processing backend, background-removal strategy, and any move from local to cloud processing.

## Migration Cost

| Choice | Replacement cost | Notes |
| --- | --- | --- |
| React + Vite | High | Most UI, routing, build, and Worker integration would change. |
| pnpm workspace | Medium | Package manager change affects lockfile, scripts, CI, and workspace dependencies. |
| Zustand + zundo | Medium | Editor state and undo/redo logic would need rewriting. |
| Cropper.js | Medium | Crop UI and output coordinate mapping would need migration. |
| Konva/react-konva | High | Annotation, watermark, and canvas object interactions would need a new renderer. |
| `@imgly/background-removal` | Medium to high | Replacement depends on model/runtime/license; output quality and UX may change. |
| ffmpeg.wasm | High | Video trim, speed, subtitle, conversion, progress, and Worker job handling would need a new media pipeline. |
| Vercel/static host with COOP/COEP | Medium | Hosting must support required headers for WASM/SharedArrayBuffer paths. |

## Rejected Alternatives

| Alternative | Why rejected |
| --- | --- |
| Next.js for v1 | The first version is a local-first browser tool with no server rendering, auth, or API routes. Vite keeps the implementation smaller. |
| Directly embedding Filerobot Image Editor | It solves many image tasks, but constrains UI/architecture and is currently not needed as a dependency. |
| Directly building on FreeCut | It is a valuable reference but includes multi-track, keyframes, AI, workspace, and timeline complexity outside v1. |
| Pintura or IMG.LY CE.SDK | Commercial licensing and SDK lock-in conflict with the v1 self-owned, open-source-friendly foundation. |
| Database/Postgres/Supabase in v1 | The project has no accounts, backend, or cloud storage in the first version. |
| Dexie in first slice | Persistent local workspace is a later feature; v1 can start with session/draft metadata only. |
| videojs-vtt.js in first slice | Manual subtitle cues and WebVTT output can be implemented directly with browser-native text tracks. |
| wavesurfer.js in first slice | Audio waveform is useful but not essential to the first MVP slice. |
| Turborepo in first slice | pnpm scripts are enough until multiple packages need coordinated caching/task pipelines. |

## Forbidden Drift

- Do not introduce a new framework, database, UI kit, deployment platform, package manager, state library, image editor SDK, media pipeline, or background-removal provider without documenting the reason and receiving approval.
- Do not add backend upload, cloud processing, analytics that inspect user media, account systems, or remote persistence without updating the relevant source-of-truth documents first.
- Do not silently persist raw user media beyond the documented local-first and draft-recovery behavior.
- Do not turn the first version into a multi-track editor, Photoshop-like layer editor, or CapCut-style template system.

## Re-Evaluation Rules

Revisit this file when:

- Product shape changes from local-first single-user tool to cloud product, collaboration product, or platform.
- The project needs closed-source commercial distribution and `@imgly/background-removal` AGPL/license obligations become unacceptable.
- Browser-side ffmpeg.wasm cannot meet target video duration, file size, codec, or export performance requirements.
- The target browser support expands beyond Chromium-first support and key APIs behave differently.
- Persistent local workspace, file-system folder access, or long-term caching becomes a v1 requirement.
- Team capability changes enough to justify a backend, WebCodecs/Mediabunny pipeline, or commercial SDK.
- Any selected dependency becomes unmaintained, unsafe, incompatible with React/Vite, or license-problematic.
