import { beforeEach, describe, expect, it, vi } from "vitest";
import { useMediaStore } from "./media-store";

function resetMediaStore() {
  useMediaStore.setState({
    assets: [],
    filter: "all",
    imageExportSettings: {},
    imageHistories: {},
    selectedAssetId: null,
    videoEdits: {},
  });
}

describe("media store generated assets", () => {
  beforeEach(() => {
    resetMediaStore();
    let objectUrlIndex = 0;

    vi.spyOn(URL, "createObjectURL").mockImplementation(
      () => `blob:generated-test-${objectUrlIndex++}`,
    );
  });

  it("inserts a generated result immediately after its source asset without changing selection", () => {
    const cover = new File(["cover"], "cover.png", { type: "image/png" });
    const clip = new File(["clip"], "clip.webm", { type: "video/webm" });

    useMediaStore.getState().addFiles([cover, clip]);
    const [sourceAsset, secondAsset] = useMediaStore.getState().assets;

    expect(sourceAsset).toBeDefined();
    expect(secondAsset).toBeDefined();

    useMediaStore
      .getState()
      .addGeneratedFile(
        sourceAsset!.id,
        new File(["edited"], "cover-edited.webp", { type: "image/webp" }),
        { generatedByJobId: "image-preview:1", sourceAssetId: sourceAsset!.id },
      );

    const state = useMediaStore.getState();
    const generatedAsset = state.assets[1];

    expect(state.assets.map((asset) => asset.name)).toEqual([
      "cover.png",
      "cover-edited.webp",
      "clip.webm",
    ]);
    expect(state.selectedAssetId).toBe(sourceAsset!.id);
    expect(generatedAsset).toMatchObject({
      generatedByJobId: "image-preview:1",
      kind: "image",
      name: "cover-edited.webp",
      sourceAssetId: sourceAsset!.id,
      status: "ready",
    });
    expect(state.imageHistories[generatedAsset!.id]).toBeDefined();
    expect(state.imageExportSettings[generatedAsset!.id]).toBeDefined();
    expect(secondAsset!.name).toBe("clip.webm");
  });

  it("appends a generated result when the source asset is no longer present", () => {
    useMediaStore.getState().addFiles([new File(["clip"], "clip.webm", { type: "video/webm" })]);

    useMediaStore
      .getState()
      .addGeneratedFile(
        "missing-source",
        new File(["edited"], "orphan-export.mp4", { type: "video/mp4" }),
        { generatedByJobId: "video-export:1", sourceAssetId: "missing-source" },
      );

    const state = useMediaStore.getState();
    const generatedAsset = state.assets.at(-1);

    expect(state.assets.map((asset) => asset.name)).toEqual(["clip.webm", "orphan-export.mp4"]);
    expect(generatedAsset).toMatchObject({
      generatedByJobId: "video-export:1",
      kind: "video",
      sourceAssetId: "missing-source",
    });
    expect(state.videoEdits[generatedAsset!.id]).toBeDefined();
  });

  it("resets a video's editor draft from its source metadata when selecting it again", () => {
    const sourceClip = new File(["source"], "source.mp4", { type: "video/mp4" });
    const otherClip = new File(["other"], "other.webm", { type: "video/webm" });

    useMediaStore.getState().addFiles([sourceClip, otherClip]);
    const [sourceAsset, otherAsset] = useMediaStore.getState().assets;

    expect(sourceAsset).toBeDefined();
    expect(otherAsset).toBeDefined();

    useMediaStore
      .getState()
      .applyVideoAction(sourceAsset!.id, { type: "set-format", format: "mov" });
    expect(useMediaStore.getState().videoEdits[sourceAsset!.id]?.exportFormat).toBe("mov");

    useMediaStore.getState().selectAsset(otherAsset!.id);
    useMediaStore.getState().selectAsset(sourceAsset!.id);

    expect(useMediaStore.getState().videoEdits[sourceAsset!.id]?.exportFormat).toBe("mp4");
  });
});
