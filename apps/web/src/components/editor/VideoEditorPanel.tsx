import type { Copy } from "../../i18n";
import { ProgressiveToolRow } from "./ProgressiveToolRow";

export function VideoEditorPanel({ activeTab, t }: { activeTab: string; t: Copy }) {
  return (
    <section className="editor-panel-content">
      {activeTab === "trim" ? (
        <ProgressiveToolRow detail={t.trimPlanned} icon="contentCut" title={t.trimRange} />
      ) : null}
      {activeTab === "speed" ? (
        <ProgressiveToolRow detail={t.speedDetail} icon="speed" title={t.speed} />
      ) : null}
      {activeTab === "subtitles" ? (
        <ProgressiveToolRow detail={t.subtitleDetail} icon="subtitles" title={t.manualSubtitles} />
      ) : null}
      {activeTab === "format" ? (
        <ProgressiveToolRow detail={t.videoExportNext} icon="formatPaint" title={t.formatTab} />
      ) : null}
    </section>
  );
}
