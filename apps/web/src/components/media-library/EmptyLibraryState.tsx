import type { Copy } from "../../i18n";
import { StudioIcon } from "../../icons/studio-icons";

export function EmptyLibraryState({ onAddMedia, t }: { onAddMedia: () => void; t: Copy }) {
  return (
    <button className="library-dropzone" onClick={onAddMedia} type="button">
      <span className="empty-state-orb">
        <StudioIcon name="image" size={28} />
      </span>
      <strong>{t.noMediaYet}</strong>
      <small>{t.emptyLibrary}</small>
    </button>
  );
}
