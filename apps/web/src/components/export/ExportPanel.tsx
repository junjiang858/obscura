import { useEffect, useState } from "react";
import type { ImageEditState, ImageExportFormat } from "@local-media-studio/media-core";
import {
  defaultImageExportFormat,
  defaultImageQuality,
  imageExportFormats,
} from "../../config/media";
import type { Copy } from "../../i18n";
import { StudioIcon } from "../../icons/studio-icons";
import type { WorkspaceAsset } from "../../stores/media-store";
import {
  exportEditedImage,
  getExportErrorMessage,
  isAbortError,
  saveImageExport,
  type ImageExportResult,
} from "../../utils/image-export";

type ExportStatus = "idle" | "busy" | "ready" | "saved" | "canceled" | "failed";

export function ExportPanel({
  imageState,
  selectedAsset,
  t,
}: {
  imageState: ImageEditState | null;
  selectedAsset: WorkspaceAsset | null;
  t: Copy;
}) {
  const [format, setFormat] = useState<ImageExportFormat>(defaultImageExportFormat);
  const [quality, setQuality] = useState(defaultImageQuality);
  const [status, setStatus] = useState<ExportStatus>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [result, setResult] = useState<ImageExportResult | null>(null);
  const canExportImage =
    selectedAsset?.kind === "image" && selectedAsset.status === "ready" && Boolean(imageState);

  useEffect(() => {
    return () => {
      if (result) {
        URL.revokeObjectURL(result.url);
      }
    };
  }, [result]);

  async function handleExport() {
    if (!selectedAsset || !imageState || selectedAsset.kind !== "image") {
      setStatus("failed");
      setMessage(t.videoExportNext);
      return;
    }

    setStatus("busy");
    setMessage(t.preparingImageExport);

    try {
      const nextResult = await exportEditedImage({
        asset: selectedAsset,
        format,
        quality,
        state: imageState,
        t,
      });

      if (result) {
        URL.revokeObjectURL(result.url);
      }

      setResult(nextResult);
      setStatus("ready");
      setMessage(t.downloadReady);
      await saveImageExport(nextResult, format);
      setStatus("saved");
      setMessage(t.exportSaved);
    } catch (error) {
      if (isAbortError(error)) {
        setStatus("canceled");
        setMessage(t.exportCanceled);
        return;
      }

      setStatus("failed");
      setMessage(getExportErrorMessage(error, t));
    }
  }

  return (
    <div className="export-panel-content">
      <div className="form-field">
        <label htmlFor="export-format">{t.format}</label>
        <select
          id="export-format"
          onChange={(event) => setFormat(event.currentTarget.value as ImageExportFormat)}
          value={format}
        >
          {imageExportFormats.map((exportFormat) => (
            <option key={exportFormat} value={exportFormat}>
              {exportFormat.toUpperCase()}
            </option>
          ))}
        </select>
      </div>
      <div className="form-field">
        <label htmlFor="export-quality">{t.quality}</label>
        <input
          id="export-quality"
          max={100}
          min={1}
          onChange={(event) => setQuality(Number(event.currentTarget.value))}
          type="number"
          value={quality}
        />
      </div>
      <p className="export-helper">
        {selectedAsset?.kind === "video" ? t.videoExportNext : t.imageExportHelper}
      </p>
      <button
        className="primary-button full-width"
        disabled={!canExportImage || status === "busy"}
        onClick={() => void handleExport()}
        type="button"
      >
        <StudioIcon name="download" size={20} />
        <span>{status === "busy" ? t.prepareExport : t.exportCurrentAsset}</span>
      </button>
      {message ? (
        <p className={`job-message ${status}`}>
          <StudioIcon name={status === "failed" ? "warning" : "checkCircle"} size={17} />
          <span>{message}</span>
        </p>
      ) : null}
      {result && status === "ready" ? (
        <a className="download-link" download={result.filename} href={result.url}>
          {`${t.download} ${result.filename}`}
        </a>
      ) : null}
    </div>
  );
}
