import { en } from "./messages/en";
import { zh } from "./messages/zh";
import type { Copy, Language } from "./types";
import type { MediaFilter } from "../stores/media-store";
import type { MediaKind } from "@local-media-studio/shared";

export type { Copy, Language };

export const messages: Record<Language, Copy> = {
  en,
  zh,
};

export function detectInitialLanguage(): Language {
  if (typeof navigator !== "undefined" && navigator.language.toLowerCase().startsWith("zh")) {
    return "zh";
  }

  return "en";
}

export function getKindLabel(kind: MediaKind, t: Copy): string {
  return kind === "image" ? t.image : t.video;
}

export function getFilterLabel(filter: MediaFilter, t: Copy): string {
  if (filter === "all") {
    return t.all;
  }

  return getKindLabel(filter, t);
}
