import { useEffect, useMemo, useRef, useState } from "react";
import type Konva from "konva";
import type { KonvaEventObject } from "konva/lib/Node";
import { Arrow, Group, Layer, Line, Rect, Stage, Text, Transformer } from "react-konva";
import type {
  ImageAnnotation,
  ImageCropRect,
  ImageEditAction,
  ImageEditState,
} from "@local-media-studio/media-core";

const cropLayerId = "__crop";

type LayerCanvasSize = {
  height: number;
  width: number;
};

export function ImageLayerCanvas({
  imageState,
  interactive,
  onApply,
  size,
}: {
  imageState: ImageEditState;
  interactive: boolean;
  onApply: (action: ImageEditAction) => void;
  size: LayerCanvasSize;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isTransforming, setIsTransforming] = useState(false);
  const transformerRef = useRef<Konva.Transformer>(null);
  const transformLockRef = useRef(false);
  const nodeRefs = useRef(new Map<string, Konva.Node>());
  const selectedExists =
    selectedId === null ||
    selectedId === cropLayerId ||
    selectedId === "watermark" ||
    imageState.annotations.some((annotation) => annotation.id === selectedId);
  const activeSelectedId = selectedExists ? selectedId : null;
  const selectedAnnotation = useMemo(
    () => imageState.annotations.find((annotation) => annotation.id === activeSelectedId) ?? null,
    [activeSelectedId, imageState.annotations],
  );
  const selectedKind =
    activeSelectedId === cropLayerId
      ? "crop"
      : activeSelectedId === "watermark"
        ? "watermark"
        : selectedAnnotation?.type;
  const canResize =
    selectedKind === "crop" || selectedKind === "rectangle" || selectedKind === "watermark";

  useEffect(() => {
    const transformer = transformerRef.current;

    if (!transformer) {
      return;
    }

    const selectedNode = activeSelectedId ? nodeRefs.current.get(activeSelectedId) : null;
    transformer.nodes(selectedNode ? [selectedNode] : []);
    transformer.getLayer()?.batchDraw();
  }, [activeSelectedId, imageState, size.height, size.width]);

  if (!size.width || !size.height) {
    return null;
  }

  function setNodeRef(id: string, node: Konva.Node | null) {
    if (node) {
      nodeRefs.current.set(id, node);
      return;
    }

    nodeRefs.current.delete(id);
  }

  function setTransformLock(nextIsTransforming: boolean) {
    transformLockRef.current = nextIsTransforming;
    setIsTransforming(nextIsTransforming);
  }

  function selectLayer(event: KonvaEventObject<MouseEvent | TouchEvent>, id: string) {
    if (!interactive) {
      return;
    }

    stopKonvaEvent(event);
    setSelectedId(id);
  }

  function handleTransformerStart(event: KonvaEventObject<Event>) {
    event.cancelBubble = true;
    const selectedNode = activeSelectedId ? nodeRefs.current.get(activeSelectedId) : null;
    selectedNode?.draggable(false);
    setTransformLock(true);
  }

  function handleTransformerEnd(event: KonvaEventObject<Event>) {
    event.cancelBubble = true;
    const selectedNode = activeSelectedId ? nodeRefs.current.get(activeSelectedId) : null;
    selectedNode?.draggable(interactive);
    setTransformLock(false);
  }

  function updateWatermarkFromNode(node: Konva.Node) {
    onApply({
      patch: {
        x: clamp01(node.x() / size.width),
        y: clamp01(node.y() / size.height),
      },
      type: "update-watermark-layer",
    });
  }

  function transformWatermark(node: Konva.Text) {
    const nextFontSize =
      imageState.watermarkLayer.fontSize * Math.max(0.2, node.scaleX(), node.scaleY());

    node.scale({ x: 1, y: 1 });
    onApply({
      patch: {
        fontSize: nextFontSize,
        rotation: node.rotation(),
        x: clamp01(node.x() / size.width),
        y: clamp01(node.y() / size.height),
      },
      type: "update-watermark-layer",
    });
  }

  function updateRectangleFromNode(annotation: ImageAnnotation, node: Konva.Rect) {
    if (annotation.type !== "rectangle") {
      return;
    }

    const nextWidth = Math.max(8, node.width() * node.scaleX());
    const nextHeight = Math.max(8, node.height() * node.scaleY());

    node.scale({ x: 1, y: 1 });
    onApply({
      annotationId: annotation.id,
      patch: {
        height: clamp01(nextHeight / size.height),
        width: clamp01(nextWidth / size.width),
        x: clamp01(node.x() / size.width),
        y: clamp01(node.y() / size.height),
      },
      type: "update-annotation",
    });
  }

  function updateCropRectFromNode(node: Konva.Rect) {
    const nextWidth = Math.max(16, node.width() * node.scaleX());
    const nextHeight = Math.max(16, node.height() * node.scaleY());

    node.scale({ x: 1, y: 1 });
    onApply({
      rect: normalizeCropRect({
        height: nextHeight / size.height,
        width: nextWidth / size.width,
        x: node.x() / size.width,
        y: node.y() / size.height,
      }),
      type: "set-crop-rect",
    });
  }

  function moveAnnotation(annotation: ImageAnnotation, nextX: number, nextY: number) {
    if (annotation.type === "arrow") {
      const deltaX = annotation.endX - annotation.x;
      const deltaY = annotation.endY - annotation.y;

      onApply({
        annotationId: annotation.id,
        patch: {
          endX: clamp01(nextX + deltaX),
          endY: clamp01(nextY + deltaY),
          x: clamp01(nextX),
          y: clamp01(nextY),
        },
        type: "update-annotation",
      });
      return;
    }

    onApply({
      annotationId: annotation.id,
      patch: {
        x: clamp01(nextX),
        y: clamp01(nextY),
      },
      type: "update-annotation",
    });
  }

  function moveBrush(annotation: ImageAnnotation, node: Konva.Line) {
    if (annotation.type !== "brush") {
      return;
    }

    const deltaX = node.x() / size.width;
    const deltaY = node.y() / size.height;
    node.position({ x: 0, y: 0 });
    onApply({
      annotationId: annotation.id,
      patch: {
        points: annotation.points.map((point) => ({
          x: clamp01(point.x + deltaX),
          y: clamp01(point.y + deltaY),
        })),
        x: clamp01(annotation.x + deltaX),
        y: clamp01(annotation.y + deltaY),
      },
      type: "update-annotation",
    });
  }

  const watermarkText = imageState.watermarkText.trim();
  const watermarkLayer = imageState.watermarkLayer;
  const cropRect = imageState.cropAspect === "custom" ? imageState.cropRect : null;

  return (
    <div
      aria-hidden="true"
      className={`image-layer-canvas ${interactive ? "is-interactive" : ""}`}
      onPointerDown={(event) => {
        if (interactive) {
          event.stopPropagation();
        }
      }}
    >
      <Stage
        height={size.height}
        onMouseDown={(event) => {
          if (event.target === event.target.getStage()) {
            setSelectedId(null);
          }
        }}
        onTouchStart={(event) => {
          if (event.target === event.target.getStage()) {
            setSelectedId(null);
          }
        }}
        width={size.width}
      >
        <Layer>
          {cropRect ? (
            <Rect
              dash={[10, 8]}
              draggable={interactive && !isTransforming}
              fill="rgba(94, 225, 255, 0.08)"
              height={cropRect.height * size.height}
              onClick={(event) => selectLayer(event, cropLayerId)}
              onDragEnd={(event) => {
                if (!transformLockRef.current) {
                  updateCropRectFromNode(event.target as Konva.Rect);
                }
              }}
              onMouseDown={(event) => selectLayer(event, cropLayerId)}
              onTap={(event) => selectLayer(event, cropLayerId)}
              onTouchStart={(event) => selectLayer(event, cropLayerId)}
              onTransformEnd={(event) => updateCropRectFromNode(event.target as Konva.Rect)}
              ref={(node) => setNodeRef(cropLayerId, node)}
              stroke="#5ee1ff"
              strokeWidth={2}
              width={cropRect.width * size.width}
              x={cropRect.x * size.width}
              y={cropRect.y * size.height}
            />
          ) : null}

          {imageState.annotations.map((annotation) => (
            <AnnotationLayerItem
              annotation={annotation}
              interactive={interactive}
              isTransforming={isTransforming}
              key={annotation.id}
              onMoveAnnotation={moveAnnotation}
              onMoveBrush={moveBrush}
              onSelect={selectLayer}
              onTransformRectangle={updateRectangleFromNode}
              setNodeRef={setNodeRef}
              size={size}
            />
          ))}

          {watermarkText && watermarkLayer.visible ? (
            <Text
              draggable={interactive && !isTransforming}
              fill={watermarkLayer.color}
              fontFamily="system-ui, sans-serif"
              fontSize={Math.max(12, watermarkLayer.fontSize * size.width)}
              fontStyle="bold"
              opacity={watermarkLayer.opacity}
              onClick={(event) => selectLayer(event, "watermark")}
              onDragEnd={(event) => {
                if (!transformLockRef.current) {
                  updateWatermarkFromNode(event.target);
                }
              }}
              onMouseDown={(event) => selectLayer(event, "watermark")}
              onTap={(event) => selectLayer(event, "watermark")}
              onTouchStart={(event) => selectLayer(event, "watermark")}
              onTransformEnd={(event) => transformWatermark(event.target as Konva.Text)}
              ref={(node) => setNodeRef("watermark", node)}
              rotation={watermarkLayer.rotation}
              shadowBlur={12}
              shadowColor="rgba(0, 0, 0, 0.45)"
              text={watermarkText}
              x={watermarkLayer.x * size.width}
              y={watermarkLayer.y * size.height}
            />
          ) : null}

          {interactive ? (
            <Transformer
              anchorFill="#f8fbff"
              anchorCornerRadius={5}
              anchorSize={11}
              anchorStroke="#111827"
              anchorStrokeWidth={2}
              borderStroke={selectedKind === "crop" ? "#5ee1ff" : "#f8fbff"}
              borderStrokeWidth={2}
              enabledAnchors={
                canResize
                  ? [
                      "top-left",
                      "top-center",
                      "top-right",
                      "middle-left",
                      "middle-right",
                      "bottom-left",
                      "bottom-center",
                      "bottom-right",
                    ]
                  : []
              }
              ref={transformerRef}
              flipEnabled={false}
              onTransformEnd={handleTransformerEnd}
              onTransformStart={handleTransformerStart}
              padding={selectedKind === "crop" ? 0 : 4}
              rotateEnabled={selectedKind === "watermark"}
              shouldOverdrawWholeArea={false}
              {...(selectedKind === "crop" ? { borderDash: [8, 6] } : {})}
            />
          ) : null}
        </Layer>
      </Stage>
    </div>
  );
}

function AnnotationLayerItem({
  annotation,
  interactive,
  isTransforming,
  onMoveAnnotation,
  onMoveBrush,
  onSelect,
  onTransformRectangle,
  setNodeRef,
  size,
}: {
  annotation: ImageAnnotation;
  interactive: boolean;
  isTransforming: boolean;
  onMoveAnnotation: (annotation: ImageAnnotation, nextX: number, nextY: number) => void;
  onMoveBrush: (annotation: ImageAnnotation, node: Konva.Line) => void;
  onSelect: (event: KonvaEventObject<MouseEvent | TouchEvent>, id: string) => void;
  onTransformRectangle: (annotation: ImageAnnotation, node: Konva.Rect) => void;
  setNodeRef: (id: string, node: Konva.Node | null) => void;
  size: LayerCanvasSize;
}) {
  const color = annotation.color;

  if (annotation.type === "text") {
    return (
      <Text
        draggable={interactive && !isTransforming}
        fill={color}
        fontFamily="system-ui, sans-serif"
        fontSize={Math.max(13, size.width * 0.04)}
        fontStyle="bold"
        onClick={(event) => onSelect(event, annotation.id)}
        onMouseDown={(event) => onSelect(event, annotation.id)}
        onDragEnd={(event) =>
          onMoveAnnotation(
            annotation,
            event.target.x() / size.width,
            event.target.y() / size.height,
          )
        }
        onTap={(event) => onSelect(event, annotation.id)}
        onTouchStart={(event) => onSelect(event, annotation.id)}
        ref={(node) => setNodeRef(annotation.id, node)}
        shadowBlur={10}
        shadowColor="rgba(0, 0, 0, 0.42)"
        text={annotation.text}
        x={annotation.x * size.width}
        y={annotation.y * size.height}
      />
    );
  }

  if (annotation.type === "rectangle") {
    return (
      <Rect
        draggable={interactive && !isTransforming}
        fill="rgba(248, 251, 255, 0.04)"
        height={annotation.height * size.height}
        onClick={(event) => onSelect(event, annotation.id)}
        onMouseDown={(event) => onSelect(event, annotation.id)}
        onDragEnd={(event) =>
          onMoveAnnotation(
            annotation,
            event.target.x() / size.width,
            event.target.y() / size.height,
          )
        }
        onTap={(event) => onSelect(event, annotation.id)}
        onTouchStart={(event) => onSelect(event, annotation.id)}
        onTransformEnd={(event) => onTransformRectangle(annotation, event.target as Konva.Rect)}
        ref={(node) => setNodeRef(annotation.id, node)}
        stroke={color}
        strokeWidth={Math.max(2, Math.round(Math.min(size.width, size.height) * 0.006))}
        width={annotation.width * size.width}
        x={annotation.x * size.width}
        y={annotation.y * size.height}
      />
    );
  }

  if (annotation.type === "arrow") {
    return (
      <Group
        draggable={interactive && !isTransforming}
        onClick={(event) => onSelect(event, annotation.id)}
        onMouseDown={(event) => onSelect(event, annotation.id)}
        onDragEnd={(event) =>
          onMoveAnnotation(
            annotation,
            event.target.x() / size.width,
            event.target.y() / size.height,
          )
        }
        onTap={(event) => onSelect(event, annotation.id)}
        onTouchStart={(event) => onSelect(event, annotation.id)}
        ref={(node) => setNodeRef(annotation.id, node)}
        x={annotation.x * size.width}
        y={annotation.y * size.height}
      >
        <Arrow
          fill={color}
          lineCap="round"
          lineJoin="round"
          pointerLength={16}
          pointerWidth={16}
          points={[
            0,
            0,
            (annotation.endX - annotation.x) * size.width,
            (annotation.endY - annotation.y) * size.height,
          ]}
          shadowBlur={8}
          shadowColor="rgba(0, 0, 0, 0.42)"
          stroke={color}
          strokeWidth={Math.max(3, Math.round(Math.min(size.width, size.height) * 0.008))}
        />
      </Group>
    );
  }

  return (
    <Line
      draggable={interactive && !isTransforming}
      lineCap="round"
      lineJoin="round"
      onClick={(event) => onSelect(event, annotation.id)}
      onMouseDown={(event) => onSelect(event, annotation.id)}
      onDragEnd={(event) => onMoveBrush(annotation, event.target as Konva.Line)}
      onTap={(event) => onSelect(event, annotation.id)}
      onTouchStart={(event) => onSelect(event, annotation.id)}
      points={annotation.points.flatMap((point) => [point.x * size.width, point.y * size.height])}
      ref={(node) => setNodeRef(annotation.id, node)}
      shadowBlur={8}
      shadowColor="rgba(0, 0, 0, 0.42)"
      stroke={color}
      strokeWidth={Math.max(4, Math.round(Math.min(size.width, size.height) * 0.008))}
    />
  );
}

function stopKonvaEvent(event: KonvaEventObject<MouseEvent | TouchEvent>) {
  event.cancelBubble = true;
  event.evt.stopPropagation();
}

function normalizeCropRect(rect: ImageCropRect): ImageCropRect {
  const x = clamp01(rect.x);
  const y = clamp01(rect.y);

  return {
    height: Math.max(0.02, Math.min(rect.height, 1 - y)),
    width: Math.max(0.02, Math.min(rect.width, 1 - x)),
    x,
    y,
  };
}

function clamp01(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(1, Math.max(0, value));
}
