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

export function orderedScreenAssets(assets: Design[]) {
  return [...assets].sort(
    (a, b) => Number(a.kind !== "panel") - Number(b.kind !== "panel"),
  );
}

export function drawScreen(
  ctx: CanvasRenderingContext2D,
  screen: ScreenSettings,
  assets: Design[],
  backgroundImage?: HTMLImageElement,
  selected?: string,
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
  const selection = assets.find((a) => a.id === selected);
  if (selection) {
    const scale = Math.abs(ctx.getTransform().a) || 1;
    ctx.strokeStyle = "#b5eb68";
    ctx.lineWidth = 1.5 / scale;
    ctx.setLineDash([5 / scale, 4 / scale]);
    ctx.strokeRect(
      selection.x ?? 0,
      selection.y ?? 0,
      selection.width,
      selection.height,
    );
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
