import type { ReactNode } from "react";
import { StudioIcon, type StudioIconName } from "../../icons/studio-icons";

export function PanelHeader({
  action,
  eyebrow,
  icon,
  title,
}: {
  action?: ReactNode;
  eyebrow?: string;
  icon: StudioIconName;
  title: string;
}) {
  return (
    <div className="panel-header">
      <span className="panel-header-icon">
        <StudioIcon name={icon} size={18} />
      </span>
      <div>
        {eyebrow ? <p>{eyebrow}</p> : null}
        <h2>{title}</h2>
      </div>
      {action ? <div className="panel-header-action">{action}</div> : null}
    </div>
  );
}
