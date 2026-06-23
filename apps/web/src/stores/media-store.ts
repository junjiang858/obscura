import { create } from "zustand";
import {
  applyImageEditAction,
  classifyMediaKind,
  getNextAssetId,
  initialImageEditHistory,
  initialVideoEditState,
  updateVideoEditState,
} from "@obscura/media-core";
import type {
  ImageEditAction,
  ImageEditHistory,
  VideoEditAction,
  VideoEditState,
} from "@obscura/media-core";
import type { MediaAsset, MediaKind } from "@obscura/shared";
import {
  getDefaultImageExportSettings,
  getVideoExportFormatFromMimeType,
  type ImageExportSettings,
} from "../config/media";

export type MediaFilter = "all" | MediaKind;
export type WorkspaceAsset = MediaAsset & {
  file: File;
  generatedByJobId?: string;
  sourceAssetId?: string;
};
export type MediaMetadataUpdate = Pick<MediaAsset, "width" | "height" | "duration">;
export type GeneratedAssetMetadata = {
  generatedByJobId: string;
  sourceAssetId: string;
};

type MediaStore = {
  assets: WorkspaceAsset[];
  selectedAssetId: string | null;
  filter: MediaFilter;
  imageExportSettings: Record<string, ImageExportSettings>;
  imageHistories: Record<string, ImageEditHistory>;
  videoEdits: Record<string, VideoEditState>;
  addFiles: (files: File[]) => void;
  addGeneratedFile: (
    sourceAssetId: string,
    file: File,
    metadata: GeneratedAssetMetadata,
  ) => WorkspaceAsset;
  selectAsset: (assetId: string) => void;
  selectAdjacent: (direction: 1 | -1) => void;
  setFilter: (filter: MediaFilter) => void;
  updateImageExportSettings: (assetId: string, patch: Partial<ImageExportSettings>) => void;
  applyImageAction: (assetId: string, action: ImageEditAction) => void;
  applyVideoAction: (assetId: string, action: VideoEditAction) => void;
  updateAssetMetadata: (assetId: string, metadata: MediaMetadataUpdate) => void;
  removeSelected: () => void;
};

type MediaStoreSelectionState = Pick<
  MediaStore,
  "assets" | "imageExportSettings" | "imageHistories" | "selectedAssetId" | "videoEdits"
>;

type EditorDraftPatch = Partial<
  Pick<MediaStoreSelectionState, "imageExportSettings" | "imageHistories" | "videoEdits">
>;

export const useMediaStore = create<MediaStore>((set, get) => ({
  assets: [],
  selectedAssetId: null,
  filter: "all",
  imageExportSettings: {},
  imageHistories: {},
  videoEdits: {},
  addFiles: (files) => {
    const acceptedAssets = files.map(createMediaAsset);
    const newImageHistories = Object.fromEntries(
      acceptedAssets
        .filter((asset) => asset.kind === "image")
        .map((asset) => [asset.id, initialImageEditHistory()]),
    );
    const newImageExportSettings = Object.fromEntries(
      acceptedAssets
        .filter((asset) => asset.kind === "image")
        .map((asset) => [asset.id, getDefaultImageExportSettings(asset.mimeType)]),
    );
    const newVideoEdits = Object.fromEntries(
      acceptedAssets
        .filter((asset) => asset.kind === "video")
        .map((asset) => [
          asset.id,
          initialVideoEditState(asset.duration, getVideoExportFormatFromMimeType(asset.mimeType)),
        ]),
    );

    set((state) => ({
      assets: [...state.assets, ...acceptedAssets],
      imageExportSettings: { ...state.imageExportSettings, ...newImageExportSettings },
      imageHistories: { ...state.imageHistories, ...newImageHistories },
      videoEdits: { ...state.videoEdits, ...newVideoEdits },
      selectedAssetId: acceptedAssets[0]?.id ?? state.selectedAssetId,
    }));
  },
  addGeneratedFile: (sourceAssetId, file, metadata) => {
    const state = get();
    const generatedAsset: WorkspaceAsset = {
      ...createMediaAsset(file, state.assets.length),
      generatedByJobId: metadata.generatedByJobId,
      sourceAssetId,
    };
    const sourceIndex = state.assets.findIndex((asset) => asset.id === sourceAssetId);
    const insertIndex = sourceIndex >= 0 ? sourceIndex + 1 : state.assets.length;
    const nextAssets = [
      ...state.assets.slice(0, insertIndex),
      generatedAsset,
      ...state.assets.slice(insertIndex),
    ];
    const nextImageHistories =
      generatedAsset.kind === "image"
        ? {
            ...state.imageHistories,
            [generatedAsset.id]: initialImageEditHistory(),
          }
        : state.imageHistories;
    const nextImageExportSettings =
      generatedAsset.kind === "image"
        ? {
            ...state.imageExportSettings,
            [generatedAsset.id]: getDefaultImageExportSettings(generatedAsset.mimeType),
          }
        : state.imageExportSettings;
    const nextVideoEdits =
      generatedAsset.kind === "video"
        ? {
            ...state.videoEdits,
            [generatedAsset.id]: initialVideoEditState(
              generatedAsset.duration,
              getVideoExportFormatFromMimeType(generatedAsset.mimeType),
            ),
          }
        : state.videoEdits;

    set({
      assets: nextAssets,
      imageExportSettings: nextImageExportSettings,
      imageHistories: nextImageHistories,
      videoEdits: nextVideoEdits,
    });

    return generatedAsset;
  },
  selectAsset: (assetId) => {
    set((state) => createSelectionPatch(state, assetId));
  },
  selectAdjacent: (direction) => {
    set((state) => {
      const visibleIds = getVisibleAssets(state.assets, state.filter).map((asset) => asset.id);
      const nextId = getNextAssetId(visibleIds, state.selectedAssetId, direction);

      return nextId ? createSelectionPatch(state, nextId) : {};
    });
  },
  setFilter: (filter) => {
    set((state) => {
      const visibleAssets = getVisibleAssets(state.assets, filter);
      const selectedStillVisible = visibleAssets.some(
        (asset) => asset.id === state.selectedAssetId,
      );
      const selectedAssetId = selectedStillVisible
        ? state.selectedAssetId
        : (visibleAssets[0]?.id ?? null);

      return {
        filter,
        ...createSelectionPatch(state, selectedAssetId),
      };
    });
  },
  updateImageExportSettings: (assetId, patch) => {
    set((state) => {
      const asset = state.assets.find((item) => item.id === assetId);
      const currentSettings =
        state.imageExportSettings[assetId] ?? getDefaultImageExportSettings(asset?.mimeType);

      return {
        imageExportSettings: {
          ...state.imageExportSettings,
          [assetId]: {
            ...currentSettings,
            ...patch,
          },
        },
      };
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
  applyVideoAction: (assetId, action) => {
    set((state) => {
      const videoState = state.videoEdits[assetId] ?? initialVideoEditState();

      return {
        videoEdits: {
          ...state.videoEdits,
          [assetId]: updateVideoEditState(videoState, action),
        },
      };
    });
  },
  updateAssetMetadata: (assetId, metadata) => {
    set((state) => {
      const nextAssets = state.assets.map((asset) =>
        asset.id === assetId
          ? {
              ...asset,
              ...metadata,
            }
          : asset,
      );

      return {
        assets: nextAssets,
        videoEdits:
          typeof metadata.duration === "number" &&
          state.videoEdits[assetId] &&
          state.videoEdits[assetId].trimEnd === null
            ? {
                ...state.videoEdits,
                [assetId]: {
                  ...state.videoEdits[assetId],
                  trimEnd: Math.round(metadata.duration * 100) / 100,
                },
              }
            : state.videoEdits,
      };
    });
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
    const remainingImageExportSettings = { ...state.imageExportSettings };
    const remainingVideoEdits = { ...state.videoEdits };

    if (state.selectedAssetId) {
      delete remainingHistories[state.selectedAssetId];
      delete remainingImageExportSettings[state.selectedAssetId];
      delete remainingVideoEdits[state.selectedAssetId];
    }

    const nextSelectedAssetId = visibleAssets[0]?.id ?? null;
    const selectionBase = {
      ...state,
      assets: remainingAssets,
      imageExportSettings: remainingImageExportSettings,
      imageHistories: remainingHistories,
      videoEdits: remainingVideoEdits,
    };

    set({
      assets: remainingAssets,
      imageExportSettings: remainingImageExportSettings,
      imageHistories: remainingHistories,
      videoEdits: remainingVideoEdits,
      ...createSelectionPatch(selectionBase, nextSelectedAssetId),
    });
  },
}));

function createSelectionPatch(
  state: MediaStoreSelectionState,
  assetId: string | null,
): { selectedAssetId: string | null } & EditorDraftPatch {
  if (state.selectedAssetId === assetId) {
    return { selectedAssetId: assetId };
  }

  return {
    selectedAssetId: assetId,
    ...(assetId ? createFreshEditorDraftPatch(state, assetId) : {}),
  };
}

function createFreshEditorDraftPatch(
  state: MediaStoreSelectionState,
  assetId: string,
): EditorDraftPatch {
  const asset = state.assets.find((item) => item.id === assetId);

  if (!asset) {
    return {};
  }

  if (asset.kind === "image") {
    return {
      imageExportSettings: {
        ...state.imageExportSettings,
        [asset.id]: getDefaultImageExportSettings(asset.mimeType),
      },
      imageHistories: {
        ...state.imageHistories,
        [asset.id]: initialImageEditHistory(),
      },
    };
  }

  return {
    videoEdits: {
      ...state.videoEdits,
      [asset.id]: initialVideoEditState(
        asset.duration,
        getVideoExportFormatFromMimeType(asset.mimeType),
      ),
    },
  };
}

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
