import type { Copy } from "../../i18n";
import { StudioIcon } from "../../icons/studio-icons";

export function EmptyPreview({ onAddMedia, t }: { onAddMedia: () => void; t: Copy }) {
  return (
    <section className="empty-preview" aria-labelledby="empty-preview-heading">
      <div className="empty-upload-panel">
        <div className="empty-preview-symbol-wrap">
          <div className="empty-preview-symbol">
            <StudioIcon name="uploadFile" size={42} />
          </div>
          <span className="empty-preview-add-badge" aria-hidden="true">
            <StudioIcon name="add" size={18} />
          </span>
        </div>
        <div className="empty-preview-copy">
          <h1 id="empty-preview-heading">{t.emptyPreviewTitle}</h1>
          <p>{t.emptyPreviewBody}</p>
        </div>
        <button className="primary-button large" onClick={onAddMedia} type="button">
          <StudioIcon name="uploadFile" size={21} />
          <span>{t.importMedia}</span>
        </button>
        <div className="empty-capabilities" aria-hidden="true">
          <span>{t.emptyCapabilityQuality}</span>
          <span>{t.emptyCapabilityRaw}</span>
          <span>{t.emptyCapabilityFormats}</span>
        </div>
      </div>
    </section>
  );
}
