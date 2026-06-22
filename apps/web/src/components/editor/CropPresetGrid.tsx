import type { ImageCropAspect, ImageEditAction } from "@local-media-studio/media-core";
import { cropPresets } from "../../config/media";
import type { Copy } from "../../i18n";
import { StudioIcon } from "../../icons/studio-icons";

export function CropPresetGrid({
  activeAspect,
  onApply,
  t,
}: {
  activeAspect: ImageCropAspect;
  onApply: (action: ImageEditAction) => void;
  t: Copy;
}) {
  return (
    <div aria-label={t.cropPreset} className="crop-control" role="group">
      <p className="field-label">{t.cropPreset}</p>
      <div className="crop-preset-grid">
        {cropPresets.map((preset) => (
          <button
            aria-pressed={activeAspect === preset.aspect}
            className="crop-preset-card"
            key={preset.aspect}
            onClick={() => onApply({ aspect: preset.aspect, type: "set-crop-aspect" })}
            type="button"
          >
            <span className={`crop-preset-shape ${preset.previewClass}`}>
              <StudioIcon name={preset.icon} size={18} />
            </span>
            <span>{preset.label(t)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
