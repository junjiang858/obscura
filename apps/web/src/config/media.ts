import type { ImageCropAspect, ImageExportFormat } from "@local-media-studio/media-core";
import type { Copy } from "../i18n";
import type { StudioIconName } from "../icons/studio-icons";

export type CropPreset = {
  aspect: ImageCropAspect;
  label: (t: Copy) => string;
  icon: StudioIconName;
  previewClass: string;
};

export const cropPresets: CropPreset[] = [
  { aspect: "free", label: (t) => t.original, icon: "aspectRatio", previewClass: "free" },
  { aspect: "1:1", label: (t) => t.square, icon: "crop", previewClass: "square" },
  { aspect: "4:5", label: (t) => t.portrait, icon: "cropPortrait", previewClass: "portrait" },
  { aspect: "16:9", label: (t) => t.landscape, icon: "cropLandscape", previewClass: "landscape" },
  { aspect: "9:16", label: (t) => t.story, icon: "fitScreen", previewClass: "story" },
];

export const imageExportFormats: ImageExportFormat[] = ["png", "jpeg", "webp"];

export const defaultImageExportFormat: ImageExportFormat = "png";
export const defaultImageQuality = 86;
