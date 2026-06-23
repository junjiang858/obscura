import { formatFileSize } from "@obscura/media-core";
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
  videoPosterUrl,
}: {
  asset: WorkspaceAsset;
  isSelected: boolean;
  onRemoveSelected: () => void;
  onSelect: (assetId: string) => void;
  t: Copy;
  videoPosterUrl?: string | undefined;
}) {
  const metadata = `${getKindLabel(asset.kind, t)} ${formatFileSize(asset.size)}`;
  const isGeneratedAsset = Boolean(asset.generatedByJobId);

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
          ) : asset.kind === "video" && asset.status === "ready" && videoPosterUrl ? (
            <>
              <img alt="" data-testid="video-poster-thumbnail" src={videoPosterUrl} />
              <span className="asset-video-play" data-testid="video-poster-play">
                <StudioIcon name="play" size={18} />
              </span>
            </>
          ) : (
            <StudioIcon name={asset.kind === "video" ? "videoFile" : "warning"} size={28} />
          )}
        </span>
        <span className="asset-card-copy">
          <span className="asset-card-title-row">
            <span className="asset-name">{asset.name}</span>
            {isGeneratedAsset ? (
              <span className="asset-generated-tag">{t.generatedAsset}</span>
            ) : null}
          </span>
          <span className="asset-metadata">{metadata}</span>
        </span>
        <span className="asset-card-status">
          {asset.status === "unsupported" ? (
            <StudioIcon name="warning" size={17} />
          ) : (
            <span data-testid={`asset-kind-${asset.kind}`}>
              <StudioIcon
                filled={isSelected}
                name={asset.kind === "video" ? "movie" : "image"}
                size={17}
              />
            </span>
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
