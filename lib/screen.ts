import { drawDesign, loadImages, padding, type Design } from "./studio";

export interface ScreenSettings {
  name: string;
  width: number;
  height: number;
  background: "solid" | "gradient" | "transparent" | "image";
  color: string;
  colorEnd: string;
  angle: number;
  image: string;
  imageFit: "cover" | "contain" | "stretch";
}

export type Placement = { x: number; y: number };
/** A screen in the builder: settings plus where each asset sits on it. */
export interface Screen extends ScreenSettings {
  id: string;
  placements: Record<string, Placement>;
}
export interface ViewSettings {
  grid: number;
  showGrid: boolean;
  snapGrid: boolean;
  rulers: boolean;
}
export const defaultView: ViewSettings = {
  grid: 16,
  showGrid: false,
  snapGrid: false,
  rulers: true,
};
/** The visible assets placed on a screen, with their positions applied. */
export function screenAssets(assets: Design[], screen: Screen): Design[] {
  return assets
    .filter((a) => !a.hidden && screen.placements[a.id])
    .map((a) => ({ ...a, ...screen.placements[a.id] }));
}
export function newScreenId(existing: Screen[]) {
  let n = existing.length + 1;
  while (existing.some((s) => s.id === `screen-${n}`)) n++;
  return `screen-${n}`;
}
export const defaultScreen: ScreenSettings = {
  name: "Main screen",
  width: 960,
  height: 640,
  background: "solid",
  color: "#10151d",
  colorEnd: "#334155",
  angle: 90,
  image: "",
  imageFit: "cover",
};

export const screenPresets = [
  {
    value: "1920x1080",
    label: "Desktop · 1920 × 1080",
    width: 1920,
    height: 1080,
  },
  { value: "1280x720", label: "HD · 1280 × 720", width: 1280, height: 720 },
  {
    value: "1080x2228",
    label: "Mobile tall · 1080 × 2228",
    width: 1080,
    height: 2228,
  },
  {
    value: "1080x1920",
    label: "Mobile portrait · 1080 × 1920",
    width: 1080,
    height: 1920,
  },
  {
    value: "1920x1080-mobile",
    label: "Mobile landscape · 1920 × 1080",
    width: 1920,
    height: 1080,
  },
  { value: "1024x768", label: "Tablet · 1024 × 768", width: 1024, height: 768 },
  {
    value: "1024x1024",
    label: "Square · 1024 × 1024",
    width: 1024,
    height: 1024,
  },
  { value: "960x640", label: "Classic · 960 × 640", width: 960, height: 640 },
];

const backgroundImages = new Map<string, Promise<HTMLImageElement>>();
export function loadScreenImage(
  source: string,
): Promise<HTMLImageElement | undefined> {
  if (!source) return Promise.resolve(undefined);
  let pending = backgroundImages.get(source);
  if (!pending) {
    pending = new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => {
        backgroundImages.delete(source);
        reject(new Error("Could not load the screen background."));
      };
      image.src = source;
    });
    // Retain only the current image; project data keeps the source for undo.
    backgroundImages.clear();
    backgroundImages.set(source, pending);
  }
  return pending;
}

// Draw order: panels and windows underneath, text on top, the rest between.
const layer = (a: Design) =>
  a.kind === "panel" || a.kind === "window"
    ? 0
    : a.kind === "title" || a.kind === "paragraph" || a.kind === "icon"
      ? 2
      : 1;
export function orderedScreenAssets(assets: Design[]) {
  return [...assets].sort((a, b) => layer(a) - layer(b));
}

export type SnapGuides = { x: number[]; y: number[] };
/** Candidate snap lines: screen edges and centre, other assets' edges and centres. */
export function snapLines(
  screen: ScreenSettings,
  assets: Design[],
  exclude: Set<string>,
): SnapGuides {
  const lines: SnapGuides = {
    x: [0, screen.width / 2, screen.width],
    y: [0, screen.height / 2, screen.height],
  };
  for (const o of assets) {
    if (exclude.has(o.id) || o.x === undefined || o.y === undefined) continue;
    lines.x.push(o.x, o.x + o.width / 2, o.x + o.width);
    lines.y.push(o.y, o.y + o.height / 2, o.y + o.height);
  }
  return lines;
}
/** Snaps one edge value to the nearest candidate line within the threshold. */
export function snapEdge(value: number, candidates: number[], threshold: number) {
  let best: { distance: number; line: number } | undefined;
  for (const line of candidates) {
    const distance = Math.abs(value - line);
    if (distance <= threshold && (!best || distance < best.distance))
      best = { distance, line };
  }
  return best?.line;
}
/**
 * Pulls a dragged asset onto the screen edges and centre, and onto the edges
 * and centres of the other assets, when an edge or its centre is within
 * `threshold` screen pixels. A locked axis is left alone.
 */
export function snapPosition(
  asset: Design,
  x: number,
  y: number,
  screen: ScreenSettings,
  assets: Design[],
  threshold: number,
  lock: "x" | "y" | null = null,
) {
  const lines: SnapGuides = {
    x: [0, screen.width / 2, screen.width],
    y: [0, screen.height / 2, screen.height],
  };
  for (const o of assets) {
    if (o.id === asset.id || o.x === undefined || o.y === undefined) continue;
    lines.x.push(o.x, o.x + o.width / 2, o.x + o.width);
    lines.y.push(o.y, o.y + o.height / 2, o.y + o.height);
  }
  const guides: SnapGuides = { x: [], y: [] };
  const snapAxis = (value: number, size: number, candidates: number[]) => {
    let best: { distance: number; value: number; line: number } | undefined;
    for (const line of candidates)
      for (const anchor of [0, size / 2, size]) {
        const distance = Math.abs(value + anchor - line);
        if (distance <= threshold && (!best || distance < best.distance))
          best = { distance, value: line - anchor, line };
      }
    return best;
  };
  if (lock !== "x") {
    const s = snapAxis(x, asset.width, lines.x);
    if (s) {
      x = s.value;
      guides.x.push(s.line);
    }
  }
  if (lock !== "y") {
    const s = snapAxis(y, asset.height, lines.y);
    if (s) {
      y = s.value;
      guides.y.push(s.line);
    }
  }
  return { x, y, guides };
}

export function drawScreen(
  ctx: CanvasRenderingContext2D,
  screen: ScreenSettings,
  assets: Design[],
  backgroundImage?: HTMLImageElement,
  selected?: string | string[],
) {
  const { width, height } = screen;
  ctx.clearRect(0, 0, width, height);
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, width, height);
  ctx.clip();
  if (screen.background !== "transparent") {
    ctx.fillStyle = screen.color;
    if (screen.background === "gradient") {
      const angle = (screen.angle * Math.PI) / 180;
      const reach =
        (Math.abs(width * Math.cos(angle)) +
          Math.abs(height * Math.sin(angle))) /
        2;
      const dx = Math.cos(angle) * reach,
        dy = Math.sin(angle) * reach;
      const fill = ctx.createLinearGradient(
        width / 2 - dx,
        height / 2 - dy,
        width / 2 + dx,
        height / 2 + dy,
      );
      fill.addColorStop(0, screen.color);
      fill.addColorStop(1, screen.colorEnd);
      ctx.fillStyle = fill;
    }
    ctx.fillRect(0, 0, width, height);
    if (screen.background === "image" && backgroundImage) {
      if (screen.imageFit === "stretch")
        ctx.drawImage(backgroundImage, 0, 0, width, height);
      else {
        const scale = Math[screen.imageFit === "cover" ? "max" : "min"](
          width / backgroundImage.width,
          height / backgroundImage.height,
        );
        const w = backgroundImage.width * scale,
          h = backgroundImage.height * scale;
        ctx.drawImage(backgroundImage, (width - w) / 2, (height - h) / 2, w, h);
      }
    }
  }
  for (const asset of orderedScreenAssets(assets)) {
    ctx.save();
    ctx.translate(
      (asset.x ?? 0) - padding(asset),
      (asset.y ?? 0) - padding(asset),
    );
    drawDesign(ctx, asset);
    ctx.restore();
  }
  const ids = new Set(
    typeof selected === "string" ? [selected] : (selected ?? []),
  );
  if (ids.size) {
    const scale = Math.abs(ctx.getTransform().a) || 1;
    ctx.strokeStyle = "#b5eb68";
    ctx.lineWidth = 1.5 / scale;
    ctx.setLineDash([5 / scale, 4 / scale]);
    for (const a of assets)
      if (ids.has(a.id))
        ctx.strokeRect(a.x ?? 0, a.y ?? 0, a.width, a.height);
  }
  ctx.restore();
}

export async function renderScreen(screen: ScreenSettings, assets: Design[]) {
  const [image] = await Promise.all([
    loadScreenImage(screen.image),
    ...assets.map(loadImages),
  ]);
  await document.fonts.ready;
  const canvas = document.createElement("canvas");
  canvas.width = screen.width;
  canvas.height = screen.height;
  const ctx = canvas.getContext("2d");
  if (!ctx)
    throw new Error(
      "Could not create the screen export. Try a smaller screen size.",
    );
  drawScreen(ctx, screen, assets, image);
  return canvas;
}

/**
 * Position for an asset resized about its centre. A 1 px change moves the
 * centre by half a pixel, so half-pixel results round by the new size's
 * parity: alternate steps go left and right, and stepping back returns the
 * original position instead of drifting.
 */
export function resizeAboutCenter(
  asset: Design,
  screen: ScreenSettings,
  width: number,
  height: number,
) {
  const place = (position: number, before: number, after: number) => {
    const ideal = position + before / 2 - after / 2;
    if (Number.isInteger(ideal) || !Number.isInteger(ideal * 2))
      return Math.round(ideal);
    return after % 2 === 0 ? Math.floor(ideal) : Math.ceil(ideal);
  };
  return fitScreenAsset(
    { ...asset, width, height },
    screen,
    place(asset.x ?? 0, asset.width, width),
    place(asset.y ?? 0, asset.height, height),
  );
}

export function fitScreenAsset(
  asset: Design,
  screen: ScreenSettings,
  x: number,
  y: number,
) {
  return {
    x: Math.round(
      Math.max(0, Math.min(Math.max(0, screen.width - asset.width), x)),
    ),
    y: Math.round(
      Math.max(0, Math.min(Math.max(0, screen.height - asset.height), y)),
    ),
  };
}
