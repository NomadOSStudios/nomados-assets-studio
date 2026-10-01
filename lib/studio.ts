export type AssetKind =
  | "button"
  | "panel"
  | "slot"
  | "bar"
  | "badge"
  | "window"
  | "title"
  | "paragraph";
export type TextAlign = "left" | "center" | "right";
export type ButtonState = "normal" | "hover" | "pressed" | "disabled";
export type Surface =
  | "raised"
  | "flat"
  | "embossed"
  | "engraved"
  | "glossy"
  | "bevel"
  | "soft";
export type Shape = "round" | "cut";
export type BorderPosition = "inside" | "center" | "outside";
export const surfaces: { value: Surface; label: string }[] = [
  { value: "flat", label: "Flat" },
  { value: "raised", label: "Raised · 3D block" },
  { value: "glossy", label: "Glossy · glass sheen" },
  { value: "bevel", label: "Bevel · chiseled edge" },
  { value: "embossed", label: "Embossed · lifted" },
  { value: "engraved", label: "Engraved · sunken" },
  { value: "soft", label: "Soft · rounded light" },
];
export const iconNames = [
  "",
  "play",
  "pause",
  "plus",
  "star",
  "heart",
  "check",
  "close",
  "arrow",
  "gear",
] as const;
export type IconName = (typeof iconNames)[number];
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
  shape: Shape;
  highlight: number;
  lightAngle: number;
  textOutline: number;
  textOutlineColor: string;
  textShadow: boolean;
  textAlign: TextAlign;
  lineHeight: number;
  progress: number;
  accent?: string;
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
      shape: "round",
      highlight: 60,
      lightAngle: 120,
      textOutline: 0,
      textShadow: false,
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
      shape: "round",
      highlight: 55,
      lightAngle: 120,
      textOutline: 0,
      textShadow: false,
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
      surface: "glossy",
      depth: 6,
      radius: 28,
      shadow: 40,
      glow: 0,
      gradient: true,
      shape: "round",
      highlight: 70,
      lightAngle: 120,
      textOutline: 0,
      textShadow: true,
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
      shape: "round",
      highlight: 60,
      lightAngle: 120,
      textOutline: 0,
      textShadow: false,
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
      radius: 10,
      shadow: 0,
      glow: 18,
      gradient: true,
      shape: "cut",
      highlight: 0,
      lightAngle: 120,
      textOutline: 0,
      textShadow: false,
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
      shape: "round",
      highlight: 0,
      lightAngle: 120,
      textOutline: 0,
      textShadow: false,
    },
  },
  {
    name: "Gold",
    label: "Glossy · premium",
    values: {
      fill: "#fde68a",
      fillEnd: "#d97706",
      border: "#fff3c4",
      textColor: "#422006",
      surface: "glossy",
      depth: 5,
      radius: 14,
      shadow: 35,
      glow: 0,
      gradient: true,
      shape: "round",
      highlight: 75,
      lightAngle: 120,
      textOutline: 0,
      textShadow: true,
    },
  },
  {
    name: "Frost",
    label: "Soft · icy",
    values: {
      fill: "#e0f2fe",
      fillEnd: "#7dd3fc",
      border: "#ffffff",
      textColor: "#0c4a6e",
      surface: "soft",
      depth: 6,
      radius: 20,
      shadow: 25,
      glow: 0,
      gradient: true,
      shape: "round",
      highlight: 60,
      lightAngle: 120,
      textOutline: 0,
      textShadow: false,
    },
  },
  {
    name: "Steel",
    label: "Bevel · industrial",
    values: {
      fill: "#b4bcc8",
      fillEnd: "#4b5563",
      border: "#e5e7eb",
      textColor: "#f9fafb",
      surface: "bevel",
      depth: 5,
      radius: 10,
      shadow: 45,
      glow: 0,
      gradient: true,
      shape: "cut",
      highlight: 70,
      lightAngle: 120,
      textOutline: 0,
      textShadow: true,
    },
  },
  {
    name: "Berry",
    label: "Glossy · sweet",
    values: {
      fill: "#f9a8d4",
      fillEnd: "#be185d",
      border: "#fce7f3",
      textColor: "#ffffff",
      surface: "glossy",
      depth: 6,
      radius: 24,
      shadow: 35,
      glow: 0,
      gradient: true,
      shape: "round",
      highlight: 65,
      lightAngle: 120,
      textOutline: 1.5,
      textOutlineColor: "#831843",
      textShadow: false,
    },
  },
  {
    name: "Retro",
    label: "Flat · chunky",
    values: {
      fill: "#facc15",
      fillEnd: "#facc15",
      border: "#1f2937",
      borderWidth: 4,
      textColor: "#1f2937",
      surface: "flat",
      depth: 0,
      radius: 6,
      shadow: 60,
      shadowBlur: 0,
      shadowOffset: 5,
      glow: 0,
      gradient: false,
      shape: "cut",
      highlight: 0,
      lightAngle: 120,
      textOutline: 0,
      textShadow: false,
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
  shape: "round",
  highlight: 60,
  lightAngle: 120,
  textOutline: 0,
  textOutlineColor: "#000000",
  textShadow: false,
  textAlign: "center",
  lineHeight: 1.3,
  progress: 68,
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
/** Titles and paragraphs are text only: no shape, shadow, or 3D depth. */
export const isText = (d: Design) =>
  d.kind === "title" || d.kind === "paragraph";
export const depthOf = (d: Design) => (isText(d) ? 0 : d.depth);
function borderOutset(d: Design) {
  return d.borderPosition === "outside"
    ? d.borderWidth
    : d.borderPosition === "center"
      ? d.borderWidth / 2
      : 0;
}
export function padding(d: Design) {
  if (isText(d)) return Math.ceil(Math.max(8, d.textOutline + 4));
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
function iconPath(ctx: CanvasRenderingContext2D, icon: string, s: number) {
  // Builds an icon path centred on the origin and says how to paint it.
  ctx.beginPath();
  switch (icon) {
    case "play":
      ctx.moveTo(-s * 0.3, -s * 0.4);
      ctx.lineTo(s * 0.4, 0);
      ctx.lineTo(-s * 0.3, s * 0.4);
      ctx.closePath();
      return "fill";
    case "pause":
      ctx.rect(-s * 0.38, -s * 0.4, s * 0.26, s * 0.8);
      ctx.rect(s * 0.12, -s * 0.4, s * 0.26, s * 0.8);
      return "fill";
    case "plus":
      ctx.moveTo(-s * 0.4, 0);
      ctx.lineTo(s * 0.4, 0);
      ctx.moveTo(0, -s * 0.4);
      ctx.lineTo(0, s * 0.4);
      return "stroke";
    case "star":
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / 5,
          r = s * (i % 2 ? 0.22 : 0.48);
        if (i) ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        else ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath();
      return "fill";
    case "heart":
      ctx.moveTo(0, s * 0.42);
      ctx.bezierCurveTo(-s * 0.9, -s * 0.2, -s * 0.3, -s * 0.75, 0, -s * 0.25);
      ctx.bezierCurveTo(s * 0.3, -s * 0.75, s * 0.9, -s * 0.2, 0, s * 0.42);
      ctx.closePath();
      return "fill";
    case "check":
      ctx.moveTo(-s * 0.4, s * 0.02);
      ctx.lineTo(-s * 0.12, s * 0.32);
      ctx.lineTo(s * 0.42, -s * 0.3);
      return "stroke";
    case "close":
      ctx.moveTo(-s * 0.33, -s * 0.33);
      ctx.lineTo(s * 0.33, s * 0.33);
      ctx.moveTo(s * 0.33, -s * 0.33);
      ctx.lineTo(-s * 0.33, s * 0.33);
      return "stroke";
    case "arrow":
      ctx.moveTo(-s * 0.42, 0);
      ctx.lineTo(s * 0.38, 0);
      ctx.moveTo(s * 0.08, -s * 0.3);
      ctx.lineTo(s * 0.4, 0);
      ctx.lineTo(s * 0.08, s * 0.3);
      return "stroke";
    case "gear":
      for (let i = 0; i < 32; i++) {
        const a = (i * Math.PI) / 16 - Math.PI / 32,
          r = s * (i % 4 < 2 ? 0.48 : 0.36);
        if (i) ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        else ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.moveTo(s * 0.16, 0);
      ctx.arc(0, 0, s * 0.16, 0, Math.PI * 2);
      return "evenodd";
  }
  return "fill";
}
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (!words.length) {
      lines.push("");
      continue;
    }
    let line = words[0];
    for (const word of words.slice(1)) {
      const candidate = `${line} ${word}`;
      if (ctx.measureText(candidate).width <= maxWidth) line = candidate;
      else {
        lines.push(line);
        line = word;
      }
    }
    lines.push(line);
  }
  return lines;
}
// Text-only assets: wrapped lines inside the box, titles centred vertically,
// paragraphs flowing from the top, with the same outline and shadow options.
function drawTextBlock(
  ctx: CanvasRenderingContext2D,
  d: Design,
  state: ButtonState,
  withText: boolean,
) {
  const p = padding(d),
    w = d.width,
    h = d.height,
    unit = Math.abs(ctx.getTransform().a) || 1,
    text = withText ? d.text : "";
  if (!text.trim()) return;
  ctx.save();
  ctx.globalAlpha = state === "disabled" ? 0.42 : 1;
  ctx.font = `${d.bold ? "700" : "400"} ${d.fontSize}px ${d.font}`;
  ctx.textBaseline = "middle";
  ctx.textAlign = d.textAlign;
  const lines = wrapText(ctx, text, w),
    lh = d.fontSize * d.lineHeight,
    x = d.textAlign === "left" ? p : d.textAlign === "right" ? p + w : p + w / 2;
  let y =
    d.kind === "paragraph"
      ? p + lh / 2
      : p + h / 2 - (lines.length * lh) / 2 + lh / 2;
  for (const line of lines) {
    ctx.save();
    if (d.textShadow) {
      ctx.shadowColor = "rgba(0,0,0,.55)";
      ctx.shadowBlur = 3 * unit;
      ctx.shadowOffsetY = 2 * unit;
    }
    if (d.textOutline > 0) {
      ctx.lineJoin = "round";
      ctx.lineWidth = d.textOutline * 2;
      ctx.strokeStyle = d.textOutlineColor;
      ctx.strokeText(line, x, y);
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
    }
    ctx.fillStyle = d.textColor;
    ctx.fillText(line, x, y);
    ctx.restore();
    y += lh;
  }
  ctx.restore();
}
export function drawDesign(
  ctx: CanvasRenderingContext2D,
  d: Design,
  state: ButtonState = "normal",
  withText = d.includeText,
) {
  if (isText(d)) return drawTextBlock(ctx, d, state, withText);
  const p = padding(d),
    w = d.width,
    h = d.height,
    pressed = state === "pressed",
    offset = pressed ? d.depth : 0,
    k = clamp(d.highlight ?? 60, 0, 100) / 100,
    // Canvas shadows ignore the transform, so blur and offsets are scaled by hand.
    unit = Math.abs(ctx.getTransform().a) || 1,
    // Unit vector toward the light in canvas space (y down). 90° is straight up.
    phi = (((d.lightAngle ?? 120) % 360) * Math.PI) / 180,
    lx = Math.cos(phi),
    ly = -Math.sin(phi);
  const corners = d.independentCorners
    ? d.corners
    : [d.radius, d.radius, d.radius, d.radius];
  const path = (y = 0, inset = 0, append = false) => {
    if (!append) ctx.beginPath();
    const x0 = p + inset,
      y0 = p + y + inset,
      iw = w - inset * 2,
      ih = h - inset * 2;
    if (iw <= 0 || ih <= 0) return;
    if (d.shape === "cut") {
      // Offsetting a 45° chamfer inward shortens each leg by (2 - √2) per unit.
      const [tl, tr, br, bl] = corners.map((r) =>
        clamp(r - inset * (2 - Math.SQRT2), 0, Math.min(iw, ih) / 2),
      );
      ctx.moveTo(x0 + tl, y0);
      ctx.lineTo(x0 + iw - tr, y0);
      ctx.lineTo(x0 + iw, y0 + tr);
      ctx.lineTo(x0 + iw, y0 + ih - br);
      ctx.lineTo(x0 + iw - br, y0 + ih);
      ctx.lineTo(x0 + bl, y0 + ih);
      ctx.lineTo(x0, y0 + ih - bl);
      ctx.lineTo(x0, y0 + tl);
      ctx.closePath();
    } else
      ctx.roundRect(
        x0,
        y0,
        iw,
        ih,
        corners.map((r) => Math.max(0, Math.min(r - inset, ih / 2, iw / 2))),
      );
  };
  const body = () => path(offset);
  // Inner shadow: clip to the body and cast a shadow from everything outside it.
  const innerShade = (color: string, blur: number, dx: number, dy: number) => {
    ctx.save();
    body();
    ctx.clip();
    ctx.shadowColor = color;
    ctx.shadowBlur = blur * unit;
    ctx.shadowOffsetX = dx * unit;
    ctx.shadowOffsetY = dy * unit;
    ctx.beginPath();
    ctx.rect(-w - 200, -h - 200, w * 3 + p * 2 + 400, h * 3 + p * 2 + d.depth + 400);
    path(offset, 0, true);
    ctx.fillStyle = "#000";
    ctx.fill("evenodd");
    ctx.restore();
  };
  // Bevel lighting on a ring of uniform width just inside the edge. Each
  // point is lit by how squarely its edge faces the light: straight edges
  // take flat faces split by 45° miters, arcs sweep a conic gradient around
  // their own centre, and chamfers take their single 45° tone. Inverted for
  // sunken surfaces.
  const faces = (width: number, strength: number, inverted: boolean) => {
    const b = Math.min(width, Math.min(w, h) / 2 - 1);
    if (b <= 0 || strength <= 0) return;
    const dir = inverted ? -1 : 1;
    const lit = (nx: number, ny: number) => (nx * lx + ny * ly) * dir;
    const shade = (v: number) =>
      v >= 0
        ? `rgba(255,255,255,${v * strength})`
        : `rgba(0,0,0,${-v * 0.8 * strength})`;
    const x0 = p,
      y0 = p + offset,
      x1 = p + w,
      y1 = p + offset + h,
      m = Math.min(w, h) / 2,
      cut = d.shape === "cut",
      reach = b + 2,
      radii = corners.map((r) => Math.max(0, Math.min(r, m)));
    const poly = (pts: number[][]) => {
      pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.closePath();
    };
    // The part of the ring that belongs to one corner: a square around an
    // arc, or the band directly in front of a chamfer.
    const cornerRegion = (corner: number) => {
      const r = radii[corner];
      if (r <= 0) return;
      if (!cut) {
        if (corner === 0) ctx.rect(x0, y0, r, r);
        else if (corner === 1) ctx.rect(x1 - r, y0, r, r);
        else if (corner === 2) ctx.rect(x1 - r, y1 - r, r, r);
        else ctx.rect(x0, y1 - r, r, r);
      } else if (corner === 0)
        poly([
          [x0 + r, y0],
          [x0, y0 + r],
          [x0 + reach, y0 + r + reach],
          [x0 + r + reach, y0 + reach],
        ]);
      else if (corner === 1)
        poly([
          [x1 - r, y0],
          [x1, y0 + r],
          [x1 - reach, y0 + r + reach],
          [x1 - r - reach, y0 + reach],
        ]);
      else if (corner === 2)
        poly([
          [x1, y1 - r],
          [x1 - r, y1],
          [x1 - r - reach, y1 - reach],
          [x1 - reach, y1 - r - reach],
        ]);
      else
        poly([
          [x0 + r, y1],
          [x0, y1 - r],
          [x0 + reach, y1 - r - reach],
          [x0 + r + reach, y1 - reach],
        ]);
    };
    ctx.save();
    body();
    ctx.clip();
    path(offset, 0);
    path(offset, b, true);
    ctx.clip("evenodd");
    // Straight edges: everything outside the corner regions.
    ctx.save();
    ctx.beginPath();
    ctx.rect(x0 - 1, y0 - 1, w + 2, h + 2);
    [0, 1, 2, 3].forEach(cornerRegion);
    ctx.clip("evenodd");
    const wedge = (pts: number[][], v: number) => {
      ctx.beginPath();
      poly(pts);
      ctx.fillStyle = shade(v);
      ctx.fill();
    };
    wedge([[x0, y0], [x1, y0], [x1 - m, y0 + m], [x0 + m, y0 + m]], lit(0, -1));
    wedge([[x1, y0], [x1, y1], [x1 - m, y1 - m], [x1 - m, y0 + m]], lit(1, 0));
    wedge([[x1, y1], [x0, y1], [x0 + m, y1 - m], [x1 - m, y1 - m]], lit(0, 1));
    wedge([[x0, y1], [x0, y0], [x0 + m, y0 + m], [x0 + m, y1 - m]], lit(-1, 0));
    ctx.restore();
    // Corners. Conic angles run clockwise from +x, so the outward normal at
    // angle a is (cos a, sin a); each corner covers a quarter turn.
    const starts = [Math.PI, Math.PI * 1.5, 0, Math.PI / 2];
    const centers = [
      [x0 + radii[0], y0 + radii[0]],
      [x1 - radii[1], y0 + radii[1]],
      [x1 - radii[2], y1 - radii[2]],
      [x0 + radii[3], y1 - radii[3]],
    ];
    [0, 1, 2, 3].forEach((corner) => {
      if (radii[corner] <= 0) return;
      const start = starts[corner];
      const at = (turn: number) =>
        lit(Math.cos(start + turn * Math.PI * 2), Math.sin(start + turn * Math.PI * 2));
      ctx.save();
      ctx.beginPath();
      cornerRegion(corner);
      ctx.clip();
      if (cut) ctx.fillStyle = shade(at(0.125));
      else {
        const [cx, cy] = centers[corner];
        const g = ctx.createConicGradient(start, cx, cy);
        for (let i = 0; i <= 4; i++)
          g.addColorStop(i / 16, shade(at(i / 16)));
        g.addColorStop(1, shade(at(0)));
        ctx.fillStyle = g;
      }
      ctx.fillRect(x0, y0, w, h);
      ctx.restore();
    });
    ctx.restore();
  };
  // Glass sheen across the top half.
  const gloss = (strength: number) => {
    const gh = h * 0.5,
      inset = 2;
    ctx.save();
    body();
    ctx.clip();
    const g = ctx.createLinearGradient(0, p + offset + inset, 0, p + offset + gh);
    g.addColorStop(0, `rgba(255,255,255,${0.6 * strength})`);
    g.addColorStop(1, `rgba(255,255,255,${0.06 * strength})`);
    ctx.beginPath();
    ctx.roundRect(
      p + inset,
      p + offset + inset,
      w - inset * 2,
      gh - inset,
      corners.map((r) => Math.max(0, Math.min(r - inset, gh / 2))),
    );
    ctx.fillStyle = g;
    ctx.fill();
    ctx.restore();
  };
  ctx.save();
  ctx.globalAlpha = state === "disabled" ? 0.42 : 1;
  const raised = d.surface === "raised";
  if (d.shadow > 0) {
    ctx.save();
    ctx.shadowColor = `rgba(0,0,0,${d.shadow / 100})`;
    ctx.shadowBlur = d.shadowBlur * unit;
    ctx.shadowOffsetY = d.shadowOffset * unit;
    path(offset);
    ctx.fillStyle = d.fill;
    ctx.fill();
    ctx.restore();
  }
  if (d.glow > 0) {
    ctx.save();
    ctx.shadowColor = d.border;
    ctx.shadowBlur = d.glow * unit;
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
  // Windows get a darker title band with a hairline in the border colour.
  const band =
    d.kind === "window"
      ? Math.min(h * 0.45, Math.max(28, d.fontSize * 2.2))
      : 0;
  if (band) {
    ctx.save();
    body();
    ctx.clip();
    ctx.fillStyle = "rgba(0,0,0,.26)";
    ctx.fillRect(p, p + offset, w, band);
    ctx.globalAlpha *= 0.6;
    ctx.fillStyle = d.border;
    ctx.fillRect(p, p + offset + band - 1, w, 1);
    ctx.restore();
  }
  const depthPx = Math.max(1, d.depth);
  // Inner shadow offsets: the lit side gets the highlight, the far side the shade.
  const toward = (m: number) => [-lx * m, -ly * m] as const,
    away = (m: number) => [lx * m, ly * m] as const;
  switch (pressed && d.surface !== "flat" ? "engraved" : d.surface) {
    case "raised":
      faces(Math.max(1.5, d.depth * 0.45), 0.63 * k, false);
      break;
    case "bevel":
      faces(Math.max(3, d.depth * 1.1), 0.72 * k, false);
      break;
    case "embossed": {
      faces(Math.max(1.5, d.depth * 0.6), 0.46 * k, false);
      const [hx, hy] = toward(depthPx * 0.7),
        [sx, sy] = away(depthPx * 0.7);
      innerShade(`rgba(255,255,255,${0.35 * k})`, depthPx * 1.5 + 2, hx, hy);
      innerShade(`rgba(0,0,0,${0.35 * k})`, depthPx * 1.5 + 2, sx, sy);
      break;
    }
    case "engraved": {
      faces(Math.max(1.5, d.depth * 0.5), 0.52 * k, true);
      const [sx, sy] = toward(depthPx * 0.8 + 1);
      innerShade(`rgba(0,0,0,${0.5 * k})`, depthPx * 2 + 3, sx, sy);
      break;
    }
    case "soft": {
      const [hx, hy] = toward(depthPx * 0.85 + 1.4),
        [sx, sy] = away(depthPx * 0.85 + 1.4);
      innerShade(`rgba(255,255,255,${0.4 * k})`, depthPx * 3 + 8, hx, hy);
      innerShade(`rgba(0,0,0,${0.35 * k})`, depthPx * 3 + 8, sx, sy);
      break;
    }
    case "glossy": {
      gloss(k);
      faces(1.5, 0.4 * k, false);
      const [sx, sy] = away(2);
      innerShade(`rgba(0,0,0,${0.3 * k})`, depthPx * 2 + 4, sx, sy);
      break;
    }
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
    ctx.fillStyle = d.accent ?? d.border;
    if (!d.accent) ctx.globalAlpha *= 0.65;
    ctx.fillRect(
      p + 6,
      p + 6 + offset,
      ((w - 12) * clamp(d.progress ?? 68, 0, 100)) / 100,
      h - 12,
    );
    ctx.restore();
  }
  const text = withText ? d.text : "",
    icon = d.iconData ? "image" : d.icon;
  ctx.font = `${d.bold ? "700" : "400"} ${d.fontSize}px ${d.font}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const textW = text ? Math.min(ctx.measureText(text).width, w - 40) : 0,
    iconSize = icon ? d.fontSize : 0,
    gap = text && icon ? 12 : 0,
    total = textW + iconSize + gap,
    cy = band ? p + offset + band / 2 : p + h / 2 + offset;
  const shadowOn = () => {
    if (!d.textShadow) return;
    ctx.shadowColor = "rgba(0,0,0,.55)";
    ctx.shadowBlur = 3 * unit;
    ctx.shadowOffsetY = 2 * unit;
  };
  const shadowOff = () => {
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
  };
  if (icon) {
    ctx.save();
    ctx.translate(p + w / 2 - total / 2 + iconSize / 2, cy);
    shadowOn();
    if (icon === "image") {
      if (images.has(d.iconData))
        ctx.drawImage(
          images.get(d.iconData)!,
          -iconSize / 2,
          -iconSize / 2,
          iconSize,
          iconSize,
        );
    } else {
      const mode = iconPath(ctx, icon, iconSize),
        stroke = mode === "stroke" ? iconSize * 0.16 : 0;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      if (d.textOutline > 0) {
        ctx.strokeStyle = d.textOutlineColor;
        ctx.lineWidth = stroke + d.textOutline * 2;
        ctx.stroke();
        shadowOff();
      }
      ctx.fillStyle = d.textColor;
      ctx.strokeStyle = d.textColor;
      if (mode === "stroke") {
        ctx.lineWidth = stroke;
        ctx.stroke();
      } else ctx.fill(mode === "evenodd" ? "evenodd" : "nonzero");
    }
    ctx.restore();
  }
  if (text) {
    const tx = p + w / 2 + (iconSize + gap) / 2,
      ty = cy + 1,
      maxWidth = Math.max(1, w - 40 - iconSize - gap);
    ctx.save();
    shadowOn();
    if (d.textOutline > 0) {
      ctx.lineJoin = "round";
      ctx.lineWidth = d.textOutline * 2;
      ctx.strokeStyle = d.textOutlineColor;
      ctx.strokeText(text, tx, ty, maxWidth);
      shadowOff();
    }
    ctx.fillStyle = d.textColor;
    ctx.fillText(text, tx, ty, maxWidth);
    ctx.restore();
  }
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
  canvas.height = Math.ceil((d.height + p * 2 + depthOf(d)) * scale);
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
