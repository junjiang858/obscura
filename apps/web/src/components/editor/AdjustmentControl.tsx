import type { CSSProperties } from "react";
import type { ImageAdjustment, ImageEditAction } from "@local-media-studio/media-core";

export function AdjustmentControl({
  adjustment,
  label,
  onApply,
  value,
}: {
  adjustment: ImageAdjustment;
  label: string;
  onApply: (action: ImageEditAction) => void;
  value: number;
}) {
  const id = `${adjustment}-adjustment`;
  const rangeStyle = { "--range-progress": `${(value + 100) / 2}%` } as CSSProperties;

  return (
    <div className="adjustment-control">
      <div className="adjustment-label-row">
        <label htmlFor={id}>{label}</label>
        <output htmlFor={id}>{formatAdjustmentValue(value)}</output>
      </div>
      <div className="adjustment-input-row">
        <input
          id={id}
          max={100}
          min={-100}
          onChange={(event) =>
            onApply({
              adjustment,
              type: "set-adjustment",
              value: Number(event.currentTarget.value),
            })
          }
          type="number"
          value={value}
        />
        <input
          aria-hidden="true"
          max={100}
          min={-100}
          onChange={(event) =>
            onApply({
              adjustment,
              type: "set-adjustment",
              value: Number(event.currentTarget.value),
            })
          }
          tabIndex={-1}
          type="range"
          style={rangeStyle}
          value={value}
        />
      </div>
    </div>
  );
}

function formatAdjustmentValue(value: number) {
  if (value > 0) {
    return `+${value}`;
  }

  return String(value);
}
