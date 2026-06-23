# Background Processing Center Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local background processing center for generated/encoded media jobs, insert completed results into the media library, and show a launch animation that sends newly created tasks into the queue.

**Architecture:** Keep all work client-side and session-scoped. Extend the existing job store with asset/job metadata and result attachment, reuse the existing media store for generated result assets, and add a compact Processing Center in the studio toolbar. Jobs capture the submitted edit/export fingerprint so switching media or continuing edits does not mutate the submitted work.

**Tech Stack:** React 19, TypeScript, Zustand, Vitest, React Testing Library, existing ffmpeg/background-removal/image export helpers, Material Symbols icon adapter, no new dependencies.

---

## File Map

- Modify `docs/project/PROJECT_CHARTER.md`: add `BackgroundJob`/generated result behavior to product/domain rules.
- Modify `docs/architecture/FRONTEND_PLAN.md`: document `ProcessingCenter`, launch animation, mobile behavior, and result insertion UI.
- Modify `docs/architecture/BACKEND_SPEC.md`: document local background job contracts and submitted-state snapshots.
- Modify `docs/architecture/DATABASE_DESIGN.md`: document session-only generated result retention.
- Modify `packages/shared/src/index.ts`: extend worker job type/status schema with local background metadata.
- Modify `packages/media-core/src/index.ts`: add helper types/builders for job result metadata if needed by tests.
- Modify `apps/web/src/stores/job-store.ts`: store background job metadata, completion result, recent jobs, and launch markers.
- Modify `apps/web/src/stores/job-store.test.ts`: TDD coverage for queued metadata, result attachment, retry, and clearing.
- Modify `apps/web/src/stores/media-store.ts`: add `addGeneratedFile` that inserts a generated media asset after the source asset.
- Create `apps/web/src/stores/media-store.test.ts`: TDD coverage for generated result insertion and selection behavior.
- Modify `apps/web/src/app/App.tsx`: route job launch/complete events, pass processing center props, and insert generated results.
- Create `apps/web/src/components/studio/ProcessingCenter.tsx`: compact queue icon, hover/focus popover, active count, task list actions.
- Create `apps/web/src/components/studio/TaskLaunchAnimation.tsx`: FLIP-style token animation from trigger button to queue icon with reduced-motion fallback.
- Modify `apps/web/src/components/studio/TopToolbar.tsx`: mount the processing center in the utility area.
- Modify `apps/web/src/components/editor/EditorRail.tsx`, `ImageEditorPanel.tsx`, `VideoEditorPanel.tsx`: pass launch refs/context for generated preview/background tasks.
- Modify `apps/web/src/components/export/ExportPanel.tsx`: submit export jobs through the shared job model and use generated preview results when matching.
- Modify `apps/web/src/components/preview/SelectedPreview.tsx`: remove cancellation-on-selection-change behavior for generated video/image preview jobs and route completion through job store.
- Modify `apps/web/src/i18n/messages/en.ts` and `zh.ts`: add queue, job status, action, and aria-live strings.
- Modify `apps/web/src/icons/studio-icons.tsx`: add queue/task icon if existing download icon is not sufficient.
- Modify `apps/web/src/styles.css`: add Processing Center popover, badge, progress rows, task token animation, reduced-motion rules.
- Modify `apps/web/src/App.test.tsx`: cover visible processing center, job launch feedback, and generated result insertion.
- Modify `apps/web/tests/e2e/first-mvp-slice.spec.ts`: cover video preview job continues across asset switching and result appears in the media library where feasible.

## Task 1: Source-Of-Truth Documentation

**Files:**

- Modify `docs/project/PROJECT_CHARTER.md`
- Modify `docs/architecture/FRONTEND_PLAN.md`
- Modify `docs/architecture/BACKEND_SPEC.md`
- Modify `docs/architecture/DATABASE_DESIGN.md`

- [ ] Update docs so background jobs are local, session-scoped, and never backend/cloud jobs.
- [ ] Document that submitted jobs capture a fingerprint/input snapshot.
- [ ] Document that completed generated results are inserted into the media library as new assets.
- [ ] Document that edit parameter reset controls remain, while generated results no longer need a reset button.
- [ ] Run `pnpm format:check` after all code/doc edits, or run `pnpm format` if Markdown wrapping changes are needed.

## Task 2: Job Store TDD

**Files:**

- Modify `apps/web/src/stores/job-store.test.ts`
- Modify `apps/web/src/stores/job-store.ts`
- Modify `packages/shared/src/index.ts`

- [ ] Write a failing test that `queueJob` accepts metadata: title, source asset id/name/kind, fingerprint, and launch id.
- [ ] Run `pnpm --filter @obscura/web test -- src/stores/job-store.test.ts` and confirm the test fails because metadata is not stored.
- [ ] Extend the job store/types minimally so the test passes.
- [ ] Add a failing test that completed jobs can attach a generated result file/result asset id.
- [ ] Run the focused test and confirm it fails because result attachment is missing.
- [ ] Implement result attachment and verify the focused test passes.

## Task 3: Generated Result Media Insertion TDD

**Files:**

- Create `apps/web/src/stores/media-store.test.ts`
- Modify `apps/web/src/stores/media-store.ts`

- [ ] Write a failing test for `addGeneratedFile(sourceAssetId, file, metadata)` inserting the new asset immediately after the source asset.
- [ ] Verify the test fails with `addGeneratedFile is not a function`.
- [ ] Implement `addGeneratedFile`, initialize image/video edit state for the generated asset, and keep the current selection unchanged by default.
- [ ] Add a failing test that the generated asset is appended when the source asset is gone.
- [ ] Implement the append fallback and verify the focused media store tests pass.

## Task 4: Processing Center UI

**Files:**

- Create `apps/web/src/components/studio/ProcessingCenter.tsx`
- Modify `apps/web/src/components/studio/TopToolbar.tsx`
- Modify `apps/web/src/i18n/messages/en.ts`
- Modify `apps/web/src/i18n/messages/zh.ts`
- Modify `apps/web/src/styles.css`
- Modify `apps/web/src/App.test.tsx`

- [ ] Write a failing component/app test that queued jobs show a toolbar queue button with an active count.
- [ ] Implement `ProcessingCenter` with hover/focus popover, progress rows, cancel/retry/open/remove actions, and `aria-live`.
- [ ] Add reduced mobile behavior through CSS: click/focus popover remains usable and no hover-only dependency.
- [ ] Verify the focused app test passes.

## Task 5: Task Launch Animation

**Files:**

- Create `apps/web/src/components/studio/TaskLaunchAnimation.tsx`
- Modify `apps/web/src/components/studio/ProcessingCenter.tsx`
- Modify `apps/web/src/styles.css`
- Modify `apps/web/src/App.test.tsx`

- [ ] Write a failing test that creating a new launch marker renders an accessible "added to queue" live message.
- [ ] Implement the animation token using trigger and queue element rectangles when motion is allowed.
- [ ] Implement `prefers-reduced-motion` fallback: no flying token, badge bump plus live message.
- [ ] Verify the focused test passes.

## Task 6: Wire Existing Jobs Into The Queue

**Files:**

- Modify `apps/web/src/app/App.tsx`
- Modify `apps/web/src/components/preview/SelectedPreview.tsx`
- Modify `apps/web/src/components/editor/EditorRail.tsx`
- Modify `apps/web/src/components/editor/ImageEditorPanel.tsx`
- Modify `apps/web/src/components/editor/VideoEditorPanel.tsx`
- Modify `apps/web/src/components/export/ExportPanel.tsx`

- [ ] Route image preview, video preview, background removal, image export, and video export through job metadata.
- [ ] Ensure video/image preview generation is not aborted only because the selected asset changed.
- [ ] On completion, insert result files as generated media assets and attach `resultAssetId` to the job.
- [ ] Keep matching generated preview reuse for export when the fingerprint matches.
- [ ] Keep edit reset controls for parameters such as trim, speed, format, time, transform, beautify, and layers.

## Task 7: Verification

**Files:**

- Existing tests and browser e2e.

- [ ] Run focused store tests.
- [ ] Run `pnpm --filter @obscura/web test -- src/App.test.tsx`.
- [ ] Run `pnpm typecheck`.
- [ ] Run `pnpm lint`.
- [ ] Run `pnpm test`.
- [ ] Run `pnpm build`.
- [ ] Start the dev server and run browser checks for desktop and mobile processing-center visibility, launch feedback, result insertion, and no external media upload.
- [ ] Run `pnpm test:e2e` if browser/media runtime supports it within the session.

## Self-Review

- Spec coverage: local queue, task snapshots, result insertion, launch animation, reset-button decision, privacy, and verification are covered.
- Placeholder scan: no TBD/TODO placeholders.
- Type consistency: job metadata uses existing `WorkerJob` plus local background fields; media insertion uses `WorkspaceAsset` and existing image/video initialization paths.
