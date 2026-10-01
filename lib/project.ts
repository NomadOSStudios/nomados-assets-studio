import { z } from "zod";
import {
  defaultAssets,
  iconNames,
  type Design,
  type Preset,
} from "./studio";
import {
  defaultScreen,
  defaultView,
  type Screen,
  type ViewSettings,
} from "./screen";
import type { ProjectFont } from "./fonts";
const num = (min: number, max: number) => z.number().finite().min(min).max(max);
const color = z.string().regex(/^#[0-9a-f]{6}$/i);
const image = z
  .string()
  .max(4000000)
  .refine(
    (s) => !s || /^data:image\/(png|jpeg|webp);base64,[a-zA-Z0-9+/=]+$/.test(s),
    "Use a PNG, JPEG, or WebP image",
  );
const stateStyle = z.object({
  fill: color.optional(),
  fillEnd: color.optional(),
  border: color.optional(),
  textColor: color.optional(),
});
export const designSchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().min(1).max(80),
  kind: z.enum([
    "button",
    "panel",
    "slot",
    "bar",
    "badge",
    "window",
    "title",
    "paragraph",
    "toggle",
    "checkbox",
    "slider",
    "tabs",
    "bubble",
    "frame",
    "iconbutton",
    "counter",
    "healthbar",
  ]),
  // Thin tracks such as sliders go down to 8 px.
  width: num(8, 1024),
  height: num(8, 1024),
  radius: num(0, 512),
  corners: z.tuple([num(0, 512), num(0, 512), num(0, 512), num(0, 512)]),
  independentCorners: z.boolean(),
  fill: color,
  fillEnd: color,
  gradient: z.boolean(),
  angle: num(0, 360),
  border: color,
  borderWidth: num(0, 12),
  borderPosition: z.enum(["inside", "center", "outside"]).default("inside"),
  depth: num(0, 16),
  surface: z.enum([
    "raised",
    "flat",
    "embossed",
    "engraved",
    "glossy",
    "bevel",
    "soft",
  ]),
  shadow: num(0, 100),
  shadowBlur: num(0, 40),
  shadowOffset: num(0, 40),
  glow: num(0, 32),
  text: z.string().max(120),
  textColor: color,
  fontSize: num(10, 96),
  font: z.string().min(1).max(80),
  bold: z.boolean(),
  includeText: z.boolean(),
  slice: num(0, 512),
  texture: image,
  icon: z.enum(iconNames),
  iconData: image,
  // Fields added after version one default so older projects open unchanged.
  shape: z.enum(["round", "cut"]).default("round"),
  highlight: num(0, 100).default(60),
  lightAngle: num(0, 360).default(120),
  textOutline: num(0, 8).default(0),
  textOutlineColor: color.default("#000000"),
  textShadow: z.boolean().default(false),
  textAlign: z.enum(["left", "center", "right"]).default("center"),
  lineHeight: num(1, 2.5).default(1.3),
  progress: num(0, 100).default(68),
  accent: color.optional(),
  gradientType: z.enum(["linear", "radial"]).default("linear"),
  stops: z.array(z.object({ at: num(0, 100), color })).max(4).default([]),
  shadowColor: color.default("#000000"),
  glowColor: color.optional(),
  textureOpacity: num(0, 100).default(45),
  textureScale: num(10, 400).default(100),
  textureRepeat: z.boolean().default(false),
  grain: num(0, 100).default(0),
  letterSpacing: num(-4, 24).default(0),
  uppercase: z.boolean().default(false),
  pixelSize: num(0, 8).default(0),
  on: z.boolean().default(true),
  segments: num(2, 40).default(10),
  activeTab: num(0, 11).default(0),
  tail: z.enum(["bottom", "top", "left", "right"]).default("bottom"),
  stateStyles: z
    .object({
      hover: stateStyle.optional(),
      pressed: stateStyle.optional(),
      disabled: stateStyle.optional(),
    })
    .optional(),
  locked: z.boolean().default(false),
  hidden: z.boolean().default(false),
  themeId: z.string().max(80).optional(),
  x: num(0, 4096).default(300),
  y: num(0, 4096).default(260),
});
export const screenSchema = z.object({
  name: z.string().min(1).max(80),
  width: num(64, 4096).int(),
  height: num(64, 4096).int(),
  background: z.enum(["solid", "gradient", "transparent", "image"]),
  color,
  colorEnd: color,
  angle: num(0, 360),
  image,
  imageFit: z.enum(["cover", "contain", "stretch"]),
});
const placedScreenSchema = screenSchema.extend({
  id: z.string().min(1).max(60),
  placements: z
    .record(z.string(), z.object({ x: num(0, 4096), y: num(0, 4096) }))
    .default({}),
});
const fontSchema = z.object({
  name: z.string().min(1).max(60),
  data: z
    .string()
    .max(6000000)
    .regex(
      /^data:(font\/(ttf|otf|woff|woff2)|application\/(x-font-ttf|x-font-opentype|font-sfnt|octet-stream));base64,[a-zA-Z0-9+/=]+$/,
    ),
});
const viewSchema = z.object({
  grid: num(2, 256).default(16),
  showGrid: z.boolean().default(false),
  snapGrid: z.boolean().default(false),
  rulers: z.boolean().default(true),
});
export const effectSchema = z.object({
  type: z.enum(["confetti", "sparkles", "background"]),
  width: num(64, 1024),
  height: num(64, 1024),
  duration: num(1, 5),
  fps: z.union([z.literal(12), z.literal(24), z.literal(30)]),
  count: num(10, 180),
  size: num(2, 24),
  speed: num(0.2, 3),
  spread: num(20, 180),
  gravity: num(0, 500),
  color: color,
  secondary: color,
  seed: num(1, 9999),
});
export type Effect = z.infer<typeof effectSchema>;
export const defaultEffect: Effect = {
  type: "confetti",
  width: 384,
  height: 384,
  duration: 2,
  fps: 24,
  count: 70,
  size: 9,
  speed: 1,
  spread: 100,
  gravity: 160,
  color: "#b5eb68",
  secondary: "#a78bfa",
  seed: 42,
};
export const styleKeys = [
  "fill",
  "fillEnd",
  "gradient",
  "angle",
  "border",
  "borderWidth",
  "borderPosition",
  "radius",
  "corners",
  "independentCorners",
  "surface",
  "depth",
  "shadow",
  "shadowBlur",
  "shadowOffset",
  "glow",
  "textColor",
  "font",
  "bold",
  "texture",
  "shape",
  "highlight",
  "lightAngle",
  "textOutline",
  "textOutlineColor",
  "textShadow",
  "accent",
  "gradientType",
  "stops",
  "shadowColor",
  "glowColor",
  "textureOpacity",
  "textureScale",
  "textureRepeat",
  "grain",
  "letterSpacing",
  "uppercase",
  "pixelSize",
  "stateStyles",
] as const;
export function styleValues(d: Design): Partial<Design> {
  return Object.fromEntries(styleKeys.map((k) => [k, d[k]]));
}
const styleSchema = z.object({
  name: z.string().min(1).max(40),
  label: z.string().max(80),
  values: designSchema
    .partial()
    .refine((v) =>
      Object.keys(v).every((k) => (styleKeys as readonly string[]).includes(k)),
    ),
});
export const projectSchema = z
  .object({
    version: z.literal(1),
    name: z.string().min(1).max(80),
    assets: z
      .array(designSchema)
      .min(1)
      .max(50)
      .refine(
        (a) => new Set(a.map((x) => x.id)).size === a.length,
        "Asset IDs must be unique",
      ),
    styles: z.array(styleSchema).max(30),
    effect: effectSchema,
    // Version-one projects predate screen settings. Preserve their original canvas.
    screen: screenSchema.default(defaultScreen),
    // Later projects carry several screens, each with its own placements.
    screens: z.array(placedScreenSchema).max(20).optional(),
    activeScreen: z.string().max(60).optional(),
    fonts: z.array(fontSchema).max(12).default([]),
    view: viewSchema.default(defaultView),
  })
  .refine((p) => JSON.stringify(p).length <= 24000000, "Project is too large");
export interface Project {
  version: 1;
  name: string;
  assets: Design[];
  styles: Preset[];
  effect: Effect;
  screens: Screen[];
  activeScreen: string;
  fonts: ProjectFont[];
  view: ViewSettings;
}
const starterPositions = [
  { x: 336, y: 270 },
  { x: 300, y: 170 },
  { x: 650, y: 340 },
];
export const initialProject: Project = {
  version: 1,
  name: "My game UI",
  assets: defaultAssets.map((a, i) => ({ ...a, ...starterPositions[i] })),
  styles: [],
  effect: defaultEffect,
  screens: [
    {
      ...defaultScreen,
      id: "screen-1",
      placements: Object.fromEntries(
        defaultAssets.map((a, i) => [a.id, starterPositions[i]]),
      ),
    },
  ],
  activeScreen: "screen-1",
  fonts: [],
  view: defaultView,
};
export function parseProject(v: unknown): Project {
  const p = projectSchema.parse(v);
  // Single-screen projects become one screen placed from the assets' x/y.
  const screens: Screen[] = p.screens?.length
    ? p.screens
    : [
        {
          ...p.screen,
          id: "screen-1",
          placements: Object.fromEntries(
            p.assets.map((a) => [a.id, { x: a.x, y: a.y }]),
          ),
        },
      ];
  const { screen: _legacy, ...rest } = p;
  void _legacy;
  return {
    ...rest,
    screens,
    activeScreen: screens.some((s) => s.id === p.activeScreen)
      ? p.activeScreen!
      : screens[0].id,
  };
}
async function db() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const r = indexedDB.open("uim-studio", 1);
    r.onupgradeneeded = () => r.result.createObjectStore("projects");
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}
export async function readProject() {
  const database = await db();
  try {
    return await new Promise<Project | null>((resolve, reject) => {
      const r = database
        .transaction("projects")
        .objectStore("projects")
        .get("current");
      r.onsuccess = () => {
        try {
          resolve(r.result ? parseProject(r.result) : null);
        } catch (e) {
          reject(e);
        }
      };
      r.onerror = () => reject(r.error);
    });
  } finally {
    database.close();
  }
}
export async function writeProject(p: Project) {
  const database = await db();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = database.transaction("projects", "readwrite");
      tx.objectStore("projects").put(p, "current");
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    database.close();
  }
}
