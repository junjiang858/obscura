import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type WheelEvent,
} from "react";
import { formatDuration, formatFileSize, getActiveSubtitleCue } from "@obscura/media-core";
import type { ImageEditAction, ImageEditState, VideoEditState } from "@obscura/media-core";
import type { ImageExportSettings } from "../../config/media";
import type { Copy } from "../../i18n";
import { getKindLabel } from "../../i18n";
import { StudioIcon } from "../../icons/studio-icons";
import { showStudioError, showStudioInfo, showStudioSuccess } from "../studio/studio-toast";
import type { WorkspaceAsset } from "../../stores/media-store";
import {
  exportEditedImage,
  getExportErrorMessage as getImageExportErrorMessage,
} from "../../utils/image-export";
import { exportEditedVideo, getVideoExportErrorMessage } from "../../utils/video-export";
import type { GeneratedPreview } from "../../utils/generated-preview";
import { ImagePreviewPane, type PreviewBounds } from "./ImagePreviewPane";
import { PreviewToolbar } from "./PreviewToolbar";
import type { PreviewBackground } from "./types";
import { VideoPreviewWorkbench, type VideoPreviewStatus } from "./VideoPreviewWorkbench";

export function SelectedPreview({
  asset,
  compareOriginal,
  currentPreviewFingerprint,
  generatedPreview,
  imageExportSettings,
  imagePreviewRequestKey,
  imageState,
  isFullscreen,
  onApplyImageAction,
  onCompareToggle,
  onFullscreenToggle,
  onGeneratedPreview,
  onPreviewBackgroundChange,
  onZoomChange,
  previewBackground,
  t,
  videoState,
  videoPreviewRequestKey,
  zoom,
}: {
  asset: WorkspaceAsset;
  compareOriginal: boolean;
  currentPreviewFingerprint: string | null;
  generatedPreview: GeneratedPreview | null;
  imageExportSettings: ImageExportSettings | null;
  imagePreviewRequestKey: number;
  imageState: ImageEditState | null;
  isFullscreen: boolean;
  onApplyImageAction: (action: ImageEditAction) => void;
  onCompareToggle: () => void;
  onFullscreenToggle: () => void;
  onGeneratedPreview: (preview: GeneratedPreview) => void;
  onPreviewBackgroundChange: (background: PreviewBackground) => void;
  onZoomChange: (zoom: number) => void;
  previewBackground: PreviewBackground;
  t: Copy;
  videoState: VideoEditState | null;
  videoPreviewRequestKey: number;
  zoom: number;
}) {
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [previewBounds, setPreviewBounds] = useState<PreviewBounds | null>(null);
  const [currentVideoTime, setCurrentVideoTime] = useState(0);
  const [imagePreviewNotice, setImagePreviewNotice] = useState<ImagePreviewNotice | null>(null);
  const [isVideoLooping, setIsVideoLooping] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [previewMessage, setPreviewMessage] = useState<string | null>(null);
  const [previewProgress, setPreviewProgress] = useState(0);
  const [previewStatus, setPreviewStatus] = useState<VideoPreviewStatus>("idle");
  const [videoDuration, setVideoDuration] = useState(asset.duration ?? 0);
  const frameRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const imagePreviewRunRef = useRef<symbol | null>(null);
  const videoPreviewAbortRef = useRef<AbortController | null>(null);
  const lastImagePreviewRequestRef = useRef(imagePreviewRequestKey);
  const lastVideoPreviewRequestRef = useRef(videoPreviewRequestKey);
  const stalePreviewToastRef = useRef<string | null>(null);
  const dragRef = useRef({
    isDragging: false,
    panX: 0,
    panY: 0,
    startX: 0,
    startY: 0,
  });

  useEffect(() => {
    const frame = frameRef.current;

    if (!frame || typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(() => {
      const nextBounds = getPreviewBounds(frame);
      setPreviewBounds((currentBounds) =>
        areSameBounds(currentBounds, nextBounds) ? currentBounds : nextBounds,
      );
    });

    observer.observe(frame);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    return () => {
      videoPreviewAbortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;

    if (!video || !videoState) {
      return;
    }

    video.playbackRate = videoState.speed;
  }, [videoState?.speed, videoState]);

  const generatedPreviewForAsset = generatedPreview?.assetId === asset.id ? generatedPreview : null;
  const activeGeneratedPreview =
    generatedPreviewForAsset && generatedPreviewForAsset.fingerprint === currentPreviewFingerprint
      ? generatedPreviewForAsset
      : null;
  const staleGeneratedPreview =
    generatedPreviewForAsset && generatedPreviewForAsset.fingerprint !== currentPreviewFingerprint
      ? generatedPreviewForAsset
      : null;
  const activeDerivedVideoPreview =
    activeGeneratedPreview?.kind === "video" ? activeGeneratedPreview : null;
  const imagePreviewContext =
    asset.kind === "image" && imageExportSettings && currentPreviewFingerprint
      ? {
          assetId: asset.id,
          fingerprint: currentPreviewFingerprint,
        }
      : null;
  const activeDerivedImagePreview =
    activeGeneratedPreview?.kind === "image" ? activeGeneratedPreview : null;
  const activeImagePreviewNotice =
    imagePreviewContext &&
    imagePreviewNotice?.assetId === imagePreviewContext.assetId &&
    imagePreviewNotice.fingerprint === imagePreviewContext.fingerprint
      ? imagePreviewNotice
      : null;
  const videoSource = activeDerivedVideoPreview?.url ?? asset.objectUrl;
  const effectiveTrimStart =
    activeDerivedVideoPreview || !videoState ? 0 : Math.max(0, videoState.trimStart);
  const effectiveTrimEnd = activeDerivedVideoPreview ? null : videoState?.trimEnd;
  const activeSubtitleCue =
    videoState && !activeDerivedVideoPreview
      ? getActiveSubtitleCue(videoState, currentVideoTime)
      : null;
  const isImageAsset = asset.kind === "image";
  const imagePreviewAspectRatio =
    activeDerivedImagePreview && activeDerivedImagePreview.height > 0
      ? activeDerivedImagePreview.width / activeDerivedImagePreview.height
      : undefined;

  useEffect(() => {
    if (!staleGeneratedPreview) {
      stalePreviewToastRef.current = null;
      return;
    }

    if (!currentPreviewFingerprint || previewStatus === "busy") {
      return;
    }

    const toastKey = `${asset.id}:${staleGeneratedPreview.fingerprint}:${currentPreviewFingerprint}`;

    if (stalePreviewToastRef.current === toastKey) {
      return;
    }

    stalePreviewToastRef.current = toastKey;
    showStudioInfo(t.previewStale);
  }, [asset.id, currentPreviewFingerprint, previewStatus, staleGeneratedPreview, t.previewStale]);

  const handleGenerateImagePreview = useCallback(async () => {
    if (
      asset.kind !== "image" ||
      !imageState ||
      !imageExportSettings ||
      !currentPreviewFingerprint
    ) {
      return;
    }

    const runId = Symbol("image-preview");
    const previewContext = {
      assetId: asset.id,
      fingerprint: currentPreviewFingerprint,
    };
    imagePreviewRunRef.current = runId;
    setImagePreviewNotice({
      ...previewContext,
      message: t.generatingImagePreview,
      status: "busy",
    });

    try {
      const result = await exportEditedImage({
        asset,
        format: imageExportSettings.format,
        quality: imageExportSettings.quality,
        state: imageState,
        t,
      });

      if (imagePreviewRunRef.current !== runId) {
        URL.revokeObjectURL(result.url);
        return;
      }

      onGeneratedPreview({ ...result, ...previewContext, kind: "image" });
      setImagePreviewNotice({
        ...previewContext,
        message: t.imagePreviewReady,
        status: "ready",
      });
      showStudioSuccess(t.imagePreviewReady);
    } catch (error) {
      if (imagePreviewRunRef.current !== runId) {
        return;
      }

      const errorMessage = getImageExportErrorMessage(error, t);
      setImagePreviewNotice({
        ...previewContext,
        message: errorMessage,
        status: "failed",
      });
      showStudioError(errorMessage);
    } finally {
      if (imagePreviewRunRef.current === runId) {
        imagePreviewRunRef.current = null;
      }
    }
  }, [asset, currentPreviewFingerprint, imageExportSettings, imageState, onGeneratedPreview, t]);

  const handleGenerateVideoPreview = useCallback(async () => {
    if (asset.kind !== "video" || !videoState || !currentPreviewFingerprint) {
      return;
    }

    const previewFingerprint = currentPreviewFingerprint;
    videoPreviewAbortRef.current?.abort();
    const controller = new AbortController();
    videoPreviewAbortRef.current = controller;
    setPreviewStatus("busy");
    setPreviewMessage(t.generatingVideoPreview);
    setPreviewProgress(0);

    try {
      const result = await exportEditedVideo({
        onProgress: (update) => {
          setPreviewProgress(Math.round(update.progress ?? 0));
          setPreviewMessage(update.message ?? t.generatingVideoPreview);
        },
        signal: controller.signal,
        source: asset.file,
        state: videoState,
      });

      if (controller.signal.aborted || videoPreviewAbortRef.current !== controller) {
        return;
      }

      onGeneratedPreview({
        ...result,
        assetId: asset.id,
        fingerprint: previewFingerprint,
        kind: "video",
      });
      setPreviewStatus("ready");
      setPreviewMessage(null);
      setPreviewProgress(100);
      setCurrentVideoTime(0);
      showStudioSuccess(t.videoPreviewReady);
    } catch (error) {
      if (videoPreviewAbortRef.current !== controller) {
        return;
      }

      if (isAbortError(error)) {
        setPreviewStatus("canceled");
        setPreviewMessage(null);
        showStudioInfo(t.videoPreviewCanceled);
        return;
      }

      const errorMessage = getVideoExportErrorMessage(error, t.videoPreviewFailed);
      setPreviewStatus("failed");
      setPreviewMessage(null);
      showStudioError(errorMessage);
    } finally {
      if (videoPreviewAbortRef.current === controller) {
        videoPreviewAbortRef.current = null;
      }
    }
  }, [asset, currentPreviewFingerprint, onGeneratedPreview, t, videoState]);

  useEffect(() => {
    if (imagePreviewRequestKey === lastImagePreviewRequestRef.current) {
      return;
    }

    lastImagePreviewRequestRef.current = imagePreviewRequestKey;

    if (imagePreviewRequestKey > 0) {
      queueMicrotask(() => void handleGenerateImagePreview());
    }
  }, [handleGenerateImagePreview, imagePreviewRequestKey]);

  useEffect(() => {
    if (videoPreviewRequestKey === lastVideoPreviewRequestRef.current) {
      return;
    }

    lastVideoPreviewRequestRef.current = videoPreviewRequestKey;

    if (videoPreviewRequestKey > 0) {
      queueMicrotask(() => void handleGenerateVideoPreview());
    }
  }, [handleGenerateVideoPreview, videoPreviewRequestKey]);

  function handleCancelVideoPreview() {
    videoPreviewAbortRef.current?.abort();
  }

  function handlePlayToggle() {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    if (video.paused) {
      void video.play();
      return;
    }

    video.pause();
  }

  function handleResetVideoTime() {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    video.currentTime = effectiveTrimStart;
    setCurrentVideoTime(effectiveTrimStart);
  }

  function handleVideoScrub(time: number) {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    video.currentTime = time;
    setCurrentVideoTime(time);
  }

  function handleWheel(event: WheelEvent<HTMLDivElement>) {
    if (!isImageAsset) {
      return;
    }

    event.preventDefault();
    const sensitivity = event.ctrlKey ? 0.9 : 0.14;
    const nextZoom = clamp(zoom - event.deltaY * sensitivity, 40, 320);
    onZoomChange(Math.round(nextZoom));
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!isImageAsset || !event.isPrimary || event.button !== 0 || isPreviewControl(event.target)) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDragging(true);
    dragRef.current = {
      isDragging: true,
      panX: pan.x,
      panY: pan.y,
      startX: event.clientX,
      startY: event.clientY,
    };
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!dragRef.current.isDragging) {
      return;
    }

    const maxPan = Math.max(240, zoom * 5);
    setPan({
      x: clamp(dragRef.current.panX + event.clientX - dragRef.current.startX, -maxPan, maxPan),
      y: clamp(dragRef.current.panY + event.clientY - dragRef.current.startY, -maxPan, maxPan),
    });
  }

  function handlePointerEnd(event: PointerEvent<HTMLDivElement>) {
    if (
      typeof event.currentTarget.hasPointerCapture === "function" &&
      event.currentTarget.hasPointerCapture(event.pointerId)
    ) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    dragRef.current.isDragging = false;
    setIsDragging(false);
  }

  return (
    <section className="selected-preview">
      <div className="preview-meta">
        <div>
          <span>{getKindLabel(asset.kind, t)}</span>
          <h1>{asset.name}</h1>
        </div>
        <div className="preview-meta-actions">
          <PreviewBackgroundToggle
            onChange={onPreviewBackgroundChange}
            t={t}
            value={previewBackground}
          />
          <MediaInfo asset={asset} t={t} />
        </div>
      </div>

      <div
        ref={frameRef}
        className={`preview-frame preview-background-${previewBackground} ${
          asset.kind === "video" ? "is-video-preview" : ""
        }`}
        onPointerCancel={handlePointerEnd}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onWheel={handleWheel}
      >
        {asset.status === "unsupported" ? (
          <div className="unsupported-preview">
            <StudioIcon name="warning" size={36} />
            <strong>{t.unsupportedFormat}</strong>
          </div>
        ) : isImageAsset ? (
          <div
            className={`preview-canvas-layer ${isDragging ? "is-dragging" : ""}`}
            style={{
              transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom / 100})`,
            }}
          >
            <ImagePreviewPane
              asset={asset}
              compareOriginal={compareOriginal}
              imageState={imageState}
              onApplyImageAction={onApplyImageAction}
              previewAspectRatio={imagePreviewAspectRatio}
              previewBounds={previewBounds}
              previewSourceUrl={activeDerivedImagePreview?.url}
              t={t}
            />
          </div>
        ) : (
          <div className="preview-canvas-layer video-canvas-layer">
            <video
              ref={videoRef}
              className="video-preview"
              controls={false}
              key={videoSource}
              onLoadedMetadata={(event) => {
                const nextDuration = event.currentTarget.duration || asset.duration || 0;
                setVideoDuration(nextDuration);
                event.currentTarget.currentTime = effectiveTrimStart;
                setCurrentVideoTime(effectiveTrimStart);
              }}
              onPause={() => setIsVideoPlaying(false)}
              onPlay={() => setIsVideoPlaying(true)}
              onTimeUpdate={(event) => {
                const currentTime = event.currentTarget.currentTime;
                setCurrentVideoTime(currentTime);

                if (effectiveTrimEnd && currentTime >= effectiveTrimEnd) {
                  event.currentTarget.pause();

                  if (isVideoLooping) {
                    event.currentTarget.currentTime = effectiveTrimStart;
                    void event.currentTarget.play();
                  }
                }
              }}
              src={videoSource}
            >
              <track kind="captions" />
            </video>
            {activeSubtitleCue ? (
              <div className="video-subtitle-overlay">{activeSubtitleCue.text}</div>
            ) : null}
          </div>
        )}

        {isImageAsset && activeImagePreviewNotice ? (
          <div className={`job-message preview-job-message ${activeImagePreviewNotice.status}`}>
            <StudioIcon
              name={activeImagePreviewNotice.status === "failed" ? "warning" : "checkCircle"}
              size={17}
            />
            <span>{activeImagePreviewNotice.message}</span>
          </div>
        ) : null}

        {isImageAsset ? (
          <PreviewToolbar
            compareOriginal={compareOriginal}
            isFullscreen={isFullscreen}
            onCompareToggle={onCompareToggle}
            onFullscreenToggle={onFullscreenToggle}
            onZoomChange={onZoomChange}
            t={t}
            zoom={zoom}
          />
        ) : videoState ? (
          <VideoPreviewWorkbench
            asset={asset}
            currentTime={currentVideoTime}
            duration={videoDuration || asset.duration || 0}
            isDerivedPreview={Boolean(activeDerivedVideoPreview)}
            isLooping={isVideoLooping}
            isPlaying={isVideoPlaying}
            onCancelPreview={handleCancelVideoPreview}
            onGeneratePreview={() => void handleGenerateVideoPreview()}
            onLoopToggle={() => setIsVideoLooping((value) => !value)}
            onPlayToggle={handlePlayToggle}
            onResetTime={handleResetVideoTime}
            onScrub={handleVideoScrub}
            previewMessage={previewMessage}
            previewProgress={previewProgress}
            previewStatus={previewStatus}
            t={t}
            videoState={videoState}
          />
        ) : null}
      </div>
    </section>
  );
}

type ImagePreviewStatus = "idle" | "busy" | "ready" | "failed";

type ImagePreviewContext = {
  assetId: string;
  fingerprint: string;
};

type ImagePreviewNotice = ImagePreviewContext & {
  message: string;
  status: ImagePreviewStatus;
};

function PreviewBackgroundToggle({
  onChange,
  t,
  value,
}: {
  onChange: (background: PreviewBackground) => void;
  t: Copy;
  value: PreviewBackground;
}) {
  return (
    <div aria-label={t.previewBackground} className="preview-background-toggle" role="toolbar">
      <button
        aria-label={t.transparentBackground}
        aria-pressed={value === "transparent"}
        className={value === "transparent" ? "is-active" : ""}
        onClick={() => onChange("transparent")}
        type="button"
      >
        <StudioIcon name="gridView" size={16} />
        <span>{t.transparentBackground}</span>
      </button>
      <button
        aria-label={t.blackBackground}
        aria-pressed={value === "black"}
        className={value === "black" ? "is-active" : ""}
        onClick={() => onChange("black")}
        type="button"
      >
        <span aria-hidden="true" className="black-background-swatch" />
        <span>{t.blackBackground}</span>
      </button>
    </div>
  );
}

function MediaInfo({ asset, t }: { asset: WorkspaceAsset; t: Copy }) {
  const dimensions =
    asset.width && asset.height
      ? `${Math.round(asset.width)} x ${Math.round(asset.height)}`
      : t.notAvailable;
  const duration =
    typeof asset.duration === "number" ? formatDuration(asset.duration) : t.notAvailable;

  return (
    <div className="media-info">
      <button aria-label={t.mediaInfo} className="icon-button" title={t.mediaInfo} type="button">
        <StudioIcon name="info" size={18} />
      </button>
      <dl className="media-info-popover" role="tooltip">
        <div>
          <dt>{t.fileName}</dt>
          <dd>{asset.name}</dd>
        </div>
        <div>
          <dt>{t.fileSize}</dt>
          <dd>{formatFileSize(asset.size)}</dd>
        </div>
        <div>
          <dt>{t.dimensions}</dt>
          <dd>{dimensions}</dd>
        </div>
        <div>
          <dt>{t.mimeType}</dt>
          <dd>{asset.mimeType}</dd>
        </div>
        {asset.kind === "video" ? (
          <div>
            <dt>{t.duration}</dt>
            <dd>{duration}</dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

function getPreviewBounds(frame: HTMLDivElement): PreviewBounds {
  const style = getComputedStyle(frame);
  const horizontalPadding = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
  const verticalPadding = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);

  return {
    height: Math.max(0, frame.clientHeight - verticalPadding),
    width: Math.max(0, frame.clientWidth - horizontalPadding),
  };
}

function areSameBounds(currentBounds: PreviewBounds | null, nextBounds: PreviewBounds) {
  return currentBounds?.width === nextBounds.width && currentBounds.height === nextBounds.height;
}

function isPreviewControl(target: EventTarget | null) {
  return (
    target instanceof Element &&
    Boolean(
      target.closest(
        "button, input, select, textarea, a, video, .preview-toolbar, .video-workbench, .media-info",
      ),
    )
  );
}
