"use client";
import { useEffect, useRef, useState } from "react";
import { loadImages, type Design } from "@/lib/studio";
import {
  drawScreen,
  loadScreenImage,
  orderedScreenAssets,
  fitScreenAsset,
  type ScreenSettings,
} from "@/lib/screen";

export function ScenePreview({
  assets,
  screen,
  selected,
  zoom,
  onSelect,
  onMove,
}: {
  assets: Design[];
  screen: ScreenSettings;
  selected?: string;
  zoom: string;
  onSelect: (id: string | null) => void;
  onMove: (id: string, x: number, y: number) => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null),
    viewport = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: string; dx: number; dy: number } | null>(null);
  const [size, setSize] = useState({ width: 600, height: 450 });
  const [imageError, setImageError] = useState("");
  const ordered = orderedScreenAssets(assets);
  const fit = Math.min(
    Math.max(40, size.width - 40) / screen.width,
    Math.max(40, size.height - 40) / screen.height,
    1,
  );
  const scale = zoom === "fit" ? fit : Number(zoom) / 100;
  const displayWidth = Math.max(1, Math.round(screen.width * scale));
  const displayHeight = Math.max(1, Math.round(screen.height * scale));
  useEffect(() => {
    if (!viewport.current) return;
    const observer = new ResizeObserver(([entry]) =>
      setSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      }),
    );
    observer.observe(viewport.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    let active = true;
    const canvas = ref.current;
    if (!canvas) return;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    // Zoom changes the displayed size, not the exported resolution. Limit preview allocations.
    const quality = Math.min(
      pixelRatio,
      4096 / displayWidth,
      4096 / displayHeight,
    );
    canvas.width = Math.max(1, Math.round(displayWidth * quality));
    canvas.height = Math.max(1, Math.round(displayHeight * quality));
    function paint(image?: HTMLImageElement) {
      if (!active || !canvas) return;
      const ctx = canvas.getContext("2d")!;
      ctx.setTransform(
        canvas.width / screen.width,
        0,
        0,
        canvas.height / screen.height,
        0,
        0,
      );
      drawScreen(ctx, screen, assets, image, selected);
    }
    paint();
    setImageError("");
    Promise.all([loadScreenImage(screen.image), ...assets.map(loadImages)])
      .then(([image]) => paint(image))
      .catch(() => {
        if (active)
          setImageError(
            "A background or asset image could not be loaded. Try uploading it again.",
          );
      });
    return () => {
      active = false;
    };
  }, [assets, screen, selected, displayWidth, displayHeight]);
  function point(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) * screen.width) / rect.width,
      y: ((e.clientY - rect.top) * screen.height) / rect.height,
    };
  }
  function move(id: string, x: number, y: number) {
    const asset = assets.find((a) => a.id === id);
    if (!asset) return;
    const position = fitScreenAsset(asset, screen, x, y);
    onMove(id, position.x, position.y);
  }
  return (
    <div className="scene-viewport" ref={viewport}>
      <div
        className="scene-scroll-area"
        style={{ minWidth: displayWidth + 40, minHeight: displayHeight + 40 }}
      >
        <div
          className="screen-artboard"
          style={{ width: displayWidth, height: displayHeight }}
        >
          <canvas
            ref={ref}
            style={{ width: displayWidth, height: displayHeight }}
            tabIndex={0}
            aria-label={`${screen.name}, ${screen.width} by ${screen.height} pixels. Drag assets or use arrow keys to move the selected asset.`}
            onPointerDown={(e) => {
              const p = point(e);
              const asset = [...ordered]
                .reverse()
                .find(
                  (a) =>
                    p.x >= (a.x ?? 0) &&
                    p.x <= (a.x ?? 0) + a.width &&
                    p.y >= (a.y ?? 0) &&
                    p.y <= (a.y ?? 0) + a.height,
                );
              onSelect(asset?.id ?? null);
              if (asset) {
                drag.current = {
                  id: asset.id,
                  dx: p.x - (asset.x ?? 0),
                  dy: p.y - (asset.y ?? 0),
                };
                e.currentTarget.setPointerCapture(e.pointerId);
              }
              e.currentTarget.focus({ preventScroll: true });
            }}
            onPointerMove={(e) => {
              if (drag.current) {
                const p = point(e);
                move(
                  drag.current.id,
                  p.x - drag.current.dx,
                  p.y - drag.current.dy,
                );
              }
            }}
            onPointerUp={() => {
              drag.current = null;
            }}
            onPointerCancel={() => {
              drag.current = null;
            }}
            onKeyDown={(e) => {
              if (
                !selected ||
                !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(
                  e.key,
                )
              )
                return;
              const asset = assets.find((a) => a.id === selected);
              if (!asset) return;
              e.preventDefault();
              const step = e.shiftKey ? 10 : 1;
              move(
                asset.id,
                (asset.x ?? 0) +
                  (e.key === "ArrowRight"
                    ? step
                    : e.key === "ArrowLeft"
                      ? -step
                      : 0),
                (asset.y ?? 0) +
                  (e.key === "ArrowDown"
                    ? step
                    : e.key === "ArrowUp"
                      ? -step
                      : 0),
              );
            }}
          />
        </div>
      </div>
      {imageError && (
        <p role="alert" className="screen-image-error">
          {imageError}
        </p>
      )}
    </div>
  );
}
