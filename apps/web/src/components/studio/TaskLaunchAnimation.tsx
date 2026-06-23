import type { Copy } from "../../i18n";
import { StudioIcon, type StudioIconName } from "../../icons/studio-icons";

export type TaskLaunchMarker = {
  icon?: StudioIconName;
  id: string;
  label: string;
};

export function TaskLaunchAnimation({ launch, t }: { launch: TaskLaunchMarker | null; t: Copy }) {
  return (
    <div aria-live="polite" className="task-launch-layer">
      {launch ? (
        <div className="task-launch-announcement" key={launch.id}>
          <span className="sr-only">{`${launch.label} ${t.addedToQueue}`}</span>
          <span aria-hidden="true" className="task-launch-token" data-testid="task-launch-token">
            <StudioIcon name={launch.icon ?? "download"} size={18} />
            <span className="task-launch-token-label">{launch.label}</span>
          </span>
        </div>
      ) : null}
    </div>
  );
}
