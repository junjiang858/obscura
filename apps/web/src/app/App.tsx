import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import {
  getCurrentImageEditState,
  initialImageEditHistory,
  type ImageEditAction,
} from "@local-media-studio/media-core";
import { EditorRail } from "../components/editor/EditorRail";
import { MediaLibraryPanel } from "../components/media-library/MediaLibraryPanel";
import { PreviewStage } from "../components/preview/PreviewStage";
import { MobileTabs } from "../components/studio/MobileTabs";
import { TopToolbar } from "../components/studio/TopToolbar";
import { emptyWorkspaceTabs, populatedWorkspaceTabs } from "../config/workspace";
import { detectInitialLanguage, messages, type Language } from "../i18n";
import { getVisibleAssets, useMediaStore, type WorkspaceAsset } from "../stores/media-store";
import { readAssetMetadata } from "../utils/media-metadata";
import type { MobileTab } from "./types";

export default function App() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [language, setLanguage] = useState<Language>(() => detectInitialLanguage());
  const [activeMobileTab, setActiveMobileTab] = useState<MobileTab>("preview");
  const [compareOriginal, setCompareOriginal] = useState(false);
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false);
  const [zoom, setZoom] = useState(100);
  const t = messages[language];

  const assets = useMediaStore((state) => state.assets);
  const selectedAssetId = useMediaStore((state) => state.selectedAssetId);
  const filter = useMediaStore((state) => state.filter);
  const imageHistories = useMediaStore((state) => state.imageHistories);
  const addFiles = useMediaStore((state) => state.addFiles);
  const selectAsset = useMediaStore((state) => state.selectAsset);
  const selectAdjacent = useMediaStore((state) => state.selectAdjacent);
  const setFilter = useMediaStore((state) => state.setFilter);
  const applyImageAction = useMediaStore((state) => state.applyImageAction);
  const updateAssetMetadata = useMediaStore((state) => state.updateAssetMetadata);
  const removeSelected = useMediaStore((state) => state.removeSelected);

  const visibleAssets = useMemo(() => getVisibleAssets(assets, filter), [assets, filter]);
  const selectedAsset = useMemo<WorkspaceAsset | null>(
    () => assets.find((asset) => asset.id === selectedAssetId) ?? null,
    [assets, selectedAssetId],
  );
  const selectedImageState =
    selectedAsset?.kind === "image"
      ? getCurrentImageEditState(imageHistories[selectedAsset.id] ?? initialImageEditHistory())
      : null;
  const canEditSelectedImage = selectedAsset?.kind === "image" && Boolean(selectedImageState);
  const workspaceTabs = assets.length ? populatedWorkspaceTabs : emptyWorkspaceTabs;
  const currentMobileTab = workspaceTabs.includes(activeMobileTab) ? activeMobileTab : "preview";
  const showCompareOriginal = compareOriginal && selectedAsset?.kind === "image";

  useEffect(() => {
    const assetsNeedingMetadata = assets.filter(
      (asset) => asset.status === "ready" && (!asset.width || !asset.height),
    );

    for (const asset of assetsNeedingMetadata) {
      void readAssetMetadata(asset)
        .then((metadata) => updateAssetMetadata(asset.id, metadata))
        .catch(() => {
          // Metadata is helpful for the info popover, but edit/export can continue without it.
        });
    }
  }, [assets, updateAssetMetadata]);

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  function handleFiles(fileList: FileList | null) {
    if (!fileList?.length) {
      return;
    }

    addFiles(Array.from(fileList));
    setActiveMobileTab("preview");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleApplyImageAction(action: ImageEditAction) {
    if (selectedAsset?.kind !== "image") {
      return;
    }

    applyImageAction(selectedAsset.id, action);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    handleFiles(event.dataTransfer.files);
  }

  return (
    <div className="workspace" onDragOver={(event) => event.preventDefault()} onDrop={handleDrop}>
      <input
        ref={fileInputRef}
        aria-label={t.chooseMedia}
        className="sr-only"
        multiple
        onChange={(event) => handleFiles(event.currentTarget.files)}
        type="file"
        accept="image/*,video/*"
      />

      <TopToolbar
        canEditSelectedImage={canEditSelectedImage}
        language={language}
        onApplyImageAction={handleApplyImageAction}
        onLanguageChange={setLanguage}
        onSelectAdjacent={selectAdjacent}
        selectedAsset={selectedAsset}
        t={t}
        totalAssets={assets.length}
      />

      <MobileTabs
        activeTab={currentMobileTab}
        onChange={setActiveMobileTab}
        tabs={workspaceTabs}
        t={t}
      />

      <div
        className={`workspace-grid mobile-tab-${currentMobileTab} ${
          assets.length ? "" : "is-empty"
        }`}
      >
        <MediaLibraryPanel
          activeFilter={filter}
          assets={visibleAssets}
          isVisible={currentMobileTab === "library"}
          onAddMedia={openFilePicker}
          onFilterChange={setFilter}
          onRemoveSelected={removeSelected}
          onSelectAsset={(assetId) => {
            selectAsset(assetId);
            setActiveMobileTab("preview");
          }}
          selectedAssetId={selectedAssetId}
          t={t}
          totalAssets={assets.length}
        />

        <PreviewStage
          compareOriginal={showCompareOriginal}
          imageState={selectedImageState}
          isFullscreen={isPreviewFullscreen}
          isVisible={currentMobileTab === "preview"}
          onAddMedia={openFilePicker}
          onCompareToggle={() => setCompareOriginal((value) => !value)}
          onFullscreenToggle={() => setIsPreviewFullscreen((value) => !value)}
          onZoomChange={setZoom}
          selectedAsset={selectedAsset}
          t={t}
          zoom={zoom}
        />

        {assets.length ? (
          <EditorRail
            imageState={selectedImageState}
            isVisible={currentMobileTab === "edit" || currentMobileTab === "export"}
            onApplyImageAction={handleApplyImageAction}
            selectedAsset={selectedAsset}
            t={t}
          />
        ) : null}
      </div>
    </div>
  );
}
