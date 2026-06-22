import type { MobileTab } from "../../app/types";
import type { Copy } from "../../i18n";
import { StudioIcon, type StudioIconName } from "../../icons/studio-icons";

const tabIcons: Record<MobileTab, StudioIconName> = {
  edit: "tune",
  export: "download",
  library: "photoLibrary",
  preview: "imageSearch",
};

export function MobileTabs({
  activeTab,
  onChange,
  tabs,
  t,
}: {
  activeTab: MobileTab;
  onChange: (tab: MobileTab) => void;
  tabs: MobileTab[];
  t: Copy;
}) {
  const labels: Record<MobileTab, string> = {
    edit: t.edit,
    export: t.export,
    library: t.library,
    preview: t.preview,
  };

  return (
    <nav aria-label={t.workspaceSections} className="mobile-tabs">
      {tabs.map((tab) => (
        <button
          aria-selected={activeTab === tab}
          className="mobile-tab"
          key={tab}
          onClick={() => onChange(tab)}
          role="tab"
          type="button"
        >
          <StudioIcon name={tabIcons[tab]} size={18} />
          <span>{labels[tab]}</span>
        </button>
      ))}
    </nav>
  );
}
