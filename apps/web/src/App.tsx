import {
  ChevronLeft,
  ChevronRight,
  Download,
  FileImage,
  FileVideo,
  Filter,
  ImagePlus,
  RotateCcw,
  Scissors,
  ShieldCheck,
  Sparkles,
  Subtitles,
  Upload,
  Wand2,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { create } from "zustand";
import {
  classifyMediaKind,
  formatDuration,
  formatFileSize,
  getNextAssetId,
} from "@local-media-studio/media-core";
import type { MediaAsset, MediaKind } from "@local-media-studio/shared";

type MediaFilter = "all" | MediaKind;
type MobileTab = "library" | "preview" | "edit" | "export";

type MediaStore = {
  assets: MediaAsset[];
  selectedAssetId: string | null;
  filter: MediaFilter;
  addFiles: (files: File[]) => void;
  selectAsset: (assetId: string) => void;
  selectAdjacent: (direction: 1 | -1) => void;
  setFilter: (filter: MediaFilter) => void;
  removeSelected: () => void;
};

const useMediaStore = create<MediaStore>((set, get) => ({
  assets: [],
  selectedAssetId: null,
  filter: "all",
  addFiles: (files) => {
    const acceptedAssets = files.map(createMediaAsset);

    set((state) => ({
      assets: [...state.assets, ...acceptedAssets],
      selectedAssetId: state.selectedAssetId ?? acceptedAssets[0]?.id ?? null,
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
  removeSelected: () => {
    const state = get();
    const selectedAsset = state.assets.find((asset) => asset.id === state.selectedAssetId);

    if (selectedAsset) {
      URL.revokeObjectURL(selectedAsset.objectUrl);
    }

    const remainingAssets = state.assets.filter((asset) => asset.id !== state.selectedAssetId);
    const visibleAssets = getVisibleAssets(remainingAssets, state.filter);

    set({
      assets: remainingAssets,
      selectedAssetId: visibleAssets[0]?.id ?? null,
    });
  },
}));

export default function App() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<MobileTab>("preview");
  const [isDragActive, setIsDragActive] = useState(false);
  const assets = useMediaStore((state) => state.assets);
  const selectedAssetId = useMediaStore((state) => state.selectedAssetId);
  const filter = useMediaStore((state) => state.filter);
  const addFiles = useMediaStore((state) => state.addFiles);
  const selectAdjacent = useMediaStore((state) => state.selectAdjacent);
  const setFilter = useMediaStore((state) => state.setFilter);
  const selectedAsset = assets.find((asset) => asset.id === selectedAssetId) ?? null;
  const visibleAssets = useMemo(() => getVisibleAssets(assets, filter), [assets, filter]);

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  function handleFiles(files: FileList | null) {
    if (!files) {
      return;
    }

    addFiles(Array.from(files));
  }

  return (
    <main
      className="workspace"
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragActive(true);
      }}
      onDragLeave={() => setIsDragActive(false)}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragActive(false);
        handleFiles(event.dataTransfer.files);
      }}
    >
      <header className="top-toolbar">
        <div className="brand-lockup" aria-label="Local Media Studio">
          <span className="brand-mark">LM</span>
          <div>
            <p className="eyebrow">Local Media Studio</p>
            <h1>本地媒体工作台</h1>
          </div>
        </div>

        <div className="toolbar-actions">
          <input
            ref={fileInputRef}
            className="sr-only"
            id="media-upload"
            type="file"
            accept="image/*,video/*"
            multiple
            aria-label="Choose media files"
            onChange={(event) => handleFiles(event.currentTarget.files)}
          />
          <button className="primary-button" type="button" onClick={openFilePicker}>
            <Upload size={18} aria-hidden="true" />
            Add media
          </button>
          <button
            className="icon-button"
            type="button"
            aria-label="Previous asset"
            onClick={() => selectAdjacent(-1)}
          >
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
          <button
            className="icon-button"
            type="button"
            aria-label="Next asset"
            onClick={() => selectAdjacent(1)}
          >
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </div>
      </header>

      <section className="privacy-strip" aria-label="privacy status">
        <ShieldCheck size={16} aria-hidden="true" />
        <span>No media leaves this browser.</span>
        <strong>local only</strong>
      </section>

      <nav className="mobile-tabs" aria-label="Workspace sections">
        {(["library", "preview", "edit", "export"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            className={activeTab === tab ? "active" : ""}
            onClick={() => setActiveTab(tab)}
          >
            {capitalize(tab)}
          </button>
        ))}
      </nav>

      <div className={`workspace-grid ${isDragActive ? "drag-active" : ""}`}>
        <aside className={`panel media-library ${activeTab === "library" ? "mobile-active" : ""}`}>
          <PanelHeader
            eyebrow={`${assets.length} assets`}
            title="Library"
            icon={<Filter size={16} aria-hidden="true" />}
          />
          <div className="segmented-control" aria-label="Filter media type">
            {(["all", "image", "video"] as const).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={filter === option}
                onClick={() => setFilter(option)}
              >
                {capitalize(option)}
              </button>
            ))}
          </div>

          {visibleAssets.length === 0 ? (
            <div className="empty-library">
              <ImagePlus size={30} aria-hidden="true" />
              <p>Drop images or videos here to begin.</p>
            </div>
          ) : (
            <ul className="asset-list" aria-label="Imported media">
              {visibleAssets.map((asset) => (
                <MediaAssetRow
                  key={asset.id}
                  asset={asset}
                  selected={asset.id === selectedAssetId}
                />
              ))}
            </ul>
          )}
        </aside>

        <section className={`preview-stage ${activeTab === "preview" ? "mobile-active" : ""}`}>
          {selectedAsset ? (
            <SelectedPreview asset={selectedAsset} />
          ) : (
            <EmptyPreview onAddMedia={openFilePicker} />
          )}
        </section>

        <aside className={`panel inspector ${activeTab === "edit" ? "mobile-active" : ""}`}>
          <PanelHeader
            eyebrow={selectedAsset?.kind ?? "No asset"}
            title="Edit"
            icon={<Scissors size={16} aria-hidden="true" />}
          />
          <EditorPanel asset={selectedAsset} />
        </aside>

        <aside className={`panel export-panel ${activeTab === "export" ? "mobile-active" : ""}`}>
          <PanelHeader
            eyebrow="Output"
            title="Export"
            icon={<Download size={16} aria-hidden="true" />}
          />
          <ExportPanel asset={selectedAsset} />
        </aside>
      </div>
    </main>
  );
}

function PanelHeader({
  eyebrow,
  title,
  icon,
}: {
  eyebrow: string;
  title: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="panel-header">
      <span className="panel-icon">{icon}</span>
      <div>
        <p>{eyebrow}</p>
        <h2>{title}</h2>
      </div>
    </div>
  );
}

function MediaAssetRow({ asset, selected }: { asset: MediaAsset; selected: boolean }) {
  const selectAsset = useMediaStore((state) => state.selectAsset);
  const removeSelected = useMediaStore((state) => state.removeSelected);
  const Icon = asset.kind === "image" ? FileImage : FileVideo;

  return (
    <li>
      <button
        className={`asset-row ${selected ? "selected" : ""}`}
        type="button"
        onClick={() => selectAsset(asset.id)}
      >
        <span className="asset-thumb">
          <Icon size={22} aria-hidden="true" />
        </span>
        <span className="asset-copy">
          <strong>{asset.name}</strong>
          <small>
            {asset.kind} · {formatFileSize(asset.size)}
            {asset.duration ? ` · ${formatDuration(asset.duration)}` : ""}
          </small>
        </span>
      </button>
      {selected ? (
        <button className="text-button danger" type="button" onClick={removeSelected}>
          Remove
        </button>
      ) : null}
    </li>
  );
}

function EmptyPreview({ onAddMedia }: { onAddMedia: () => void }) {
  return (
    <div className="empty-preview">
      <div className="empty-orbit" aria-hidden="true">
        <Upload size={42} />
      </div>
      <p className="eyebrow">Private by default</p>
      <h2>Drop media into the workspace</h2>
      <p>
        Build edits from local files, keep previews centered, and prepare exports without creating
        an account.
      </p>
      <button className="primary-button" type="button" onClick={onAddMedia}>
        <Upload size={18} aria-hidden="true" />
        Add media
      </button>
    </div>
  );
}

function SelectedPreview({ asset }: { asset: MediaAsset }) {
  return (
    <div className="selected-preview">
      <div className="preview-meta">
        <span>{asset.kind}</span>
        <strong>{asset.name}</strong>
        <span>{formatFileSize(asset.size)}</span>
      </div>
      <div className="preview-frame">
        {asset.kind === "image" ? (
          <img src={asset.objectUrl} alt={`Preview of ${asset.name}`} />
        ) : (
          <video src={asset.objectUrl} controls aria-label={`Preview of ${asset.name}`} />
        )}
      </div>
    </div>
  );
}

function EditorPanel({ asset }: { asset: MediaAsset | null }) {
  if (!asset) {
    return <p className="muted-copy">Select a media asset to reveal image or video tools.</p>;
  }

  if (asset.kind === "image") {
    return (
      <div className="tool-stack">
        <ToolButton
          icon={<Scissors size={16} aria-hidden="true" />}
          label="Crop presets"
          detail="1:1, 4:5, 9:16, 16:9"
        />
        <ToolButton
          icon={<RotateCcw size={16} aria-hidden="true" />}
          label="Rotate and flip"
          detail="Non-destructive transform queue"
        />
        <ToolButton
          icon={<Sparkles size={16} aria-hidden="true" />}
          label="Adjust"
          detail="Brightness, contrast, saturation"
        />
        <ToolButton
          icon={<Wand2 size={16} aria-hidden="true" />}
          label="Background removal"
          detail="Local model boundary"
        />
      </div>
    );
  }

  return (
    <div className="tool-stack">
      <ToolButton
        icon={<Scissors size={16} aria-hidden="true" />}
        label="Trim range"
        detail="Start/end inputs planned"
      />
      <ToolButton
        icon={<Sparkles size={16} aria-hidden="true" />}
        label="Speed"
        detail="Preset and custom controls"
      />
      <ToolButton
        icon={<Subtitles size={16} aria-hidden="true" />}
        label="Manual subtitles"
        detail="Cue editor and WebVTT export"
      />
    </div>
  );
}

function ExportPanel({ asset }: { asset: MediaAsset | null }) {
  return (
    <div className="export-box">
      <label>
        Format
        <select disabled={!asset} defaultValue={asset?.kind === "video" ? "mp4" : "png"}>
          <option value="png">PNG</option>
          <option value="jpeg">JPG</option>
          <option value="webp">WebP</option>
          <option value="mp4">MP4</option>
          <option value="webm">WebM</option>
        </select>
      </label>
      <label>
        Quality
        <input disabled={!asset} type="range" min="1" max="100" defaultValue="86" />
      </label>
      <button className="primary-button full-width" disabled={!asset} type="button">
        <Download size={18} aria-hidden="true" />
        Prepare export
      </button>
      <p className="muted-copy">
        Export jobs will run locally and show progress, cancel, retry, and errors.
      </p>
    </div>
  );
}

function ToolButton({
  icon,
  label,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  detail: string;
}) {
  return (
    <button className="tool-button" type="button">
      <span>{icon}</span>
      <strong>{label}</strong>
      <small>{detail}</small>
    </button>
  );
}

function createMediaAsset(file: File, index: number): MediaAsset {
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
    ...(kind ? {} : { error: "Unsupported media type" }),
  };
}

function getVisibleAssets(assets: readonly MediaAsset[], filter: MediaFilter): MediaAsset[] {
  if (filter === "all") {
    return [...assets];
  }

  return assets.filter((asset) => asset.kind === filter);
}

function capitalize(value: string): string {
  return value.slice(0, 1).toUpperCase() + value.slice(1);
}
