import { removeBackground } from "@imgly/background-removal";
import type { WorkerJobProgressUpdate } from "@local-media-studio/media-core";

export type BackgroundRemovalResult = {
  blob: Blob;
  file: File;
};

export async function runImageBackgroundRemoval({
  onProgress,
  source,
}: {
  onProgress?: (update: WorkerJobProgressUpdate) => void;
  source: File;
}): Promise<BackgroundRemovalResult> {
  onProgress?.({
    message: "Loading background model",
    progress: 1,
    status: "loading",
  });

  const blob = await removeBackground(source, {
    model: "isnet_quint8",
    output: {
      format: "image/png",
      quality: 0.92,
    },
    progress: (message, current, total) => {
      onProgress?.({
        message,
        progress: total > 0 ? Math.round((current / total) * 100) : 50,
        status: "processing",
      });
    },
    proxyToWorker: true,
  });
  const file = new File([blob], `${sanitizeBaseName(source.name)}-background-removed.png`, {
    lastModified: Date.now(),
    type: "image/png",
  });

  return { blob, file };
}

export function getBackgroundRemovalErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function sanitizeBaseName(fileName: string): string {
  const withoutExtension = fileName.replace(/\.[^.]+$/, "");
  const slug = withoutExtension
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "image";
}
