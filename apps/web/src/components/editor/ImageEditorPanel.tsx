import { useEffect, useState } from "react";
import type {
  ImageAnnotation,
  ImageEditAction,
  ImageEditState,
  ImageExportFormat,
  WatermarkPosition,
} from "@local-media-studio/media-core";
import type { WorkerJob } from "@local-media-studio/shared";
import {
  imageExportFormats,
  supportsImageQuality,
  type ImageExportSettings,
} from "../../config/media";
import type { Copy } from "../../i18n";
import { StudioIcon } from "../../icons/studio-icons";
import { getImageExportAvailability, type ImageExportAvailability } from "../../utils/image-export";
import { AdjustmentControl } from "./AdjustmentControl";
import { CropPresetGrid } from "./CropPresetGrid";
import { FilterPresetGrid } from "./FilterPresetGrid";
import { ProgressiveToolRow } from "./ProgressiveToolRow";

const annotationColor = "#f8fbff";
const watermarkPositionOptions: Array<{ label: keyof Copy; value: WatermarkPosition }> = [
  { label: "watermarkBottomRight", value: "bottom-right" },
  { label: "watermarkBottomLeft", value: "bottom-left" },
  { label: "watermarkTopRight", value: "top-right" },
  { label: "watermarkTopLeft", value: "top-left" },
  { label: "watermarkCenter", value: "center" },
];

export function ImageEditorPanel({
  activeTab,
  backgroundRemovalJob,
  exportSettings,
  imageState,
  onApply,
  onExportSettingsChange,
  onGeneratePreview,
  onRemoveBackground,
  t,
}: {
  activeTab: string;
  backgroundRemovalJob: WorkerJob | null;
  exportSettings: ImageExportSettings | null;
  imageState: ImageEditState;
  onApply: (action: ImageEditAction) => void;
  onExportSettingsChange: (patch: Partial<ImageExportSettings>) => void;
  onGeneratePreview: () => void;
  onRemoveBackground: () => void;
  t: Copy;
}) {
  const [imageAvailability, setImageAvailability] = useState<
    Partial<Record<ImageExportFormat, ImageExportAvailability>>
  >({});
  const isRemovingBackground =
    backgroundRemovalJob?.status === "queued" ||
    backgroundRemovalJob?.status === "loading" ||
    backgroundRemovalJob?.status === "processing";
  const activeImageAvailability = exportSettings ? imageAvailability[exportSettings.format] : null;

  useEffect(() => {
    let canceled = false;

    void getImageExportAvailability(imageExportFormats, t).then((availability) => {
      if (!canceled) {
        setImageAvailability(availability);
      }
    });

    return () => {
      canceled = true;
    };
  }, [t]);

  useEffect(() => {
    if (!exportSettings || !activeImageAvailability || activeImageAvailability.available) {
      return;
    }

    const fallbackFormat = imageExportFormats.find(
      (format) => imageAvailability[format]?.available,
    );

    if (fallbackFormat && fallbackFormat !== exportSettings.format) {
      onExportSettingsChange({ format: fallbackFormat });
    }
  }, [activeImageAvailability, exportSettings, imageAvailability, onExportSettingsChange]);

  function handleQualityDraftChange(value: string) {
    if (!value.trim()) {
      return;
    }

    const parsedQuality = Number(value);

    if (!Number.isFinite(parsedQuality)) {
      return;
    }

    onExportSettingsChange({
      quality: Math.min(100, Math.max(1, parsedQuality)),
    });
  }

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
          <button
            className="tool-button full-width"
            onClick={() => onApply({ type: "reset-transform" })}
            type="button"
          >
            <StudioIcon name="restartAlt" size={18} />
            <span>{t.resetTransform}</span>
          </button>
          <button className="secondary-button full-width" onClick={onGeneratePreview} type="button">
            <StudioIcon name="checkCircle" size={17} />
            <span>{t.previewCropResult}</span>
          </button>
        </div>
      ) : null}

      {activeTab === "adjustments" ? (
        <div className="tool-section">
          <div className="tool-section-heading">
            <StudioIcon name="tune" size={18} />
            <h3>{t.adjustments}</h3>
          </div>
          <FilterPresetGrid
            activePreset={imageState.filterPreset}
            onApply={onApply}
            strength={imageState.filterStrength}
            t={t}
          />
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
          <button
            className="tool-button full-width"
            onClick={() => onApply({ type: "reset-beautify" })}
            type="button"
          >
            <StudioIcon name="undo" size={18} />
            <span>{t.resetBeautify}</span>
          </button>
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
          <div className="form-field">
            <label htmlFor="watermark-position">{t.watermarkPosition}</label>
            <select
              id="watermark-position"
              onChange={(event) =>
                onApply({
                  position: event.currentTarget.value as WatermarkPosition,
                  type: "set-watermark-position",
                })
              }
              value={imageState.watermarkPosition}
            >
              {watermarkPositionOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {t[option.label]}
                </option>
              ))}
            </select>
          </div>
          <div className="annotation-controls">
            <p className="field-label">{t.annotations}</p>
            <div className="tool-grid two-col">
              <button
                className="tool-button"
                onClick={() =>
                  onApply({ annotation: createAnnotation("text", t), type: "add-annotation" })
                }
                type="button"
              >
                <StudioIcon name="textFields" size={18} />
                <span>{t.addTextAnnotation}</span>
              </button>
              <button
                className="tool-button"
                onClick={() =>
                  onApply({ annotation: createAnnotation("rectangle", t), type: "add-annotation" })
                }
                type="button"
              >
                <StudioIcon name="crop" size={18} />
                <span>{t.addRectangleAnnotation}</span>
              </button>
              <button
                className="tool-button"
                onClick={() =>
                  onApply({ annotation: createAnnotation("arrow", t), type: "add-annotation" })
                }
                type="button"
              >
                <StudioIcon name="chevronRight" size={18} />
                <span>{t.addArrowAnnotation}</span>
              </button>
              <button
                className="tool-button"
                onClick={() =>
                  onApply({ annotation: createAnnotation("brush", t), type: "add-annotation" })
                }
                type="button"
              >
                <StudioIcon name="stylusNote" size={18} />
                <span>{t.addBrushAnnotation}</span>
              </button>
            </div>
            <div aria-label={t.annotations} className="annotation-list">
              {imageState.annotations.length === 0 ? (
                <p className="empty-panel-copy">{t.noAnnotations}</p>
              ) : (
                imageState.annotations.map((annotation) => (
                  <div className="annotation-row" key={annotation.id}>
                    <span>{getAnnotationLabel(annotation, t)}</span>
                    <button
                      aria-label={`${t.removeAnnotation}: ${getAnnotationLabel(annotation, t)}`}
                      onClick={() =>
                        onApply({ annotationId: annotation.id, type: "remove-annotation" })
                      }
                      type="button"
                    >
                      <StudioIcon name="delete" size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
          <button
            className="tool-button full-width"
            onClick={() => onApply({ type: "reset-layers" })}
            type="button"
          >
            <StudioIcon name="restartAlt" size={18} />
            <span>{t.resetLayers}</span>
          </button>
        </div>
      ) : null}

      {activeTab === "format" && exportSettings ? (
        <div className="tool-section">
          <div className="tool-section-heading">
            <StudioIcon name="formatPaint" size={18} />
            <h3>{t.formatConversion}</h3>
          </div>
          <div className="form-field">
            <label htmlFor="image-format">{t.imageFormat}</label>
            <select
              id="image-format"
              onChange={(event) =>
                onExportSettingsChange({
                  format: event.currentTarget.value as ImageExportFormat,
                })
              }
              value={exportSettings.format}
            >
              {imageExportFormats.map((format) => {
                const availability = imageAvailability[format];
                const disabled = availability ? !availability.available : false;

                return (
                  <option disabled={disabled} key={format} value={format}>
                    {`${format.toUpperCase()}${disabled ? ` - ${t.unsupportedFormat}` : ""}`}
                  </option>
                );
              })}
            </select>
          </div>
          {supportsImageQuality(exportSettings.format) ? (
            <div className="form-field">
              <label htmlFor="image-quality">{t.quality}</label>
              <input
                id="image-quality"
                defaultValue={exportSettings.quality}
                max={100}
                min={1}
                onChange={(event) => handleQualityDraftChange(event.currentTarget.value)}
                onBlur={(event) => {
                  if (!event.currentTarget.value.trim()) {
                    event.currentTarget.value = String(exportSettings.quality);
                  }
                }}
                type="number"
              />
            </div>
          ) : null}
          <p className="export-helper">
            {activeImageAvailability?.reason ??
              (supportsImageQuality(exportSettings.format)
                ? t.imageQualityHelper
                : t.imageFormatHelper)}
          </p>
          <button
            className="secondary-button full-width"
            disabled={activeImageAvailability ? !activeImageAvailability.available : false}
            onClick={onGeneratePreview}
            type="button"
          >
            <StudioIcon name="checkCircle" size={17} />
            <span>{t.generateImageFormatPreview}</span>
          </button>
        </div>
      ) : null}

      {activeTab === "background" ? (
        <div className="tool-section">
          <div className="tool-section-heading">
            <StudioIcon name="backgroundReplace" size={18} />
            <h3>{t.backgroundTab}</h3>
          </div>
          <p className="export-helper">{t.backgroundRemoverDetail}</p>
          <button
            className="primary-button full-width"
            disabled={isRemovingBackground}
            onClick={onRemoveBackground}
            type="button"
          >
            <StudioIcon name="backgroundReplace" size={20} />
            <span>
              {backgroundRemovalJob?.status === "failed"
                ? t.backgroundRemovalRetry
                : isRemovingBackground
                  ? t.backgroundRemovalRunning
                  : t.backgroundRemovalAction}
            </span>
          </button>
          {backgroundRemovalJob ? (
            <div className={`job-message ${backgroundRemovalJob.status}`}>
              <StudioIcon
                name={backgroundRemovalJob.status === "failed" ? "warning" : "checkCircle"}
                size={17}
              />
              <span>
                {backgroundRemovalJob.error?.message ??
                  backgroundRemovalJob.message ??
                  t.backgroundRemovalRunning}
              </span>
            </div>
          ) : null}
          {isRemovingBackground && typeof backgroundRemovalJob?.progress === "number" ? (
            <div
              aria-label={t.backgroundRemovalRunning}
              aria-valuemax={100}
              aria-valuemin={0}
              aria-valuenow={Math.round(backgroundRemovalJob.progress)}
              className="job-progress"
              role="progressbar"
            >
              <span style={{ width: `${backgroundRemovalJob.progress}%` }} />
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function createAnnotation(type: ImageAnnotation["type"], t: Copy): ImageAnnotation {
  const id = `${type}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

  if (type === "text") {
    return {
      color: annotationColor,
      id,
      text: t.annotationText,
      type: "text",
      x: 0.16,
      y: 0.18,
    };
  }

  if (type === "rectangle") {
    return {
      color: annotationColor,
      height: 0.26,
      id,
      type: "rectangle",
      width: 0.34,
      x: 0.18,
      y: 0.2,
    };
  }

  if (type === "arrow") {
    return {
      color: annotationColor,
      endX: 0.72,
      endY: 0.38,
      id,
      type: "arrow",
      x: 0.32,
      y: 0.24,
    };
  }

  return {
    color: annotationColor,
    id,
    points: [
      { x: 0.2, y: 0.68 },
      { x: 0.32, y: 0.6 },
      { x: 0.46, y: 0.66 },
      { x: 0.62, y: 0.55 },
    ],
    type: "brush",
    x: 0.2,
    y: 0.68,
  };
}

function getAnnotationLabel(annotation: ImageAnnotation, t: Copy) {
  if (annotation.type === "text") {
    return t.annotationText;
  }

  if (annotation.type === "rectangle") {
    return t.annotationRectangle;
  }

  if (annotation.type === "arrow") {
    return t.annotationArrow;
  }

  return t.annotationBrush;
}
