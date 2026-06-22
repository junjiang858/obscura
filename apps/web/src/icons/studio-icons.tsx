import { Add } from "@material-symbols-svg/react/icons/add";
import { AspectRatio } from "@material-symbols-svg/react/icons/aspect-ratio";
import { BackgroundReplace } from "@material-symbols-svg/react/icons/background-replace";
import { CheckCircle, CheckCircleFill } from "@material-symbols-svg/react/icons/check-circle";
import { ChevronLeft } from "@material-symbols-svg/react/icons/chevron-left";
import { ChevronRight } from "@material-symbols-svg/react/icons/chevron-right";
import { Close } from "@material-symbols-svg/react/icons/close";
import { Compare, CompareFill } from "@material-symbols-svg/react/icons/compare";
import { ContentCut } from "@material-symbols-svg/react/icons/content-cut";
import { Crop } from "@material-symbols-svg/react/icons/crop";
import { CropRotate } from "@material-symbols-svg/react/icons/crop-rotate";
import { Delete } from "@material-symbols-svg/react/icons/delete";
import { Download } from "@material-symbols-svg/react/icons/download";
import { FilterAlt } from "@material-symbols-svg/react/icons/filter-alt";
import { FitScreen } from "@material-symbols-svg/react/icons/fit-screen";
import { Flip } from "@material-symbols-svg/react/icons/flip";
import { FlipToBack } from "@material-symbols-svg/react/icons/flip-to-back";
import { FlipToFront } from "@material-symbols-svg/react/icons/flip-to-front";
import { FormatPaint } from "@material-symbols-svg/react/icons/format-paint";
import { Fullscreen } from "@material-symbols-svg/react/icons/fullscreen";
import { GridView } from "@material-symbols-svg/react/icons/grid-view";
import { Image } from "@material-symbols-svg/react/icons/image";
import { ImageSearch } from "@material-symbols-svg/react/icons/image-search";
import { Info } from "@material-symbols-svg/react/icons/info";
import { Language } from "@material-symbols-svg/react/icons/language";
import { Movie } from "@material-symbols-svg/react/icons/movie";
import { PhotoLibrary } from "@material-symbols-svg/react/icons/photo-library";
import { PlayArrow } from "@material-symbols-svg/react/icons/play-arrow";
import { Redo } from "@material-symbols-svg/react/icons/redo";
import { Settings } from "@material-symbols-svg/react/icons/settings";
import { Speed } from "@material-symbols-svg/react/icons/speed";
import { Straighten } from "@material-symbols-svg/react/icons/straighten";
import { StylusNote } from "@material-symbols-svg/react/icons/stylus-note";
import { Subtitles } from "@material-symbols-svg/react/icons/subtitles";
import { TextFields } from "@material-symbols-svg/react/icons/text-fields";
import { Tune } from "@material-symbols-svg/react/icons/tune";
import { Undo } from "@material-symbols-svg/react/icons/undo";
import { UploadFile } from "@material-symbols-svg/react/icons/upload-file";
import { VideoFile } from "@material-symbols-svg/react/icons/video-file";
import { Warning } from "@material-symbols-svg/react/icons/warning";
import { ZoomIn } from "@material-symbols-svg/react/icons/zoom-in";
import { ZoomOut } from "@material-symbols-svg/react/icons/zoom-out";

const iconComponents = {
  add: Add,
  aspectRatio: AspectRatio,
  backgroundReplace: BackgroundReplace,
  checkCircle: CheckCircle,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  close: Close,
  compare: Compare,
  contentCut: ContentCut,
  crop: Crop,
  cropLandscape: AspectRatio,
  cropPortrait: Crop,
  cropRotate: CropRotate,
  delete: Delete,
  download: Download,
  filter: FilterAlt,
  fitScreen: FitScreen,
  flip: Flip,
  flipHorizontal: FlipToBack,
  flipVertical: FlipToFront,
  formatPaint: FormatPaint,
  fullscreen: Fullscreen,
  gridView: GridView,
  image: Image,
  imageSearch: ImageSearch,
  info: Info,
  language: Language,
  movie: Movie,
  photoLibrary: PhotoLibrary,
  play: PlayArrow,
  redo: Redo,
  settings: Settings,
  speed: Speed,
  straighten: Straighten,
  stylusNote: StylusNote,
  subtitles: Subtitles,
  textFields: TextFields,
  tune: Tune,
  undo: Undo,
  uploadFile: UploadFile,
  videoFile: VideoFile,
  warning: Warning,
  zoomIn: ZoomIn,
  zoomOut: ZoomOut,
} as const;

export type StudioIconName = keyof typeof iconComponents;

const filledIconComponents: Partial<
  Record<StudioIconName, (typeof iconComponents)[StudioIconName]>
> = {
  checkCircle: CheckCircleFill,
  compare: CompareFill,
};

export function StudioIcon({
  className,
  filled = false,
  name,
  size = 20,
}: {
  className?: string;
  filled?: boolean;
  name: StudioIconName;
  size?: number | string;
}) {
  const Icon = (filled ? filledIconComponents[name] : null) ?? iconComponents[name];

  return <Icon aria-hidden="true" className={className} focusable="false" size={size} />;
}
