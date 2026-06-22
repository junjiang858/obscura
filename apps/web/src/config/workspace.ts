import type { MobileTab } from "../app/types";
import type { MediaFilter } from "../stores/media-store";

export const mediaFilters: MediaFilter[] = ["all", "image", "video"];

export const emptyWorkspaceTabs: MobileTab[] = ["library", "preview"];
export const populatedWorkspaceTabs: MobileTab[] = ["library", "preview", "edit", "export"];
