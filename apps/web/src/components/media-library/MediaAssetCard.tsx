import { formatFileSize } from "@local-media-studio/media-core";
import type { Copy } from "../../i18n";
import { getKindLabel } from "../../i18n";
import { StudioIcon } from "../../icons/studio-icons";
import type { WorkspaceAsset } from "../../stores/media-store";

export function MediaAssetCard({
  asset,
  isSelected,
  onRemoveSelected,
  onSelect,
  t,
}: {
  asset: WorkspaceAsset;
  isSelected: boolean;
  onRemoveSelected: () => void;
  onSelect: (assetId: string) => void;
  t: Copy;
}) {
  const metadata = `${getKindLabel(asset.kind, t)} ${formatFileSize(asset.size)}`;

  return (
    <li className="asset-list-item">
      <button
        aria-pressed={isSelected}
        className={`asset-card ${isSelected ? "is-selected" : ""}`}
        onClick={() => onSelect(asset.id)}
        type="button"
      >
        <span className="asset-thumb" data-kind={asset.kind}>
          {asset.kind === "image" && asset.status === "ready" ? (
            <img alt="" src={asset.objectUrl} />
          ) : (
            <StudioIcon name={asset.kind === "video" ? "videoFile" : "warning"} size={28} />
          )}
        </span>
        <span className="asset-card-copy">
          <span className="asset-name">{asset.name}</span>
          <span className="asset-metadata">{metadata}</span>
        </span>
        <span className="asset-card-status">
          {asset.status === "unsupported" ? (
            <StudioIcon name="warning" size={17} />
          ) : (
            <StudioIcon filled={isSelected} name={isSelected ? "checkCircle" : "image"} size={17} />
          )}
        </span>
      </button>
      {isSelected ? (
        <button className="text-button danger" onClick={onRemoveSelected} type="button">
          <StudioIcon name="delete" size={16} />
          <span>{t.remove}</span>
        </button>
      ) : null}
    </li>
  );
}
