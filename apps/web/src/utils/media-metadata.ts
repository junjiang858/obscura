import type { MediaMetadataUpdate, WorkspaceAsset } from "../stores/media-store";

export async function readAssetMetadata(asset: WorkspaceAsset): Promise<MediaMetadataUpdate> {
  if (asset.kind === "image") {
    return readImageMetadata(asset.objectUrl);
  }

  return readVideoMetadata(asset.objectUrl);
}

function readImageMetadata(src: string): Promise<MediaMetadataUpdate> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      resolve({
        height: image.naturalHeight,
        width: image.naturalWidth,
      });
    };
    image.onerror = () => reject(new Error("Image metadata could not be loaded."));
    image.src = src;
  });
}

function readVideoMetadata(src: string): Promise<MediaMetadataUpdate> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      const metadata: MediaMetadataUpdate = {};

      if (Number.isFinite(video.duration)) {
        metadata.duration = video.duration;
      }

      if (video.videoHeight) {
        metadata.height = video.videoHeight;
      }

      if (video.videoWidth) {
        metadata.width = video.videoWidth;
      }

      resolve(metadata);
    };
    video.onerror = () => reject(new Error("Video metadata could not be loaded."));
    video.src = src;
  });
}
