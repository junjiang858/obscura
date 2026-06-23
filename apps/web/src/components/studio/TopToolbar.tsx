import type { ImageEditAction } from "@obscura/media-core";
import type { WorkerJob } from "@obscura/shared";
import type { Copy, Language } from "../../i18n";
import { StudioIcon } from "../../icons/studio-icons";
import type { WorkspaceAsset } from "../../stores/media-store";
import { BrandMarkCanvas } from "./BrandMarkCanvas";
import { ProcessingCenter } from "./ProcessingCenter";

export function TopToolbar({
  canEditSelectedImage,
  onApplyImageAction,
  onLanguageChange,
  onSelectAdjacent,
  processingJobs,
  selectedAsset,
  t,
  totalAssets,
  language,
}: {
  canEditSelectedImage: boolean;
  language: Language;
  onApplyImageAction: (action: ImageEditAction) => void;
  onLanguageChange: (language: Language) => void;
  onSelectAdjacent: (direction: 1 | -1) => void;
  processingJobs: WorkerJob[];
  selectedAsset: WorkspaceAsset | null;
  t: Copy;
  totalAssets: number;
}) {
  const hasAssets = totalAssets > 0;

  return (
    <header className="top-toolbar">
      <div className="brand-lockup">
        <BrandMarkCanvas label={t.brandMarkLabel} />
        <div className="brand-wordmark-wrap">
          <p className="brand-wordmark">{t.brand}</p>
        </div>
        <span className="local-advantage-tag">
          <StudioIcon filled name="shield" size={17} />
          {t.localAdvantage}
        </span>
      </div>

      <div className="top-center-tools">
        <div className="toolbar-segment asset-nav">
          <button
            aria-label={t.previousAsset}
            className="icon-button"
            disabled={!hasAssets}
            onClick={() => onSelectAdjacent(-1)}
            type="button"
          >
            <StudioIcon name="chevronLeft" size={20} />
          </button>
          <span className="asset-position">{selectedAsset ? selectedAsset.name : t.noAsset}</span>
          <button
            aria-label={t.nextAsset}
            className="icon-button"
            disabled={!hasAssets}
            onClick={() => onSelectAdjacent(1)}
            type="button"
          >
            <StudioIcon name="chevronRight" size={20} />
          </button>
        </div>

        <div className="toolbar-segment history-nav">
          <button
            aria-label={t.undoImageEdit}
            className="tool-button"
            disabled={!canEditSelectedImage}
            onClick={() => onApplyImageAction({ type: "undo" })}
            type="button"
          >
            <StudioIcon name="undo" size={18} />
            <span>{t.undoShort}</span>
          </button>
          <button
            aria-label={t.redoImageEdit}
            className="tool-button"
            disabled={!canEditSelectedImage}
            onClick={() => onApplyImageAction({ type: "redo" })}
            type="button"
          >
            <StudioIcon name="redo" size={18} />
            <span>{t.redoShort}</span>
          </button>
        </div>
      </div>

      <div className="top-settings">
        <ProcessingCenter jobs={processingJobs} t={t} />
        <label className="language-control">
          <StudioIcon name="language" size={18} />
          <select
            aria-label={t.language}
            onChange={(event) => onLanguageChange(event.currentTarget.value as Language)}
            value={language}
          >
            <option value="en">{t.english}</option>
            <option value="zh">{t.chinese}</option>
          </select>
        </label>
      </div>
    </header>
  );
}
