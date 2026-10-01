import { z } from "zod";
import { baseDesign, defaultAssets, type Design, type Preset } from "./studio";
import { defaultScreen, type ScreenSettings } from "./screen";
const num = (min: number, max: number) => z.number().finite().min(min).max(max);
const color = z.string().regex(/^#[0-9a-f]{6}$/i);
const image = z
  .string()
  .max(4000000)
  .refine(
    (s) => !s || /^data:image\/(png|jpeg|webp);base64,[a-zA-Z0-9+/=]+$/.test(s),
    "Use a PNG, JPEG, or WebP image",
  );
export const designSchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().min(1).max(80),
  kind: z.enum(["button", "panel", "slot", "bar"]),
  width: num(24, 1024),
  height: num(24, 1024),
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
  surface: z.enum(["raised", "flat", "embossed", "engraved"]),
  shadow: num(0, 100),
  shadowBlur: num(0, 40),
  shadowOffset: num(0, 40),
  glow: num(0, 32),
  text: z.string().max(120),
  textColor: color,
  fontSize: num(10, 96),
  font: z.enum(["Arial", "Verdana", "Georgia", "Trebuchet MS", "Courier New"]),
  bold: z.boolean(),
  includeText: z.boolean(),
  slice: num(0, 512),
  texture: image,
  icon: z.enum(["", "play", "plus", "star"]),
  iconData: image,
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
  })
  .refine((p) => JSON.stringify(p).length <= 24000000, "Project is too large");
export interface Project {
  version: 1;
  name: string;
  assets: Design[];
  styles: Preset[];
  effect: Effect;
  screen: ScreenSettings;
}
export const initialProject: Project = {
  version: 1,
  name: "My game UI",
  assets: defaultAssets.map((a, i) => ({
    ...a,
    x: i === 1 ? 300 : i === 0 ? 336 : 650,
    y: i === 1 ? 170 : i === 0 ? 270 : 340,
  })),
  styles: [],
  effect: defaultEffect,
  screen: defaultScreen,
};
export function parseProject(v: unknown): Project {
  return projectSchema.parse(v);
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
