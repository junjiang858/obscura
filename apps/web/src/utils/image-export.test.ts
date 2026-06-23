import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  applyImageEditAction,
  initialImageEditHistory,
  getCurrentImageEditState,
} from "@local-media-studio/media-core";
import { en } from "../i18n/messages/en";
import type { WorkspaceAsset } from "../stores/media-store";
import { exportEditedImage, getCanvasFilter, getImageExportAvailability } from "./image-export";

describe("image export helpers", () => {
  let getContextSpy: ReturnType<typeof vi.spyOn>;
  let toBlobSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    getContextSpy = vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      clearRect: vi.fn(),
      drawImage: vi.fn(),
      fillRect: vi.fn(),
      fillText: vi.fn(),
      getImageData: vi.fn(() => ({
        data: new Uint8ClampedArray([
          255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 255, 255, 255, 255,
        ]),
        height: 2,
        width: 2,
      })),
      restore: vi.fn(),
      rotate: vi.fn(),
      save: vi.fn(),
      scale: vi.fn(),
      strokeRect: vi.fn(),
      translate: vi.fn(),
      set fillStyle(_value: string) {},
      set filter(_value: string) {},
      set font(_value: string) {},
      set globalAlpha(_value: number) {},
      set lineCap(_value: CanvasLineCap) {},
      set lineJoin(_value: CanvasLineJoin) {},
      set lineWidth(_value: number) {},
      set strokeStyle(_value: string) {},
      set textAlign(_value: CanvasTextAlign) {},
      set textBaseline(_value: CanvasTextBaseline) {},
    } as unknown as CanvasRenderingContext2D);

    toBlobSpy = vi
      .spyOn(HTMLCanvasElement.prototype, "toBlob")
      .mockImplementation((callback, type) => {
        callback(new Blob(["native"], { type: type ?? "image/png" }));
      });

    class MockImage {
      naturalHeight = 2;
      naturalWidth = 2;
      onload: (() => void) | null = null;

      set src(_value: string) {
        queueMicrotask(() => this.onload?.());
      }
    }

    vi.stubGlobal("Image", MockImage);
  });

  afterEach(() => {
    getContextSpy.mockRestore();
    toBlobSpy.mockRestore();
    vi.unstubAllGlobals();
  });

  it.each([
    ["bmp", "image/bmp", "fixture-edited.bmp"],
    ["gif", "image/gif", "fixture-edited.gif"],
    ["tiff", "image/tiff", "fixture-edited.tiff"],
  ] as const)("encodes %s locally", async (format, mimeType, filename) => {
    const result = await exportEditedImage({
      asset: createImageAsset(),
      format,
      quality: 86,
      state: getCurrentImageEditState(initialImageEditHistory()),
      t: en,
    });

    expect(result.blob.type).toBe(mimeType);
    expect(result.filename).toBe(filename);
    expect(result.width).toBe(2);
    expect(result.height).toBe(2);
    expect(result.size).toBeGreaterThan(0);
  });

  it("reports image export format availability with native and custom encoders", async () => {
    const availability = await getImageExportAvailability(
      ["png", "avif", "bmp", "gif", "tiff"],
      en,
    );

    expect(availability.png.available).toBe(true);
    expect(availability.avif.available).toBe(true);
    expect(availability.bmp.available).toBe(true);
    expect(availability.gif.available).toBe(true);
    expect(availability.tiff.available).toBe(true);
  });

  it("combines beautify sliders and filter presets for preview/export rendering", () => {
    const history = applyImageEditAction(
      applyImageEditAction(
        applyImageEditAction(initialImageEditHistory(), {
          adjustment: "brightness",
          type: "set-adjustment",
          value: 10,
        }),
        { preset: "vivid", type: "set-filter-preset" },
      ),
      { strength: 50, type: "set-filter-strength" },
    );

    expect(getCanvasFilter(getCurrentImageEditState(history))).toBe(
      "brightness(111%) contrast(106%) saturate(113%) sepia(0%) grayscale(0%) hue-rotate(0deg)",
    );
  });
});

function createImageAsset(): WorkspaceAsset {
  const file = new File(["image"], "fixture.png", { type: "image/png" });

  return {
    file,
    id: "asset-1",
    kind: "image",
    mimeType: "image/png",
    name: "fixture.png",
    objectUrl: "blob:fixture",
    size: file.size,
    status: "ready",
  };
}
