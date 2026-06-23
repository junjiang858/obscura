import { useRef, useState } from "react";
import type {
  ImageEditAction,
  ImageEditState,
  VideoEditAction,
  VideoEditState,
} from "@local-media-studio/media-core";
import type { WorkerJob } from "@local-media-studio/shared";
import { getVideoExportFormatFromMimeType, type ImageExportSettings } from "../../config/media";
import type { Copy } from "../../i18n";
import { StudioIcon, type StudioIconName } from "../../icons/studio-icons";
import type { WorkspaceAsset } from "../../stores/media-store";
import { ExportPanel } from "../export/ExportPanel";
import { PanelHeader } from "../studio/PanelHeader";
import { ImageEditorPanel } from "./ImageEditorPanel";
import { VideoEditorPanel } from "./VideoEditorPanel";

export function EditorRail({
  backgroundRemovalJob,
  imageExportSettings,
  imageState,
  isVisible,
  onApplyImageAction,
  onApplyVideoAction,
  onGenerateImagePreview,
  onImageExportSettingsChange,
  onGenerateVideoPreview,
  onRemoveBackground,
  selectedAsset,
  t,
  videoState,
}: {
  backgroundRemovalJob: WorkerJob | null;
  imageExportSettings: ImageExportSettings | null;
  imageState: ImageEditState | null;
  isVisible: boolean;
  onApplyImageAction: (action: ImageEditAction) => void;
  onApplyVideoAction: (action: VideoEditAction) => void;
  onGenerateImagePreview: () => void;
  onImageExportSettingsChange: (patch: Partial<ImageExportSettings>) => void;
  onGenerateVideoPreview: () => void;
  onRemoveBackground: () => void;
  selectedAsset: WorkspaceAsset | null;
  t: Copy;
  videoState: VideoEditState | null;
}) {
  const [activeTab, setActiveTab] = useState("transform");
  const tabListRef = useRef<HTMLDivElement>(null);
  const tabs = getEditorTabs(selectedAsset, t);
  const visibleActiveTab = tabs.some((tab) => tab.id === activeTab) ? activeTab : tabs[0]?.id;

  function scrollTabs(direction: 1 | -1) {
    tabListRef.current?.scrollBy({ behavior: "smooth", left: direction * 140 });
  }

  return (
    <aside className={`editor-rail ${isVisible ? "is-mobile-visible" : ""}`}>
      <section className="panel editor-panel">
        <PanelHeader
          eyebrow={selectedAsset?.kind === "image" ? t.effects : t.preview}
          icon="tune"
          title={t.edit}
        />
        {tabs.length ? (
          <div className="editor-tab-shell">
            <button
              aria-label={t.scrollTabsLeft}
              className="icon-button editor-tab-arrow"
              onClick={() => scrollTabs(-1)}
              type="button"
            >
              <StudioIcon name="chevronLeft" size={18} />
            </button>
            <div
              ref={tabListRef}
              aria-label={t.imageEditControls}
              className="editor-tabs"
              role="tablist"
            >
              {tabs.map((tab) => (
                <button
                  aria-selected={visibleActiveTab === tab.id}
                  className="editor-tab"
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  role="tab"
                  type="button"
                >
                  <StudioIcon name={tab.icon} size={17} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
            <button
              aria-label={t.scrollTabsRight}
              className="icon-button editor-tab-arrow"
              onClick={() => scrollTabs(1)}
              type="button"
            >
              <StudioIcon name="chevronRight" size={18} />
            </button>
          </div>
        ) : null}
        {selectedAsset?.kind === "image" && imageState ? (
          <ImageEditorPanel
            activeTab={visibleActiveTab ?? "transform"}
            backgroundRemovalJob={backgroundRemovalJob}
            exportSettings={imageExportSettings}
            imageState={imageState}
            onApply={onApplyImageAction}
            onExportSettingsChange={onImageExportSettingsChange}
            onGeneratePreview={onGenerateImagePreview}
            onRemoveBackground={onRemoveBackground}
            t={t}
          />
        ) : selectedAsset?.kind === "video" && videoState ? (
          <VideoEditorPanel
            activeTab={visibleActiveTab ?? "trim"}
            duration={selectedAsset.duration ?? null}
            onApply={onApplyVideoAction}
            onGeneratePreview={onGenerateVideoPreview}
            sourceFormat={getVideoExportFormatFromMimeType(selectedAsset.mimeType)}
            t={t}
            videoState={videoState}
          />
        ) : (
          <p className="empty-panel-copy">{t.selectAssetToEdit}</p>
        )}
      </section>

      <section className="panel export-panel">
        <PanelHeader eyebrow={t.output} icon="download" title={t.export} />
        <ExportPanel
          imageExportSettings={imageExportSettings}
          imageState={imageState}
          selectedAsset={selectedAsset}
          t={t}
          videoState={videoState}
        />
      </section>
    </aside>
  );
}

type EditorTab = {
  icon: StudioIconName;
  id: string;
  label: string;
};

function getEditorTabs(asset: WorkspaceAsset | null, t: Copy): EditorTab[] {
  if (!asset) {
    return [];
  }

  if (asset.kind === "video") {
    return [
      { icon: "contentCut", id: "trim", label: t.trimTab },
      { icon: "speed", id: "speed", label: t.speedTab },
      { icon: "subtitles", id: "subtitles", label: t.subtitlesTab },
      { icon: "formatPaint", id: "format", label: t.formatTab },
    ];
  }

  return [
    { icon: "cropRotate", id: "transform", label: t.transformTab },
    { icon: "tune", id: "adjustments", label: t.adjustmentsTab },
    { icon: "textFields", id: "layers", label: t.layersTab },
    { icon: "formatPaint", id: "format", label: t.formatTab },
    { icon: "backgroundReplace", id: "background", label: t.backgroundTab },
  ];
}
