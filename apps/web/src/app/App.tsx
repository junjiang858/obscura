import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import {
  getCurrentImageEditState,
  initialImageEditHistory,
  initialVideoEditState,
  type ImageEditAction,
  type VideoEditAction,
} from "@obscura/media-core";
import { EditorRail } from "../components/editor/EditorRail";
import { MediaLibraryPanel } from "../components/media-library/MediaLibraryPanel";
import { PreviewStage } from "../components/preview/PreviewStage";
import type { PreviewBackground } from "../components/preview/types";
import { MobileTabs } from "../components/studio/MobileTabs";
import { StudioToaster } from "../components/studio/StudioToaster";
import {
  TaskLaunchAnimation,
  type TaskLaunchMarker,
} from "../components/studio/TaskLaunchAnimation";
import { TopToolbar } from "../components/studio/TopToolbar";
import { showStudioError, showStudioSuccess } from "../components/studio/studio-toast";
import { emptyWorkspaceTabs, populatedWorkspaceTabs } from "../config/workspace";
import { getDefaultImageExportSettings } from "../config/media";
import { detectInitialLanguage, messages, type Language } from "../i18n";
import { useJobStore } from "../stores/job-store";
import { getVisibleAssets, useMediaStore, type WorkspaceAsset } from "../stores/media-store";
import {
  getBackgroundRemovalErrorMessage,
  runImageBackgroundRemoval,
} from "../utils/background-removal";
import {
  getImagePreviewFingerprint,
  getVideoPreviewFingerprint,
  revokeGeneratedPreview,
  type GeneratedPreview,
} from "../utils/generated-preview";
import { readAssetMetadata } from "../utils/media-metadata";
import type { ImageExportResult } from "../utils/image-export";
import type { VideoExportResult } from "../utils/video-export";
import {
  generateVideoPoster,
  generateVideoThumbnails,
  type VideoThumbnail,
} from "../utils/video-thumbnails";
import type { MobileTab } from "./types";

export default function App() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [language, setLanguage] = useState<Language>(() => detectInitialLanguage());
  const [activeMobileTab, setActiveMobileTab] = useState<MobileTab>("preview");
  const [compareOriginal, setCompareOriginal] = useState(false);
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false);
  const [imagePreviewRequestKey, setImagePreviewRequestKey] = useState(0);
  const [previewBackground, setPreviewBackground] = useState<PreviewBackground>("transparent");
  const [videoPreviewRequestKey, setVideoPreviewRequestKey] = useState(0);
  const [taskLaunch, setTaskLaunch] = useState<TaskLaunchMarker | null>(null);
  const [generatedPreviews, setGeneratedPreviews] = useState<Record<string, GeneratedPreview>>({});
  const [videoThumbnailsByAsset, setVideoThumbnailsByAsset] = useState<
    Record<string, VideoThumbnail[]>
  >({});
  const [videoPostersByAsset, setVideoPostersByAsset] = useState<Record<string, string>>({});
  const [zoom, setZoom] = useState(100);
  const generatedPreviewsRef = useRef(generatedPreviews);
  const knownJobIdsRef = useRef<Set<string>>(new Set());
  const launchSequenceRef = useRef(0);
  const taskLaunchTimerRef = useRef<number | null>(null);
  const videoThumbnailsRef = useRef(videoThumbnailsByAsset);
  const videoPostersRef = useRef(videoPostersByAsset);
  const t = messages[language];

  const assets = useMediaStore((state) => state.assets);
  const selectedAssetId = useMediaStore((state) => state.selectedAssetId);
  const filter = useMediaStore((state) => state.filter);
  const imageExportSettings = useMediaStore((state) => state.imageExportSettings);
  const imageHistories = useMediaStore((state) => state.imageHistories);
  const videoEdits = useMediaStore((state) => state.videoEdits);
  const addFiles = useMediaStore((state) => state.addFiles);
  const addGeneratedFile = useMediaStore((state) => state.addGeneratedFile);
  const selectAsset = useMediaStore((state) => state.selectAsset);
  const selectAdjacent = useMediaStore((state) => state.selectAdjacent);
  const setFilter = useMediaStore((state) => state.setFilter);
  const updateImageExportSettings = useMediaStore((state) => state.updateImageExportSettings);
  const applyImageAction = useMediaStore((state) => state.applyImageAction);
  const applyVideoAction = useMediaStore((state) => state.applyVideoAction);
  const updateAssetMetadata = useMediaStore((state) => state.updateAssetMetadata);
  const removeSelected = useMediaStore((state) => state.removeSelected);
  const jobs = useJobStore((state) => state.jobs);
  const queueJob = useJobStore((state) => state.queueJob);
  const updateJob = useJobStore((state) => state.updateJob);
  const completeJob = useJobStore((state) => state.completeJob);
  const failJob = useJobStore((state) => state.failJob);

  const visibleAssets = useMemo(() => getVisibleAssets(assets, filter), [assets, filter]);
  const processingJobs = useMemo(() => Object.values(jobs), [jobs]);
  const selectedAsset = useMemo<WorkspaceAsset | null>(
    () => assets.find((asset) => asset.id === selectedAssetId) ?? null,
    [assets, selectedAssetId],
  );
  const selectedImageState =
    selectedAsset?.kind === "image"
      ? getCurrentImageEditState(imageHistories[selectedAsset.id] ?? initialImageEditHistory())
      : null;
  const selectedImageExportSettings =
    selectedAsset?.kind === "image"
      ? (imageExportSettings[selectedAsset.id] ??
        getDefaultImageExportSettings(selectedAsset.mimeType))
      : null;
  const selectedVideoState =
    selectedAsset?.kind === "video"
      ? (videoEdits[selectedAsset.id] ?? initialVideoEditState(selectedAsset.duration))
      : null;
  const selectedVideoThumbnails =
    selectedAsset?.kind === "video" ? (videoThumbnailsByAsset[selectedAsset.id] ?? []) : [];
  const selectedPreviewFingerprint = useMemo(() => {
    if (selectedAsset?.kind === "image" && selectedImageState && selectedImageExportSettings) {
      return getImagePreviewFingerprint({
        assetId: selectedAsset.id,
        settings: selectedImageExportSettings,
        state: selectedImageState,
      });
    }

    if (selectedAsset?.kind === "video" && selectedVideoState) {
      return getVideoPreviewFingerprint({
        assetId: selectedAsset.id,
        state: selectedVideoState,
      });
    }

    return null;
  }, [selectedAsset, selectedImageExportSettings, selectedImageState, selectedVideoState]);
  const selectedGeneratedPreview = selectedAsset
    ? (generatedPreviews[selectedAsset.id] ?? null)
    : null;
  const backgroundRemovalJob =
    selectedAsset?.kind === "image"
      ? (Object.values(jobs).find(
          (job) =>
            job.type === "background-removal" &&
            job.sourceAssetId === selectedAsset.id &&
            isActiveJob(job),
        ) ?? null)
      : null;
  const canEditSelectedImage = selectedAsset?.kind === "image" && Boolean(selectedImageState);
  const workspaceTabs = assets.length ? populatedWorkspaceTabs : emptyWorkspaceTabs;
  const currentMobileTab = workspaceTabs.includes(activeMobileTab) ? activeMobileTab : "preview";
  const showCompareOriginal = compareOriginal && selectedAsset?.kind === "image";

  function getNextLaunchId(jobId: string) {
    launchSequenceRef.current += 1;
    return `${jobId}:${launchSequenceRef.current}`;
  }

  useEffect(() => {
    const assetsNeedingMetadata = assets.filter(
      (asset) => asset.status === "ready" && (!asset.width || !asset.height),
    );

    for (const asset of assetsNeedingMetadata) {
      void readAssetMetadata(asset)
        .then((metadata) => updateAssetMetadata(asset.id, metadata))
        .catch(() => {
          // Metadata is helpful for the info popover, but edit/export can continue without it.
        });
    }
  }, [assets, updateAssetMetadata]);

  useEffect(() => {
    function handleWorkspaceKeyDown(event: KeyboardEvent) {
      if (isEditableKeyboardTarget(event.target)) {
        return;
      }

      if ((event.key === "ArrowLeft" || event.key === "ArrowRight") && assets.length > 1) {
        event.preventDefault();
        selectAdjacent(event.key === "ArrowRight" ? 1 : -1);
        return;
      }

      if (selectedAsset?.kind !== "image") {
        return;
      }

      const modifierPressed = event.metaKey || event.ctrlKey;
      const key = event.key.toLowerCase();

      if (modifierPressed && key === "z") {
        event.preventDefault();
        applyImageAction(selectedAsset.id, { type: event.shiftKey ? "redo" : "undo" });
      }

      if (modifierPressed && key === "y") {
        event.preventDefault();
        applyImageAction(selectedAsset.id, { type: "redo" });
      }
    }

    window.addEventListener("keydown", handleWorkspaceKeyDown);
    return () => window.removeEventListener("keydown", handleWorkspaceKeyDown);
  }, [applyImageAction, assets.length, selectAdjacent, selectedAsset]);

  useEffect(() => {
    generatedPreviewsRef.current = generatedPreviews;
  }, [generatedPreviews]);

  useEffect(() => {
    videoThumbnailsRef.current = videoThumbnailsByAsset;
  }, [videoThumbnailsByAsset]);

  useEffect(() => {
    videoPostersRef.current = videoPostersByAsset;
  }, [videoPostersByAsset]);

  useEffect(() => {
    return () => {
      if (taskLaunchTimerRef.current) {
        window.clearTimeout(taskLaunchTimerRef.current);
      }

      for (const thumbnails of Object.values(videoThumbnailsRef.current)) {
        revokeVideoThumbnails(thumbnails);
      }

      for (const posterUrl of Object.values(videoPostersRef.current)) {
        URL.revokeObjectURL(posterUrl);
      }

      for (const preview of Object.values(generatedPreviewsRef.current)) {
        revokeGeneratedPreview(preview);
      }
    };
  }, []);

  useEffect(() => {
    const knownLaunchIds = knownJobIdsRef.current;
    const currentLaunchIds = new Set(Object.values(jobs).map((job) => job.launchId ?? job.id));
    const nextJob = Object.values(jobs).find((job) => {
      const launchId = job.launchId ?? job.id;

      return !knownLaunchIds.has(launchId);
    });

    for (const launchId of Array.from(knownLaunchIds)) {
      if (!currentLaunchIds.has(launchId)) {
        knownLaunchIds.delete(launchId);
      }
    }

    for (const launchId of currentLaunchIds) {
      knownLaunchIds.add(launchId);
    }

    if (!nextJob) {
      return;
    }

    if (taskLaunchTimerRef.current) {
      window.clearTimeout(taskLaunchTimerRef.current);
    }

    setTaskLaunch({
      icon: "download",
      id: getNextLaunchId(nextJob.id),
      label: nextJob.title ?? nextJob.message ?? t.processing,
    });
    taskLaunchTimerRef.current = window.setTimeout(() => {
      setTaskLaunch(null);
      taskLaunchTimerRef.current = null;
    }, 1250);
  }, [jobs, t.processing]);

  useEffect(() => {
    const videoAssetsNeedingPosters = assets.filter(
      (asset) =>
        asset.kind === "video" && asset.status === "ready" && !videoPostersByAsset[asset.id],
    );
    const activeJobs = new Set<string>();

    for (const asset of videoAssetsNeedingPosters) {
      activeJobs.add(asset.id);

      void generateVideoPoster({ sourceUrl: asset.objectUrl })
        .then((poster) => {
          if (!activeJobs.has(asset.id)) {
            URL.revokeObjectURL(poster.url);
            return;
          }

          setVideoPostersByAsset((currentPosters) => {
            if (currentPosters[asset.id]) {
              URL.revokeObjectURL(poster.url);
              return currentPosters;
            }

            return {
              ...currentPosters,
              [asset.id]: poster.url,
            };
          });
        })
        .catch(() => {
          // The media card falls back to the video icon if poster extraction is unavailable.
        });
    }

    return () => {
      activeJobs.clear();
    };
  }, [assets, videoPostersByAsset]);

  useEffect(() => {
    if (
      selectedAsset?.kind !== "video" ||
      selectedAsset.status !== "ready" ||
      videoThumbnailsByAsset[selectedAsset.id]
    ) {
      return undefined;
    }

    const duration = selectedAsset.duration ?? selectedVideoState?.trimEnd;

    if (!duration) {
      return undefined;
    }

    let canceled = false;

    void generateVideoThumbnails({
      duration,
      sourceUrl: selectedAsset.objectUrl,
    })
      .then((thumbnails) => {
        if (canceled) {
          revokeVideoThumbnails(thumbnails);
          return;
        }

        setVideoThumbnailsByAsset((currentThumbnails) => {
          if (currentThumbnails[selectedAsset.id]) {
            revokeVideoThumbnails(thumbnails);
            return currentThumbnails;
          }

          return {
            ...currentThumbnails,
            [selectedAsset.id]: thumbnails,
          };
        });
      })
      .catch(() => {
        // The trim controls remain usable if the browser cannot decode thumbnail frames.
      });

    return () => {
      canceled = true;
    };
  }, [selectedAsset, selectedVideoState?.trimEnd, videoThumbnailsByAsset]);

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  function handleFiles(fileList: FileList | null) {
    if (!fileList?.length) {
      return;
    }

    addFiles(Array.from(fileList));
    setActiveMobileTab("preview");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleApplyImageAction(action: ImageEditAction) {
    if (selectedAsset?.kind !== "image") {
      return;
    }

    applyImageAction(selectedAsset.id, action);
  }

  function handleApplyVideoAction(action: VideoEditAction) {
    if (selectedAsset?.kind !== "video") {
      return;
    }

    applyVideoAction(selectedAsset.id, action);
  }

  function handleGeneratedPreview(preview: GeneratedPreview) {
    setGeneratedPreviews((currentPreviews) => {
      const currentPreview = currentPreviews[preview.assetId];

      if (currentPreview && currentPreview.url !== preview.url) {
        revokeGeneratedPreview(currentPreview);
      }

      return {
        ...currentPreviews,
        [preview.assetId]: preview,
      };
    });

    const generatedAsset = addGeneratedResultFile({
      generatedByJobId: preview.jobId,
      result: preview,
      sourceAssetId: preview.assetId,
    });

    completeJob(
      preview.jobId,
      preview.kind === "image" ? t.imagePreviewReady : t.videoPreviewReady,
      {
        filename: preview.filename,
        resultAssetId: generatedAsset.id,
        url: generatedAsset.objectUrl,
      },
    );
  }

  function handleGeneratedExportResult({
    jobId,
    result,
    sourceAssetId,
  }: {
    jobId: string;
    result: ImageExportResult | VideoExportResult;
    sourceAssetId: string;
  }) {
    const generatedAsset = addGeneratedResultFile({
      generatedByJobId: jobId,
      result,
      sourceAssetId,
    });

    completeJob(jobId, t.downloadReady, {
      filename: result.filename,
      resultAssetId: generatedAsset.id,
      url: generatedAsset.objectUrl,
    });

    return generatedAsset;
  }

  function addGeneratedResultFile({
    generatedByJobId,
    result,
    sourceAssetId,
  }: {
    generatedByJobId: string;
    result: ImageExportResult | VideoExportResult;
    sourceAssetId: string;
  }) {
    const sourceAsset = assets.find((asset) => asset.id === sourceAssetId);
    const file = new File([result.blob], result.filename, {
      type: result.blob.type || sourceAsset?.mimeType || "application/octet-stream",
    });

    return addGeneratedFile(sourceAssetId, file, {
      generatedByJobId,
      sourceAssetId,
    });
  }

  async function handleRemoveBackground() {
    if (selectedAsset?.kind !== "image") {
      return;
    }

    const asset = selectedAsset;
    const jobId = getNextLaunchId(getBackgroundRemovalJobId(asset.id));

    if (
      Object.values(jobs).some(
        (job) =>
          job.type === "background-removal" && job.sourceAssetId === asset.id && isActiveJob(job),
      )
    ) {
      return;
    }

    queueJob(jobId, "background-removal", t.backgroundRemovalRunning, {
      fingerprint: `${asset.id}:background-removal:${asset.size}:${asset.name}`,
      inputSnapshot: {
        name: asset.name,
        size: asset.size,
      },
      launchId: jobId,
      sourceAssetId: asset.id,
      sourceAssetKind: "image",
      sourceAssetName: asset.name,
      title: t.backgroundRemovalTask,
    });

    try {
      const result = await runImageBackgroundRemoval({
        onProgress: (update) => updateJob(jobId, update),
        source: asset.file,
      });

      const generatedAsset = addGeneratedFile(asset.id, result.file, {
        generatedByJobId: jobId,
        sourceAssetId: asset.id,
      });

      completeJob(jobId, t.backgroundRemovalComplete, {
        filename: result.file.name,
        resultAssetId: generatedAsset.id,
        url: generatedAsset.objectUrl,
      });
      showStudioSuccess(t.backgroundRemovalComplete);
    } catch (error) {
      const errorMessage = getBackgroundRemovalErrorMessage(error, t.backgroundRemovalFailed);
      failJob(jobId, {
        code: "background-removal-failed",
        message: errorMessage,
        recoverable: true,
      });
      showStudioError(errorMessage);
    }
  }

  function handleRemoveSelectedAsset() {
    if (selectedAssetId) {
      setVideoThumbnailsByAsset((currentThumbnails) => {
        const thumbnails = currentThumbnails[selectedAssetId];

        if (!thumbnails) {
          return currentThumbnails;
        }

        const remainingThumbnails = { ...currentThumbnails };

        delete remainingThumbnails[selectedAssetId];
        revokeVideoThumbnails(thumbnails);
        return remainingThumbnails;
      });
      setVideoPostersByAsset((currentPosters) => {
        const posterUrl = currentPosters[selectedAssetId];

        if (!posterUrl) {
          return currentPosters;
        }

        const remainingPosters = { ...currentPosters };

        delete remainingPosters[selectedAssetId];
        URL.revokeObjectURL(posterUrl);
        return remainingPosters;
      });
      setGeneratedPreviews((currentPreviews) => {
        const generatedPreview = currentPreviews[selectedAssetId];

        if (!generatedPreview) {
          return currentPreviews;
        }

        const remainingPreviews = { ...currentPreviews };

        delete remainingPreviews[selectedAssetId];
        revokeGeneratedPreview(generatedPreview);
        return remainingPreviews;
      });
    }

    removeSelected();
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    handleFiles(event.dataTransfer.files);
  }

  return (
    <>
      <div className="workspace" onDragOver={(event) => event.preventDefault()} onDrop={handleDrop}>
        <input
          ref={fileInputRef}
          aria-label={t.chooseMedia}
          className="sr-only"
          multiple
          onChange={(event) => handleFiles(event.currentTarget.files)}
          type="file"
          accept="image/*,video/*"
        />

        <TopToolbar
          canEditSelectedImage={canEditSelectedImage}
          language={language}
          onApplyImageAction={handleApplyImageAction}
          onLanguageChange={setLanguage}
          onSelectAdjacent={selectAdjacent}
          processingJobs={processingJobs}
          selectedAsset={selectedAsset}
          t={t}
          totalAssets={assets.length}
        />

        <MobileTabs
          activeTab={currentMobileTab}
          onChange={setActiveMobileTab}
          tabs={workspaceTabs}
          t={t}
        />

        <div
          className={`workspace-grid mobile-tab-${currentMobileTab} ${
            assets.length ? "" : "is-empty"
          }`}
        >
          <MediaLibraryPanel
            activeFilter={filter}
            assets={visibleAssets}
            isVisible={currentMobileTab === "library"}
            onAddMedia={openFilePicker}
            onFilterChange={setFilter}
            onRemoveSelected={handleRemoveSelectedAsset}
            onSelectAsset={(assetId) => {
              selectAsset(assetId);
              setActiveMobileTab("preview");
            }}
            selectedAssetId={selectedAssetId}
            t={t}
            totalAssets={assets.length}
            videoPosters={videoPostersByAsset}
          />

          <PreviewStage
            compareOriginal={showCompareOriginal}
            currentPreviewFingerprint={selectedPreviewFingerprint}
            imageExportSettings={selectedImageExportSettings}
            imagePreviewRequestKey={imagePreviewRequestKey}
            imageState={selectedImageState}
            isFullscreen={isPreviewFullscreen}
            isVisible={currentMobileTab === "preview"}
            onAddMedia={openFilePicker}
            onApplyImageAction={handleApplyImageAction}
            onCompareToggle={() => setCompareOriginal((value) => !value)}
            onFullscreenToggle={() => setIsPreviewFullscreen((value) => !value)}
            onGeneratedPreview={handleGeneratedPreview}
            onPreviewBackgroundChange={setPreviewBackground}
            onZoomChange={setZoom}
            previewBackground={previewBackground}
            selectedAsset={selectedAsset}
            t={t}
            videoState={selectedVideoState}
            videoPreviewRequestKey={videoPreviewRequestKey}
            zoom={zoom}
          />

          {assets.length ? (
            <EditorRail
              backgroundRemovalJob={backgroundRemovalJob}
              currentPreviewFingerprint={selectedPreviewFingerprint}
              generatedPreview={selectedGeneratedPreview}
              imageExportSettings={selectedImageExportSettings}
              imageState={selectedImageState}
              isVisible={currentMobileTab === "edit" || currentMobileTab === "export"}
              onApplyImageAction={handleApplyImageAction}
              onApplyVideoAction={handleApplyVideoAction}
              onImageExportSettingsChange={(patch) => {
                if (selectedAsset?.kind === "image") {
                  updateImageExportSettings(selectedAsset.id, patch);
                }
              }}
              onGenerateImagePreview={() => setImagePreviewRequestKey((key) => key + 1)}
              onGenerateVideoPreview={() => setVideoPreviewRequestKey((key) => key + 1)}
              onGeneratedExportResult={handleGeneratedExportResult}
              onRemoveBackground={() => void handleRemoveBackground()}
              selectedAsset={selectedAsset}
              t={t}
              videoState={selectedVideoState}
              videoThumbnails={selectedVideoThumbnails}
            />
          ) : null}
        </div>
      </div>

      <StudioToaster />
      <TaskLaunchAnimation launch={taskLaunch} t={t} />
    </>
  );
}

function getBackgroundRemovalJobId(assetId: string) {
  return `background-removal:${assetId}`;
}

function isActiveJob(job: ReturnType<typeof useJobStore.getState>["jobs"][string] | undefined) {
  return job?.status === "queued" || job?.status === "loading" || job?.status === "processing";
}

function revokeVideoThumbnails(thumbnails: readonly VideoThumbnail[]) {
  for (const thumbnail of thumbnails) {
    URL.revokeObjectURL(thumbnail.url);
  }
}

function isEditableKeyboardTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLSelectElement ||
    target instanceof HTMLTextAreaElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  );
}
