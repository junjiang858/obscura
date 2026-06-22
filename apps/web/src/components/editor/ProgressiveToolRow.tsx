import type { StudioIconName } from "../../icons/studio-icons";
import { StudioIcon } from "../../icons/studio-icons";

export function ProgressiveToolRow({
  detail,
  icon,
  title,
}: {
  detail: string;
  icon: StudioIconName;
  title: string;
}) {
  return (
    <button className="progressive-tool-row" disabled type="button">
      <span className="progressive-tool-icon">
        <StudioIcon name={icon} size={18} />
      </span>
      <span>
        <strong>{title}</strong>
        <small>{detail}</small>
      </span>
      <StudioIcon name="chevronRight" size={18} />
    </button>
  );
}
