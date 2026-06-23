# DEBUG REPORT: Editor Preview Regressions

- Date: 2026-06-23
- Status: DONE

## Symptom

- Image crop and layer transform handles were clipped or visually covered near the image edge.
- Image crop edits had no explicit generated preview result.
- Imported videos could appear low in the preview frame and overlap the bottom workbench.
- Image format conversion settings had no preview action before export.

## Root Cause

- The image display container and Konva layer both used `overflow: hidden`; Konva Transformer anchors extend outside the selected rectangle, so handles near the image edge were clipped by the parent containers.
- Image format/crop changes updated edit/export settings only; there was no image-side derived preview state equivalent to the video preview flow.
- The video canvas layer used normal grid sizing with `height: 100%` inside a padded frame, which could create an oversized layout box. On mobile, the video element's intrinsic aspect ratio could still exceed the available layer and collide with the wrapped bottom workbench.
- `getCurrentImageEditState` returns a cloned state object, so using the object identity as a preview invalidation dependency cleared generated previews during unrelated app re-renders such as mobile tab switches.

## Fix

- Split image rendering into a clipped `.image-preview-surface` for the actual bitmap and a visible overflow parent/layer for Konva handles.
- Added image derived preview generation from the editor rail for crop and format conversion, backed by the existing local `exportEditedImage` path.
- Added output width/height to image export results so derived previews can preserve the generated result ratio.
- Changed video layout so the video layer has fixed insets and the video element fills that layer with `object-fit: contain`.
- Tied image preview validity to the current asset id, image-state fingerprint, format, and quality instead of object identity.

## Evidence

- `pnpm check` passed.
- Desktop browser verification:
  - `cropOverflow: visible`
  - `layerOverflow: visible`
  - `surfaceOverflow: hidden`
  - image preview message: `图片预览已生成。`
  - image preview source is a `blob:` URL
  - video center deltas: `0, 0`
  - video/workbench overlap: `false`
- Mobile browser verification:
  - image preview message persisted after switching back to Preview
  - image message/tool overlap: `false`
  - video center deltas: `0, 0`
  - video/workbench overlap: `false`

## Regression Test

- Updated `apps/web/src/App.test.tsx` to exercise image format preview generation before export.
- Updated `apps/web/src/utils/image-export.test.ts` to assert generated image preview/export dimensions.

## Related

- This area is sensitive to CSS overflow, replaced-element sizing, and React state identity. Future preview invalidation should prefer durable content keys over object identity when state helpers clone values.
