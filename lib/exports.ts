import {
  canvasBlob,
  renderDesign,
  loadImages,
  padding,
  slug,
  states,
  type Design,
  type ButtonState,
} from "./studio";
import { createZip } from "./zip";
import { renderEffect } from "./effects";
import type { Effect } from "./project";
import { orderedScreenAssets, type ScreenSettings } from "./screen";
export async function exportAssets(
  assets: Design[],
  scale: number,
  allStates: boolean,
  selected: ButtonState,
  withText: boolean,
  screen?: ScreenSettings,
) {
  const files: { name: string; data: Blob | string }[] = [],
    entries: object[] = [],
    placements: { kind: string; order: number; placement: object }[] = [];
  // Draw order of the screen builder: panels first, then the rest. The
  // Unity importer stacks children in manifest order, bottom first.
  const drawOrder = new Map(
    orderedScreenAssets(assets).map((a, i) => [a.id, i] as const),
  );
  for (const [index, original] of assets.entries()) {
    const d = withText
      ? original
      : { ...original, text: "", icon: "", iconData: "" };
    await loadImages(d);
    let firstFile = "";
    for (const s of allStates && d.kind === "button" ? states : [selected]) {
      const file = `${String(index + 1).padStart(2, "0")}-${slug(d.name)}-${s}.png`,
        c = renderDesign(d, s, scale, withText && d.includeText),
        p = padding(d),
        slice = Math.min(d.slice, d.width / 2 - 1, d.height / 2 - 1);
      files.push({ name: file, data: await canvasBlob(c) });
      if (!firstFile) firstFile = file;
      entries.push({
        file,
        name: d.name,
        state: s,
        width: c.width,
        height: c.height,
        left: (p + slice) * scale,
        bottom: (p + d.depth + slice) * scale,
        right: (p + slice) * scale,
        top: (p + slice) * scale,
        body: {
          x: p * scale,
          y: p * scale,
          width: d.width * scale,
          height: d.height * scale,
        },
      });
    }
    // Screen builder placement, in screen pixels at 1x, top-left origin:
    // the Unity importer builds a frame prefab from these.
    if (screen && original.x !== undefined && original.y !== undefined)
      placements.push({
        kind: d.kind,
        order: drawOrder.get(d.id) ?? index,
        placement: {
          name: d.name,
          kind: d.kind,
          file: firstFile,
          x: original.x,
          y: original.y,
          width: d.width,
          height: d.height,
        },
      });
  }
  files.push({
    name: "uim-manifest.json",
    data: JSON.stringify(
      {
        version: 1,
        scale,
        pixelsPerUnit: 100,
        assets: entries,
        screen: screen
          ? {
              name: screen.name,
              width: screen.width,
              height: screen.height,
              assets: placements
                .sort((a, b) => a.order - b.order)
                .map((p) => p.placement),
            }
          : undefined,
      },
      null,
      2,
    ),
  });
  const response = await fetch("/UIMAssetImporter.cs");
  if (!response.ok) throw new Error("Unity importer is unavailable");
  files.push({
    name: "Editor/UIMAssetImporter.cs",
    data: await response.text(),
  });
  files.push({
    name: "README.txt",
    data: "UIM Studio asset pack\n\n1. Extract this folder under Assets in your Unity project. Keep Editor/UIMAssetImporter.cs inside an Editor folder.\n2. Select uim-manifest.json in Unity. Choose Tools > UIM Studio > Apply sprite settings.\n3. Add a UI Image, assign a sprite, and choose Image Type: Sliced for resizable panels.\n4. The transparent padding preserves shadows and glow. Sprite borders include that padding. Text and icons baked into the image will stretch when sliced; export backgrounds without labels/icons for resizable UI.\n5. Connect the state sprites to your Button Sprite Swap transition.\n6. If the kit was exported with assets placed in the Screen builder, choose Tools > UIM Studio > Build screen prefab: a prefab named after the screen, one Image per asset at its exact position and size, buttons with their state sprites wired. Game logic stays in Unity.\n\nImported as Sprite (2D and UI), 100 pixels per unit times the export scale, alpha transparency, no mipmaps, uncompressed. Review memory use and compression for your target platform.\n",
  });
  return createZip(files);
}
export async function exportEffect(
  e: Effect,
  format: "sheet" | "sequence",
  onProgress: (v: number) => void,
) {
  const total = Math.round(e.duration * e.fps),
    columns = Math.min(Math.floor(2048 / e.width), Math.ceil(Math.sqrt(total))),
    rowsPerSheet = Math.max(1, Math.floor(2048 / e.height)),
    perSheet = columns * rowsPerSheet;
  const files: { name: string; data: Blob | string }[] = [],
    sheets: object[] = [];
  let sheet: HTMLCanvasElement | undefined,
    ctx: CanvasRenderingContext2D | null = null;
  for (let i = 0; i < total; i++) {
    if (format === "sheet" && i % perSheet === 0) {
      const count = Math.min(perSheet, total - i);
      sheet = document.createElement("canvas");
      sheet.width = columns * e.width;
      sheet.height = Math.ceil(count / columns) * e.height;
      ctx = sheet.getContext("2d");
      sheets.push({
        file: `${e.type}-${Math.floor(i / perSheet) + 1}.png`,
        firstFrame: i,
        frameCount: count,
        columns,
        rows: Math.ceil(count / columns),
      });
    }
    const frame = renderEffect(e, i / e.fps);
    if (format === "sequence")
      files.push({
        name: `frames/${e.type}-${String(i).padStart(4, "0")}.png`,
        data: await canvasBlob(frame),
      });
    else {
      ctx!.drawImage(
        frame,
        (i % columns) * e.width,
        Math.floor((i % perSheet) / columns) * e.height,
      );
      if (i % perSheet === perSheet - 1 || i === total - 1) {
        files.push({
          name: `${e.type}-${Math.floor(i / perSheet) + 1}.png`,
          data: await canvasBlob(sheet!),
        });
        sheet!.width = 0;
        sheet!.height = 0;
      }
    }
    onProgress(Math.round(((i + 1) / total) * 100));
    if (i % 4 === 0) await new Promise((r) => setTimeout(r, 0));
  }
  files.push({
    name: "animation.json",
    data: JSON.stringify(
      {
        version: 1,
        type: e.type,
        frameWidth: e.width,
        frameHeight: e.height,
        fps: e.fps,
        duration: e.duration,
        frameCount: total,
        loop: e.type !== "confetti",
        frameOrder: "left to right, top to bottom",
        sheets,
      },
      null,
      2,
    ),
  });
  files.push({
    name: "README.txt",
    data: `Import the PNGs into Unity as Sprite (2D and UI). For sheets, set Sprite Mode to Multiple, open Sprite Editor, and Slice by Grid by Cell Size: ${e.width} x ${e.height}. Use animation.json to ignore unused cells and play the frames at ${e.fps} fps. ${e.type === "confetti" ? "This is a one-shot burst." : "Enable looping."} No animation clip is automatically created.\n`,
  });
  return createZip(files);
}
