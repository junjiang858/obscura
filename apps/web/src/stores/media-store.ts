import { create } from "zustand";
import {
  applyImageEditAction,
  classifyMediaKind,
  getNextAssetId,
  initialImageEditHistory,
} from "@local-media-studio/media-core";
import type { ImageEditAction, ImageEditHistory } from "@local-media-studio/media-core";
import type { MediaAsset, MediaKind } from "@local-media-studio/shared";

export type MediaFilter = "all" | MediaKind;
export type WorkspaceAsset = MediaAsset & { file: File };
export type MediaMetadataUpdate = Pick<MediaAsset, "width" | "height" | "duration">;

type MediaStore = {
  assets: WorkspaceAsset[];
  selectedAssetId: string | null;
  filter: MediaFilter;
  imageHistories: Record<string, ImageEditHistory>;
  addFiles: (files: File[]) => void;
  selectAsset: (assetId: string) => void;
  selectAdjacent: (direction: 1 | -1) => void;
  setFilter: (filter: MediaFilter) => void;
  applyImageAction: (assetId: string, action: ImageEditAction) => void;
  updateAssetMetadata: (assetId: string, metadata: MediaMetadataUpdate) => void;
  removeSelected: () => void;
};

export const useMediaStore = create<MediaStore>((set, get) => ({
  assets: [],
  selectedAssetId: null,
  filter: "all",
  imageHistories: {},
  addFiles: (files) => {
    const acceptedAssets = files.map(createMediaAsset);
    const newImageHistories = Object.fromEntries(
      acceptedAssets
        .filter((asset) => asset.kind === "image")
        .map((asset) => [asset.id, initialImageEditHistory()]),
    );

    set((state) => ({
      assets: [...state.assets, ...acceptedAssets],
      imageHistories: { ...state.imageHistories, ...newImageHistories },
      selectedAssetId: acceptedAssets[0]?.id ?? state.selectedAssetId,
    }));
  },
  selectAsset: (assetId) => {
    set({ selectedAssetId: assetId });
  },
  selectAdjacent: (direction) => {
    const state = get();
    const visibleIds = getVisibleAssets(state.assets, state.filter).map((asset) => asset.id);
    const nextId = getNextAssetId(visibleIds, state.selectedAssetId, direction);

    if (nextId) {
      set({ selectedAssetId: nextId });
    }
  },
  setFilter: (filter) => {
    const state = get();
    const visibleAssets = getVisibleAssets(state.assets, filter);
    const selectedStillVisible = visibleAssets.some((asset) => asset.id === state.selectedAssetId);

    set({
      filter,
      selectedAssetId: selectedStillVisible
        ? state.selectedAssetId
        : (visibleAssets[0]?.id ?? null),
    });
  },
  applyImageAction: (assetId, action) => {
    set((state) => {
      const history = state.imageHistories[assetId] ?? initialImageEditHistory();

      return {
        imageHistories: {
          ...state.imageHistories,
          [assetId]: applyImageEditAction(history, action),
        },
      };
    });
  },
  updateAssetMetadata: (assetId, metadata) => {
    set((state) => ({
      assets: state.assets.map((asset) =>
        asset.id === assetId
          ? {
              ...asset,
              ...metadata,
            }
          : asset,
      ),
    }));
  },
  removeSelected: () => {
    const state = get();
    const selectedAsset = state.assets.find((asset) => asset.id === state.selectedAssetId);

    if (selectedAsset) {
      URL.revokeObjectURL(selectedAsset.objectUrl);
    }

    const remainingAssets = state.assets.filter((asset) => asset.id !== state.selectedAssetId);
    const visibleAssets = getVisibleAssets(remainingAssets, state.filter);
    const remainingHistories = { ...state.imageHistories };

    if (state.selectedAssetId) {
      delete remainingHistories[state.selectedAssetId];
    }

    set({
      assets: remainingAssets,
      imageHistories: remainingHistories,
      selectedAssetId: visibleAssets[0]?.id ?? null,
    });
  },
}));

export function createMediaAsset(file: File, index: number): WorkspaceAsset {
  const kind = classifyMediaKind(file.type);
  const fallbackKind: MediaKind = file.type.startsWith("video/") ? "video" : "image";

  return {
    id: `asset-${Date.now()}-${index}-${file.name}`,
    kind: kind ?? fallbackKind,
    name: file.name,
    mimeType: file.type || "application/octet-stream",
    size: file.size,
    objectUrl: URL.createObjectURL(file),
    status: kind ? "ready" : "unsupported",
    file,
    ...(kind ? {} : { error: "Unsupported media type" }),
  };
}

export function getVisibleAssets(
  assets: readonly WorkspaceAsset[],
  filter: MediaFilter,
): WorkspaceAsset[] {
  if (filter === "all") {
    return [...assets];
  }

  return assets.filter((asset) => asset.kind === filter);
}
