import { mediaFilters } from "../../config/workspace";
import type { Copy } from "../../i18n";
import { getFilterLabel } from "../../i18n";
import { StudioIcon } from "../../icons/studio-icons";
import type { MediaFilter, WorkspaceAsset } from "../../stores/media-store";
import { EmptyLibraryState } from "./EmptyLibraryState";
import { MediaAssetCard } from "./MediaAssetCard";
import { PanelHeader } from "../studio/PanelHeader";

export function MediaLibraryPanel({
  activeFilter,
  assets,
  isVisible,
  onAddMedia,
  onFilterChange,
  onRemoveSelected,
  onSelectAsset,
  selectedAssetId,
  t,
  totalAssets,
}: {
  activeFilter: MediaFilter;
  assets: WorkspaceAsset[];
  isVisible: boolean;
  onAddMedia: () => void;
  onFilterChange: (filter: MediaFilter) => void;
  onRemoveSelected: () => void;
  onSelectAsset: (assetId: string) => void;
  selectedAssetId: string | null;
  t: Copy;
  totalAssets: number;
}) {
  return (
    <aside className={`panel media-panel ${isVisible ? "is-mobile-visible" : ""}`}>
      <PanelHeader
        action={
          <button className="primary-button media-add-button" onClick={onAddMedia} type="button">
            <StudioIcon name="add" size={18} />
            <span>{t.addMedia}</span>
          </button>
        }
        eyebrow={t.localStorage}
        icon="photoLibrary"
        title={t.library}
      />

      <div className="media-panel-meta">
        <span>{`${totalAssets} ${t.assets}`}</span>
      </div>

      <div aria-label={t.filterMediaType} className="segmented-control" role="group">
        <StudioIcon className="segmented-control-icon" name="filter" size={16} />
        {mediaFilters.map((filter) => (
          <button
            aria-pressed={activeFilter === filter}
            key={filter}
            onClick={() => onFilterChange(filter)}
            type="button"
          >
            {getFilterLabel(filter, t)}
          </button>
        ))}
      </div>

      {assets.length ? (
        <ul className="asset-list">
          {assets.map((asset) => (
            <MediaAssetCard
              asset={asset}
              isSelected={asset.id === selectedAssetId}
              key={asset.id}
              onRemoveSelected={onRemoveSelected}
              onSelect={onSelectAsset}
              t={t}
            />
          ))}
        </ul>
      ) : (
        <EmptyLibraryState onAddMedia={onAddMedia} t={t} />
      )}
    </aside>
  );
}
