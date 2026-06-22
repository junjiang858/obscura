import type { ImageEditAction, ImageEditState } from "@local-media-studio/media-core";
import type { Copy } from "../../i18n";
import { StudioIcon } from "../../icons/studio-icons";
import { AdjustmentControl } from "./AdjustmentControl";
import { CropPresetGrid } from "./CropPresetGrid";
import { ProgressiveToolRow } from "./ProgressiveToolRow";

export function ImageEditorPanel({
  activeTab,
  imageState,
  onApply,
  t,
}: {
  activeTab: string;
  imageState: ImageEditState;
  onApply: (action: ImageEditAction) => void;
  t: Copy;
}) {
  return (
    <section aria-label={t.imageEditControls} className="editor-panel-content">
      {activeTab === "transform" ? (
        <div className="tool-section">
          <div className="tool-section-heading">
            <StudioIcon name="cropRotate" size={18} />
            <h3>{t.cropRotate}</h3>
          </div>
          <CropPresetGrid activeAspect={imageState.cropAspect} onApply={onApply} t={t} />
          <div className="tool-grid two-col">
            <button
              className="tool-button"
              onClick={() => onApply({ type: "rotate-counterclockwise" })}
              type="button"
            >
              <StudioIcon name="cropRotate" size={18} />
              <span>{t.rotateMinus}</span>
            </button>
            <button
              className="tool-button"
              onClick={() => onApply({ type: "rotate-clockwise" })}
              type="button"
            >
              <StudioIcon name="cropRotate" size={18} />
              <span>{t.rotatePlus}</span>
            </button>
            <button
              className="tool-button"
              onClick={() => onApply({ type: "toggle-flip-horizontal" })}
              type="button"
            >
              <StudioIcon name="flipHorizontal" size={18} />
              <span>{t.flipHorizontal}</span>
            </button>
            <button
              className="tool-button"
              onClick={() => onApply({ type: "toggle-flip-vertical" })}
              type="button"
            >
              <StudioIcon name="flipVertical" size={18} />
              <span>{t.flipVertical}</span>
            </button>
          </div>
          <div className="form-field">
            <label htmlFor="output-width">{t.outputWidth}</label>
            <input
              id="output-width"
              min={16}
              onChange={(event) =>
                onApply({
                  type: "set-resize-width",
                  width: event.currentTarget.value ? Number(event.currentTarget.value) : null,
                })
              }
              placeholder="Auto"
              type="number"
              value={imageState.resizeWidth ?? ""}
            />
          </div>
        </div>
      ) : null}

      {activeTab === "adjustments" ? (
        <div className="tool-section">
          <div className="tool-section-heading">
            <StudioIcon name="tune" size={18} />
            <h3>{t.adjustments}</h3>
          </div>
          <AdjustmentControl
            adjustment="brightness"
            label={t.brightness}
            onApply={onApply}
            value={imageState.adjustments.brightness}
          />
          <AdjustmentControl
            adjustment="contrast"
            label={t.contrast}
            onApply={onApply}
            value={imageState.adjustments.contrast}
          />
          <AdjustmentControl
            adjustment="saturation"
            label={t.saturation}
            onApply={onApply}
            value={imageState.adjustments.saturation}
          />
          <ProgressiveToolRow
            detail={t.autoEnhanceDetail}
            icon="formatPaint"
            title={t.autoEnhance}
          />
        </div>
      ) : null}

      {activeTab === "layers" ? (
        <div className="tool-section">
          <div className="tool-section-heading">
            <StudioIcon name="textFields" size={18} />
            <h3>{t.layers}</h3>
          </div>
          <div className="form-field">
            <label htmlFor="watermark-text">{t.watermarkText}</label>
            <input
              id="watermark-text"
              onChange={(event) =>
                onApply({ text: event.currentTarget.value, type: "set-watermark" })
              }
              placeholder={t.optional}
              type="text"
              value={imageState.watermarkText}
            />
          </div>
        </div>
      ) : null}

      {activeTab === "background" ? (
        <div className="tool-section">
          <div className="tool-section-heading">
            <StudioIcon name="backgroundReplace" size={18} />
            <h3>{t.backgroundTab}</h3>
          </div>
          <ProgressiveToolRow
            detail={t.backgroundRemoverDetail}
            icon="backgroundReplace"
            title={t.backgroundRemover}
          />
        </div>
      ) : null}
    </section>
  );
}
