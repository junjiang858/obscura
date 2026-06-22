import type { en } from "./messages/en";

export type Language = "en" | "zh";
export type Copy = {
  readonly [Key in keyof typeof en]: string;
};
