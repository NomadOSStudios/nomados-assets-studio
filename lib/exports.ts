import {
  canvasBlob,
  renderDesign,
  loadImages,
  padding,
  depthOf,
  isText,
  isButtonLike,
  slug,
  states,
  type Design,
  type ButtonState,
} from "./studio";
import { createZip } from "./zip";
import { renderEffect } from "./effects";
import type { Effect } from "./project";
import { orderedScreenAssets, type ScreenSettings } from "./screen";
/** A screen to export: its settings and the visible assets placed on it. */
export type ExportScreen = { settings: ScreenSettings; assets: Design[] };
export async function exportAssets(
  assets: Design[],
  scale: number,
  allStates: boolean,
  selected: ButtonState,
  withText: boolean,
  screens: ExportScreen[] = [],
  groups: { id: string; name: string }[] = [],
) {
  const files: { name: string; data: Blob | string }[] = [],
    entries: object[] = [],
    firstFiles = new Map<string, string>();
  for (const [index, original] of assets.entries()) {
    const d = withText
      ? original
      : { ...original, text: "", icon: "", iconData: "" };
    await loadImages(d);
    let firstFile = "";
    for (const s of allStates && isButtonLike(d) ? states : [selected]) {
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
        bottom: (p + depthOf(d) + slice) * scale,
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
    firstFiles.set(d.id, firstFile);
  }
  // Screen builder placements, in screen pixels at 1x, top-left origin, in
  // draw order (the Unity importer stacks children bottom first). Titles and
  // paragraphs also carry their text so Unity can build real text objects.
  const manifestScreens = screens.map(({ settings, assets: placed }) => ({
    name: settings.name,
    width: settings.width,
    height: settings.height,
    assets: orderedScreenAssets(placed)
      .filter((a) => firstFiles.has(a.id))
      .map((a) => ({
        name: a.name,
        kind: a.kind,
        file: firstFiles.get(a.id),
        x: a.x ?? 0,
        y: a.y ?? 0,
        width: a.width,
        height: a.height,
        group: groups.find((g) => g.id === a.group)?.name,
        text: isText(a)
          ? {
              kind: a.kind,
              content: withText ? a.text : "",
              fontSize: a.fontSize,
              color: a.textColor,
              align: a.textAlign,
              bold: a.bold,
              lineHeight: a.lineHeight,
              font: a.font,
            }
          : undefined,
      })),
  }));
  files.push({
    name: "uim-manifest.json",
    data: JSON.stringify(
      {
        version: 1,
        scale,
        pixelsPerUnit: 100,
        assets: entries,
        screen: manifestScreens[0],
        screens: manifestScreens.length ? manifestScreens : undefined,
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
    data: "UIM Studio asset pack\n\n1. Extract this folder under Assets in your Unity project. Keep Editor/UIMAssetImporter.cs inside an Editor folder.\n2. Select uim-manifest.json in Unity. Choose Tools > UIM Studio > Apply sprite settings.\n3. Add a UI Image, assign a sprite, and choose Image Type: Sliced for resizable panels.\n4. The transparent padding preserves shadows and glow. Sprite borders include that padding. Text and icons baked into the image will stretch when sliced; export backgrounds without labels/icons for resizable UI.\n5. Connect the state sprites to your Button Sprite Swap transition.\n6. If the kit was exported with assets placed in the Screen builder, choose Tools > UIM Studio > Build screen prefabs: one prefab per screen, one Image per asset at its exact position and size, buttons with their state sprites wired, and titles and paragraphs as editable text objects (TextMeshPro when installed, otherwise UI Text). Game logic stays in Unity.\n\nImported as Sprite (2D and UI), 100 pixels per unit times the export scale, alpha transparency, no mipmaps, uncompressed. Review memory use and compression for your target platform.\n",
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
