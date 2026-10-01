export type AssetKind = "button" | "panel" | "slot" | "bar";
export type ButtonState = "normal" | "hover" | "pressed" | "disabled";
export type Surface = "raised" | "flat" | "embossed" | "engraved";
export type BorderPosition = "inside" | "center" | "outside";
export interface Design {
  id: string;
  name: string;
  kind: AssetKind;
  width: number;
  height: number;
  radius: number;
  corners: [number, number, number, number];
  independentCorners: boolean;
  fill: string;
  fillEnd: string;
  gradient: boolean;
  angle: number;
  border: string;
  borderWidth: number;
  borderPosition: BorderPosition;
  depth: number;
  surface: Surface;
  shadow: number;
  shadowBlur: number;
  shadowOffset: number;
  glow: number;
  text: string;
  textColor: string;
  fontSize: number;
  font: string;
  bold: boolean;
  includeText: boolean;
  slice: number;
  texture: string;
  icon: string;
  iconData: string;
  themeId?: string;
  x?: number;
  y?: number;
}
export interface Preset {
  name: string;
  label: string;
  values: Partial<Design>;
}
export const presets: Preset[] = [
  {
    name: "Arcade",
    label: "Raised · vibrant",
    values: {
      fill: "#bef264",
      fillEnd: "#65a30d",
      border: "#d9f99d",
      textColor: "#172507",
      surface: "raised",
      depth: 6,
      radius: 18,
      shadow: 40,
      glow: 0,
      gradient: true,
    },
  },
  {
    name: "Midnight",
    label: "Soft · understated",
    values: {
      fill: "#384354",
      fillEnd: "#202936",
      border: "#66758c",
      textColor: "#edf2fa",
      surface: "embossed",
      depth: 3,
      radius: 14,
      shadow: 40,
      glow: 0,
      gradient: true,
    },
  },
  {
    name: "Candy",
    label: "Glossy · playful",
    values: {
      fill: "#c4b5fd",
      fillEnd: "#7c3aed",
      border: "#ddd6fe",
      textColor: "#ffffff",
      surface: "raised",
      depth: 7,
      radius: 28,
      shadow: 40,
      glow: 0,
      gradient: true,
    },
  },
  {
    name: "Ember",
    label: "Warm · bold",
    values: {
      fill: "#fdba74",
      fillEnd: "#ea580c",
      border: "#fed7aa",
      textColor: "#451a03",
      surface: "raised",
      depth: 5,
      radius: 12,
      shadow: 30,
      glow: 0,
      gradient: true,
    },
  },
  {
    name: "Neon",
    label: "Luminous · sci-fi",
    values: {
      fill: "#142832",
      fillEnd: "#08131b",
      border: "#67e8f9",
      textColor: "#a5f3fc",
      surface: "flat",
      depth: 0,
      radius: 8,
      shadow: 0,
      glow: 18,
      gradient: true,
    },
  },
  {
    name: "Paper",
    label: "Clean · minimal",
    values: {
      fill: "#e2e8f0",
      fillEnd: "#e2e8f0",
      border: "#ffffff",
      textColor: "#334155",
      surface: "flat",
      depth: 0,
      radius: 8,
      shadow: 20,
      glow: 0,
      gradient: false,
    },
  },
];
export const baseDesign: Design = {
  id: "play-button",
  name: "Primary button",
  kind: "button",
  width: 288,
  height: 76,
  radius: 18,
  corners: [18, 18, 18, 18],
  independentCorners: false,
  fill: "#bef264",
  fillEnd: "#65a30d",
  gradient: true,
  angle: 90,
  border: "#d9f99d",
  borderWidth: 1.5,
  borderPosition: "inside",
  depth: 6,
  surface: "raised",
  shadow: 40,
  shadowBlur: 18,
  shadowOffset: 10,
  glow: 0,
  text: "PLAY GAME",
  textColor: "#172507",
  fontSize: 20,
  font: "Arial",
  bold: true,
  includeText: true,
  slice: 24,
  texture: "",
  icon: "play",
  iconData: "",
  themeId: "Arcade",
};
export const defaultAssets: Design[] = [
  baseDesign,
  {
    ...baseDesign,
    id: "menu-panel",
    name: "Menu panel",
    kind: "panel",
    width: 360,
    height: 240,
    text: "",
    icon: "",
    ...presets[1].values,
    themeId: "Midnight",
  },
  {
    ...baseDesign,
    id: "item-slot",
    name: "Item slot",
    kind: "slot",
    width: 100,
    height: 100,
    text: "",
    icon: "star",
    ...presets[1].values,
    surface: "engraved",
    depth: 4,
    themeId: "Midnight",
  },
];
export const states: ButtonState[] = ["normal", "hover", "pressed", "disabled"];
export function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}
function borderOutset(d: Design) {
  return d.borderPosition === "outside"
    ? d.borderWidth
    : d.borderPosition === "center"
      ? d.borderWidth / 2
      : 0;
}
export function padding(d: Design) {
  return Math.ceil(
    Math.max(
      d.shadowBlur * 2 + Math.abs(d.shadowOffset) + d.depth + 4,
      d.glow * 2 + 4,
      borderOutset(d) + 2,
      8,
    ),
  );
}
function tint(hex: string, amount: number) {
  const h = hex.replace("#", "");
  return `rgb(${[0, 2, 4].map((i) => clamp(parseInt(h.slice(i, i + 2), 16) + amount, 0, 255)).join(",")})`;
}
const images = new Map<string, HTMLImageElement>();
export async function loadImages(d: Design) {
  await Promise.all(
    [d.texture, d.iconData].filter(Boolean).map(
      (src) =>
        new Promise<void>((resolve, reject) => {
          if (images.has(src)) {
            resolve();
            return;
          }
          const img = new Image();
          img.onload = () => {
            images.set(src, img);
            resolve();
          };
          img.onerror = () => reject(new Error("Could not read image"));
          img.src = src;
        }),
    ),
  );
}
export function drawDesign(
  ctx: CanvasRenderingContext2D,
  d: Design,
  state: ButtonState = "normal",
  withText = d.includeText,
) {
  const p = padding(d),
    w = d.width,
    h = d.height,
    pressed = state === "pressed",
    offset = pressed ? d.depth : 0;
  const corners = d.independentCorners
    ? d.corners
    : [d.radius, d.radius, d.radius, d.radius];
  const path = (y = 0, inset = 0, append = false) => {
    if (!append) ctx.beginPath();
    ctx.roundRect(
      p + inset,
      p + y + inset,
      w - inset * 2,
      h - inset * 2,
      corners.map((r) =>
        Math.max(
          0,
          Math.min(r - inset, (h - inset * 2) / 2, (w - inset * 2) / 2),
        ),
      ),
    );
  };
  ctx.save();
  ctx.globalAlpha = state === "disabled" ? 0.42 : 1;
  const raised = d.surface === "raised";
  if (d.shadow > 0) {
    ctx.save();
    ctx.shadowColor = `rgba(0,0,0,${d.shadow / 100})`;
    ctx.shadowBlur = d.shadowBlur * Math.abs(ctx.getTransform().a);
    ctx.shadowOffsetY = d.shadowOffset * Math.abs(ctx.getTransform().a);
    path(offset);
    ctx.fillStyle = d.fill;
    ctx.fill();
    ctx.restore();
  }
  if (d.glow > 0) {
    ctx.save();
    ctx.shadowColor = d.border;
    ctx.shadowBlur = d.glow * Math.abs(ctx.getTransform().a);
    path(offset);
    ctx.fillStyle = d.fill;
    ctx.fill();
    ctx.fill();
    ctx.restore();
  }
  if (raised && !pressed) {
    path(d.depth);
    ctx.fillStyle = tint(d.fillEnd, -40);
    ctx.fill();
  }
  path(offset);
  let fill: string | CanvasGradient = d.fill;
  if (d.gradient) {
    const a = (d.angle * Math.PI) / 180,
      cx = p + w / 2,
      cy = p + offset + h / 2,
      reach = (Math.abs(w * Math.cos(a)) + Math.abs(h * Math.sin(a))) / 2;
    const g = ctx.createLinearGradient(
      cx - Math.cos(a) * reach,
      cy - Math.sin(a) * reach,
      cx + Math.cos(a) * reach,
      cy + Math.sin(a) * reach,
    );
    g.addColorStop(0, d.fill);
    g.addColorStop(1, d.fillEnd);
    fill = g;
  }
  ctx.fillStyle = fill;
  ctx.fill();
  if (d.texture && images.has(d.texture)) {
    ctx.save();
    path(offset);
    ctx.clip();
    ctx.globalAlpha *= 0.45;
    ctx.drawImage(images.get(d.texture)!, p, p + offset, w, h);
    ctx.restore();
  }
  if (d.surface === "embossed" || d.surface === "engraved" || raised) {
    ctx.save();
    path(offset);
    ctx.clip();
    const edge = ctx.createLinearGradient(0, p + offset, 0, p + offset + h),
      engraved = d.surface === "engraved" || pressed;
    edge.addColorStop(0, engraved ? "rgba(0,0,0,.5)" : "rgba(255,255,255,.65)");
    edge.addColorStop(0.46, "rgba(255,255,255,0)");
    edge.addColorStop(1, engraved ? "rgba(255,255,255,.3)" : "rgba(0,0,0,.4)");
    ctx.strokeStyle = edge;
    ctx.lineWidth = Math.max(1, d.depth) * 2;
    path(offset);
    ctx.stroke();
    ctx.restore();
  }
  if (d.borderWidth) {
    const outset = borderOutset(d),
      inset = d.borderWidth - outset;
    // A filled ring preserves rounded corners even for thick inside borders.
    path(offset, -outset);
    if (w > inset * 2 && h > inset * 2) path(offset, inset, true);
    ctx.fillStyle = d.border;
    ctx.fill("evenodd");
  }
  if (state === "hover") {
    path(offset);
    ctx.fillStyle = "rgba(255,255,255,.12)";
    ctx.fill();
  }
  if (pressed) {
    path(offset);
    ctx.fillStyle = "rgba(0,0,0,.16)";
    ctx.fill();
  }
  if (d.kind === "bar") {
    ctx.save();
    path(offset, 6);
    ctx.clip();
    ctx.fillStyle = d.border;
    ctx.globalAlpha *= 0.65;
    ctx.fillRect(p + 6, p + 6 + offset, (w - 12) * 0.68, h - 12);
    ctx.restore();
  }
  const text = withText ? d.text : "",
    icon = d.iconData ? "image" : d.icon;
  ctx.font = `${d.bold ? "700" : "400"} ${d.fontSize}px ${d.font}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = d.textColor;
  const textW = text ? Math.min(ctx.measureText(text).width, w - 40) : 0,
    iconSize = icon ? d.fontSize : 0,
    gap = text && icon ? 12 : 0,
    total = textW + iconSize + gap;
  if (icon) {
    const x = p + w / 2 - total / 2 + iconSize / 2,
      y = p + h / 2 + offset;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = d.textColor;
    ctx.strokeStyle = d.textColor;
    ctx.lineWidth = 2;
    if (icon === "image" && images.has(d.iconData))
      ctx.drawImage(
        images.get(d.iconData)!,
        -iconSize / 2,
        -iconSize / 2,
        iconSize,
        iconSize,
      );
    if (icon === "play") {
      ctx.beginPath();
      ctx.moveTo(-iconSize * 0.3, -iconSize * 0.4);
      ctx.lineTo(iconSize * 0.4, 0);
      ctx.lineTo(-iconSize * 0.3, iconSize * 0.4);
      ctx.closePath();
      ctx.fill();
    }
    if (icon === "plus") {
      ctx.beginPath();
      ctx.moveTo(-iconSize * 0.4, 0);
      ctx.lineTo(iconSize * 0.4, 0);
      ctx.moveTo(0, -iconSize * 0.4);
      ctx.lineTo(0, iconSize * 0.4);
      ctx.stroke();
    }
    if (icon === "star") {
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / 5,
          r = iconSize * (i % 2 ? 0.22 : 0.48);
        i
          ? ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r)
          : ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
  if (text)
    ctx.fillText(
      text,
      p + w / 2 + (iconSize + gap) / 2,
      p + h / 2 + offset + 1,
      Math.max(1, w - 40 - iconSize - gap),
    );
  ctx.restore();
}
export function renderDesign(
  d: Design,
  state: ButtonState = "normal",
  scale = 1,
  withText = d.includeText,
) {
  const p = padding(d),
    canvas = document.createElement("canvas");
  canvas.width = Math.ceil((d.width + p * 2) * scale);
  canvas.height = Math.ceil((d.height + p * 2 + d.depth) * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.scale(scale, scale);
  drawDesign(ctx, d, state, withText);
  return canvas;
}
export function canvasBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Image export failed"))),
      "image/png",
    ),
  );
}
export function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
export function slug(name: string) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "asset"
  );
}
