"use client";
import { useEffect, useRef, useState } from "react";
import { loadImages, type Design } from "@/lib/studio";
import {
  drawScreen,
  loadScreenImage,
  orderedScreenAssets,
  fitScreenAsset,
  snapPosition,
  snapLines,
  snapEdge,
  type ScreenSettings,
  type SnapGuides,
  type ViewSettings,
} from "@/lib/screen";

const noGuides: SnapGuides = { x: [], y: [] };
const sameGuides = (a: SnapGuides, b: SnapGuides) =>
  a.x.length === b.x.length &&
  a.y.length === b.y.length &&
  a.x.every((v, i) => v === b.x[i]) &&
  a.y.every((v, i) => v === b.y[i]);

type Handle = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";
const handleCursor: Record<Handle, string> = {
  n: "ns-resize",
  s: "ns-resize",
  e: "ew-resize",
  w: "ew-resize",
  ne: "nesw-resize",
  sw: "nesw-resize",
  nw: "nwse-resize",
  se: "nwse-resize",
};
export type Rect = { x: number; y: number; width: number; height: number };
type Drag =
  | {
      type: "move";
      ids: string[];
      lead: string;
      grab: { x: number; y: number };
      starts: Record<string, { x: number; y: number }>;
    }
  | {
      type: "resize";
      id: string;
      handle: Handle;
      start: Rect;
      grab: { x: number; y: number };
    }
  | {
      type: "marquee";
      x0: number;
      y0: number;
      x1: number;
      y1: number;
      additive: boolean;
    };

const rectOf = (a: Design): Rect => ({
  x: a.x ?? 0,
  y: a.y ?? 0,
  width: a.width,
  height: a.height,
});
const inside = (a: Design, p: { x: number; y: number }) =>
  p.x >= (a.x ?? 0) &&
  p.x <= (a.x ?? 0) + a.width &&
  p.y >= (a.y ?? 0) &&
  p.y <= (a.y ?? 0) + a.height;
function handlePoints(r: Rect): { handle: Handle; x: number; y: number }[] {
  const cx = r.x + r.width / 2,
    cy = r.y + r.height / 2,
    x1 = r.x + r.width,
    y1 = r.y + r.height;
  return [
    { handle: "nw", x: r.x, y: r.y },
    { handle: "n", x: cx, y: r.y },
    { handle: "ne", x: x1, y: r.y },
    { handle: "e", x: x1, y: cy },
    { handle: "se", x: x1, y: y1 },
    { handle: "s", x: cx, y: y1 },
    { handle: "sw", x: r.x, y: y1 },
    { handle: "w", x: r.x, y: cy },
  ];
}
const clampSize = (v: number) => Math.min(1024, Math.max(8, v));
// New rectangle for a handle drag. Shift keeps the aspect ratio on corner
// handles; Option (Alt) resizes about the centre.
function resizeRect(
  start: Rect,
  handle: Handle,
  dx: number,
  dy: number,
  shift: boolean,
  alt: boolean,
): Rect {
  const hasW = handle.includes("w"),
    hasE = handle.includes("e"),
    hasN = handle.includes("n"),
    hasS = handle.includes("s"),
    k = alt ? 2 : 1;
  let width = start.width,
    height = start.height;
  if (hasE) width = start.width + dx * k;
  if (hasW) width = start.width - dx * k;
  if (hasS) height = start.height + dy * k;
  if (hasN) height = start.height - dy * k;
  if (shift && (hasW || hasE) && (hasN || hasS)) {
    const aspect = start.width / start.height;
    if (
      Math.abs(width / start.width - 1) >= Math.abs(height / start.height - 1)
    )
      height = width / aspect;
    else width = height * aspect;
  }
  width = clampSize(width);
  height = clampSize(height);
  let x = start.x,
    y = start.y;
  if (alt) {
    x = start.x + (start.width - width) / 2;
    y = start.y + (start.height - height) / 2;
  } else {
    if (hasW) x = start.x + start.width - width;
    if (hasN) y = start.y + start.height - height;
  }
  return { x, y, width, height };
}

export function ScenePreview({
  assets,
  screen,
  selection,
  primary,
  zoom,
  view,
  revision = 0,
  outline = true,
  onSelect,
  onMove,
  onResize,
  onDuplicate,
}: {
  assets: Design[];
  screen: ScreenSettings;
  selection: string[];
  primary?: string;
  zoom: string;
  view: ViewSettings;
  /** Bump to repaint, for example after a project font finishes loading. */
  revision?: number;
  /** Draw the selection outline and resize handles. */
  outline?: boolean;
  onSelect: (ids: string[], primary: string | null) => void;
  onMove: (moves: { id: string; x: number; y: number }[]) => void;
  onResize: (id: string, rect: Rect) => void;
  onDuplicate: (ids: string[]) => Record<string, string> | null;
}) {
  const ref = useRef<HTMLCanvasElement>(null),
    viewport = useRef<HTMLDivElement>(null),
    rulerTop = useRef<HTMLCanvasElement>(null),
    rulerLeft = useRef<HTMLCanvasElement>(null);
  const drag = useRef<Drag | null>(null);
  const [size, setSize] = useState({ width: 600, height: 450 });
  const [guides, setGuides] = useState<SnapGuides>(noGuides);
  const [marquee, setMarquee] = useState<Rect | null>(null);
  const [imageError, setImageError] = useState("");
  const ordered = orderedScreenAssets(assets);
  const lead = outline
    ? assets.find((a) => a.id === primary && !a.locked)
    : undefined;
  const fit = Math.min(
    Math.max(40, size.width - 60) / screen.width,
    Math.max(40, size.height - 60) / screen.height,
    1,
  );
  const scale = zoom === "fit" ? fit : Number(zoom) / 100;
  const displayWidth = Math.max(1, Math.round(screen.width * scale));
  const displayHeight = Math.max(1, Math.round(screen.height * scale));
  const rulerSize = view.rulers ? 20 : 0;
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
      drawScreen(ctx, screen, assets, image, outline ? selection : []);
      const px = screen.width / canvas.width; // one device pixel in screen units
      if (view.showGrid && view.grid * scale >= 4) {
        ctx.save();
        ctx.strokeStyle = "rgba(181,235,104,.14)";
        ctx.lineWidth = px;
        ctx.beginPath();
        for (let x = view.grid; x < screen.width; x += view.grid) {
          ctx.moveTo(x, 0);
          ctx.lineTo(x, screen.height);
        }
        for (let y = view.grid; y < screen.height; y += view.grid) {
          ctx.moveTo(0, y);
          ctx.lineTo(screen.width, y);
        }
        ctx.stroke();
        ctx.restore();
      }
      if (guides.x.length || guides.y.length) {
        ctx.save();
        ctx.strokeStyle = "#b5eb68";
        ctx.lineWidth = px;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        for (const x of guides.x) {
          ctx.moveTo(x, 0);
          ctx.lineTo(x, screen.height);
        }
        for (const y of guides.y) {
          ctx.moveTo(0, y);
          ctx.lineTo(screen.width, y);
        }
        ctx.stroke();
        ctx.restore();
      }
      if (lead) {
        const hs = 8 / scale;
        ctx.save();
        ctx.fillStyle = "#1a2016";
        ctx.strokeStyle = "#b5eb68";
        ctx.lineWidth = px;
        for (const h of handlePoints(rectOf(lead))) {
          ctx.beginPath();
          ctx.rect(h.x - hs / 2, h.y - hs / 2, hs, hs);
          ctx.fill();
          ctx.stroke();
        }
        ctx.restore();
      }
      if (marquee) {
        ctx.save();
        ctx.fillStyle = "rgba(181,235,104,.08)";
        ctx.strokeStyle = "#b5eb68";
        ctx.lineWidth = px;
        ctx.setLineDash([4, 3]);
        ctx.fillRect(marquee.x, marquee.y, marquee.width, marquee.height);
        ctx.strokeRect(marquee.x, marquee.y, marquee.width, marquee.height);
        ctx.restore();
      }
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
  }, [
    assets,
    screen,
    selection,
    lead,
    displayWidth,
    displayHeight,
    guides,
    marquee,
    view.showGrid,
    view.grid,
    scale,
    revision,
    outline,
  ]);
  // Rulers in screen pixels, redrawn whenever the zoom or size changes.
  useEffect(() => {
    if (!view.rulers) return;
    const draw = (canvas: HTMLCanvasElement | null, length: number, vertical: boolean) => {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = (vertical ? 20 : length) * dpr;
      canvas.height = (vertical ? length : 20) * dpr;
      const ctx = canvas.getContext("2d")!;
      ctx.scale(dpr, dpr);
      ctx.fillStyle = "#1b1e23";
      ctx.fillRect(0, 0, vertical ? 20 : length, vertical ? length : 20);
      const steps = [5, 10, 20, 25, 50, 100, 200, 250, 500, 1000];
      const major = steps.find((s) => s * scale >= 48) ?? 1000,
        minor = major / 5;
      ctx.strokeStyle = "#4a515c";
      ctx.fillStyle = "#8f99a7";
      ctx.font = "9px -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.textBaseline = "top";
      ctx.beginPath();
      for (let v = 0; v * scale <= length; v += minor) {
        const pos = Math.round(v * scale) + 0.5,
          isMajor = Math.round(v) % major === 0,
          tick = isMajor ? 8 : 4;
        if (vertical) {
          ctx.moveTo(20 - tick, pos);
          ctx.lineTo(20, pos);
        } else {
          ctx.moveTo(pos, 20 - tick);
          ctx.lineTo(pos, 20);
        }
        if (isMajor) {
          if (vertical) {
            ctx.save();
            ctx.translate(2, pos + 2);
            ctx.rotate(-Math.PI / 2);
            ctx.textAlign = "right";
            ctx.fillText(String(v), 0, 0);
            ctx.restore();
          } else ctx.fillText(String(v), pos + 3, 2);
        }
      }
      ctx.stroke();
    };
    draw(rulerTop.current, displayWidth, false);
    draw(rulerLeft.current, displayHeight, true);
  }, [view.rulers, displayWidth, displayHeight, scale]);
  function point(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) * screen.width) / rect.width,
      y: ((e.clientY - rect.top) * screen.height) / rect.height,
    };
  }
  function hitHandle(p: { x: number; y: number }) {
    if (!lead) return null;
    const reach = (8 / scale) * 0.75;
    return (
      handlePoints(rectOf(lead)).find(
        (h) => Math.abs(p.x - h.x) <= reach && Math.abs(p.y - h.y) <= reach,
      )?.handle ?? null
    );
  }
  const threshold = 8 / scale;
  return (
    <div className="scene-viewport" ref={viewport}>
      <div
        className="scene-scroll-area"
        style={{
          minWidth: displayWidth + 40 + rulerSize,
          minHeight: displayHeight + 40 + rulerSize,
        }}
      >
        <div
          className={`artboard-frame ${view.rulers ? "with-rulers" : ""}`}
        >
          {view.rulers && (
            <>
              <div className="ruler-corner" />
              <canvas
                ref={rulerTop}
                className="ruler ruler-top"
                style={{ width: displayWidth, height: 20 }}
                aria-hidden
              />
              <canvas
                ref={rulerLeft}
                className="ruler ruler-left"
                style={{ width: 20, height: displayHeight }}
                aria-hidden
              />
            </>
          )}
          <div
            className="screen-artboard"
            style={{ width: displayWidth, height: displayHeight }}
          >
            <canvas
              ref={ref}
              style={{ width: displayWidth, height: displayHeight }}
              tabIndex={0}
              aria-label={`${screen.name}, ${screen.width} by ${screen.height} pixels. Drag assets, drag handles to resize, or use arrow keys to move the selection.`}
              onPointerDown={(e) => {
                if (e.button !== 0) return;
                const p = point(e),
                  canvas = e.currentTarget;
                canvas.focus({ preventScroll: true });
                const handle = hitHandle(p);
                if (handle && lead) {
                  drag.current = {
                    type: "resize",
                    id: lead.id,
                    handle,
                    start: rectOf(lead),
                    grab: p,
                  };
                  canvas.setPointerCapture(e.pointerId);
                  return;
                }
                const hit = [...ordered]
                  .reverse()
                  .find((a) => !a.locked && inside(a, p));
                if (!hit) {
                  if (!e.shiftKey) onSelect([], null);
                  drag.current = {
                    type: "marquee",
                    x0: p.x,
                    y0: p.y,
                    x1: p.x,
                    y1: p.y,
                    additive: e.shiftKey,
                  };
                  canvas.setPointerCapture(e.pointerId);
                  return;
                }
                if (e.shiftKey) {
                  // Shift-click toggles membership without starting a drag.
                  const next = selection.includes(hit.id)
                    ? selection.filter((id) => id !== hit.id)
                    : [...selection, hit.id];
                  onSelect(
                    next,
                    next.includes(hit.id) ? hit.id : (next[next.length - 1] ?? null),
                  );
                  return;
                }
                const movable = selection.includes(hit.id)
                  ? assets.filter((a) => selection.includes(a.id) && !a.locked)
                  : [hit];
                const originals = movable.some((a) => a.id === hit.id)
                  ? movable
                  : [hit];
                let ids = originals.map((a) => a.id),
                  leadId = hit.id;
                if (e.altKey) {
                  // Option-drag moves fresh copies and leaves the originals.
                  const map = onDuplicate(ids);
                  if (map) {
                    ids = ids.map((id) => map[id] ?? id);
                    leadId = map[hit.id] ?? hit.id;
                  }
                } else onSelect(ids, hit.id);
                const starts: Record<string, { x: number; y: number }> = {};
                originals.forEach((a, i) => {
                  starts[ids[i]] = { x: a.x ?? 0, y: a.y ?? 0 };
                });
                drag.current = { type: "move", ids, lead: leadId, grab: p, starts };
                canvas.setPointerCapture(e.pointerId);
              }}
              onPointerMove={(e) => {
                const g = drag.current,
                  p = point(e),
                  canvas = e.currentTarget;
                if (!g) {
                  const handle = hitHandle(p);
                  canvas.style.cursor = handle
                    ? handleCursor[handle]
                    : [...ordered].reverse().some((a) => !a.locked && inside(a, p))
                      ? "move"
                      : "default";
                  return;
                }
                const noSnap = e.metaKey || e.ctrlKey;
                if (g.type === "marquee") {
                  g.x1 = p.x;
                  g.y1 = p.y;
                  setMarquee({
                    x: Math.min(g.x0, g.x1),
                    y: Math.min(g.y0, g.y1),
                    width: Math.abs(g.x1 - g.x0),
                    height: Math.abs(g.y1 - g.y0),
                  });
                  return;
                }
                if (g.type === "resize") {
                  const rect = resizeRect(
                    g.start,
                    g.handle,
                    p.x - g.grab.x,
                    p.y - g.grab.y,
                    e.shiftKey,
                    e.altKey,
                  );
                  let next = noGuides;
                  if (!noSnap && !e.shiftKey) {
                    const lines = snapLines(screen, assets, new Set([g.id]));
                    if (view.snapGrid) {
                      for (let v = 0; v <= screen.width; v += view.grid) lines.x.push(v);
                      for (let v = 0; v <= screen.height; v += view.grid) lines.y.push(v);
                    }
                    const gx: number[] = [],
                      gy: number[] = [];
                    if (g.handle.includes("e")) {
                      const s = snapEdge(rect.x + rect.width, lines.x, threshold);
                      if (s !== undefined) {
                        rect.width = clampSize(s - rect.x);
                        gx.push(s);
                      }
                    }
                    if (g.handle.includes("w")) {
                      const s = snapEdge(rect.x, lines.x, threshold);
                      if (s !== undefined) {
                        const right = rect.x + rect.width;
                        rect.width = clampSize(right - s);
                        rect.x = right - rect.width;
                        gx.push(s);
                      }
                    }
                    if (g.handle.includes("s")) {
                      const s = snapEdge(rect.y + rect.height, lines.y, threshold);
                      if (s !== undefined) {
                        rect.height = clampSize(s - rect.y);
                        gy.push(s);
                      }
                    }
                    if (g.handle.includes("n")) {
                      const s = snapEdge(rect.y, lines.y, threshold);
                      if (s !== undefined) {
                        const bottom = rect.y + rect.height;
                        rect.height = clampSize(bottom - s);
                        rect.y = bottom - rect.height;
                        gy.push(s);
                      }
                    }
                    next = { x: gx, y: gy };
                  }
                  setGuides((prev) => (sameGuides(prev, next) ? prev : next));
                  onResize(g.id, {
                    x: Math.round(rect.x),
                    y: Math.round(rect.y),
                    width: Math.round(rect.width),
                    height: Math.round(rect.height),
                  });
                  return;
                }
                let dx = p.x - g.grab.x,
                  dy = p.y - g.grab.y,
                  lock: "x" | "y" | null = null;
                // Shift keeps the drag on whichever axis has moved further.
                if (e.shiftKey) {
                  if (Math.abs(dx) >= Math.abs(dy)) {
                    dy = 0;
                    lock = "y";
                  } else {
                    dx = 0;
                    lock = "x";
                  }
                }
                const leadAsset = assets.find((a) => a.id === g.lead),
                  start = g.starts[g.lead];
                if (!leadAsset || !start) return; // copies not rendered yet
                let x = start.x + dx,
                  y = start.y + dy;
                if (view.snapGrid && !noSnap) {
                  if (lock !== "x") x = Math.round(x / view.grid) * view.grid;
                  if (lock !== "y") y = Math.round(y / view.grid) * view.grid;
                }
                let next = noGuides;
                if (!noSnap) {
                  const moving = new Set(g.ids);
                  const snapped = snapPosition(
                    leadAsset,
                    x,
                    y,
                    screen,
                    assets.filter((a) => !moving.has(a.id)),
                    threshold,
                    lock,
                  );
                  x = snapped.x;
                  y = snapped.y;
                  next = snapped.guides;
                }
                const sdx = x - start.x,
                  sdy = y - start.y;
                const moves = g.ids.flatMap((id) => {
                  const a = assets.find((asset) => asset.id === id),
                    s = g.starts[id];
                  if (!a || !s) return [];
                  const pos = fitScreenAsset(a, screen, s.x + sdx, s.y + sdy);
                  return [{ id, x: pos.x, y: pos.y }];
                });
                setGuides((prev) => (sameGuides(prev, next) ? prev : next));
                if (moves.length) onMove(moves);
              }}
              onPointerUp={() => {
                const g = drag.current;
                if (g?.type === "marquee") {
                  const r = {
                    x: Math.min(g.x0, g.x1),
                    y: Math.min(g.y0, g.y1),
                    width: Math.abs(g.x1 - g.x0),
                    height: Math.abs(g.y1 - g.y0),
                  };
                  if (r.width >= 3 || r.height >= 3) {
                    const hits = assets
                      .filter(
                        (a) =>
                          !a.locked &&
                          (a.x ?? 0) < r.x + r.width &&
                          (a.x ?? 0) + a.width > r.x &&
                          (a.y ?? 0) < r.y + r.height &&
                          (a.y ?? 0) + a.height > r.y,
                      )
                      .map((a) => a.id);
                    const ids = g.additive
                      ? [...new Set([...selection, ...hits])]
                      : hits;
                    onSelect(ids, ids[ids.length - 1] ?? null);
                  }
                }
                drag.current = null;
                setGuides(noGuides);
                setMarquee(null);
              }}
              onPointerCancel={() => {
                drag.current = null;
                setGuides(noGuides);
                setMarquee(null);
              }}
              onKeyDown={(e) => {
                if (
                  !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(
                    e.key,
                  )
                )
                  return;
                const moving = assets.filter(
                  (a) => selection.includes(a.id) && !a.locked,
                );
                if (!moving.length) return;
                e.preventDefault();
                const step = e.shiftKey ? 10 : 1;
                const dx =
                    e.key === "ArrowRight" ? step : e.key === "ArrowLeft" ? -step : 0,
                  dy =
                    e.key === "ArrowDown" ? step : e.key === "ArrowUp" ? -step : 0;
                onMove(
                  moving.map((a) => ({
                    id: a.id,
                    ...fitScreenAsset(a, screen, (a.x ?? 0) + dx, (a.y ?? 0) + dy),
                  })),
                );
              }}
            />
          </div>
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
