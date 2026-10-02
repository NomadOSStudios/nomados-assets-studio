"use client";
import { useEffect, useId, useRef, useState } from "react";
import { Download } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Choice, NumberField, Range } from "./studio-controls";
import {
  depthOf,
  isText,
  loadImages,
  padding,
  renderDesign,
  type ButtonState,
  type Design,
} from "@/lib/studio";
export type ExportSettings = {
  scope: "png" | "states" | "kit";
  scale: number;
  /** Bake text into the images. Off: words arrive as Unity text objects. */
  content: boolean;
  states: "all" | "phone" | "default";
  compression: "normal" | "none";
};
// Draws a rendered asset stretched to a new size the way Unity's Sliced
// image does: corners stay fixed, edges stretch one way, the middle both.
function drawNineSlice(
  ctx: CanvasRenderingContext2D,
  src: HTMLCanvasElement,
  border: { left: number; right: number; top: number; bottom: number },
  outW: number,
  outH: number,
) {
  const sw = src.width,
    sh = src.height;
  const cols = [
    [0, border.left, 0, border.left],
    [border.left, sw - border.left - border.right, border.left, outW - border.left - border.right],
    [sw - border.right, border.right, outW - border.right, border.right],
  ];
  const rows = [
    [0, border.top, 0, border.top],
    [border.top, sh - border.top - border.bottom, border.top, outH - border.top - border.bottom],
    [sh - border.bottom, border.bottom, outH - border.bottom, border.bottom],
  ];
  for (const [sx, sWidth, dx, dWidth] of cols)
    for (const [sy, sHeight, dy, dHeight] of rows)
      if (sWidth > 0 && sHeight > 0 && dWidth > 0 && dHeight > 0)
        ctx.drawImage(src, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
}
function StretchPreview({
  design: d,
  state,
  width,
  height,
}: {
  design: Design;
  state: ButtonState;
  width: number;
  height: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let active = true;
    loadImages(d)
      .catch(() => {})
      .then(() => {
        const canvas = ref.current;
        if (!active || !canvas) return;
        const src = renderDesign(d, state, 1, d.includeText),
          p = padding(d),
          depth = depthOf(d),
          slice = Math.max(
            0,
            Math.min(d.slice, Math.floor(Math.min(d.width, d.height) / 2) - 1),
          );
        canvas.width = width + p * 2;
        canvas.height = height + p * 2 + depth;
        const ctx = canvas.getContext("2d")!;
        drawNineSlice(
          ctx,
          src,
          { left: p + slice, right: p + slice, top: p + slice, bottom: p + depth + slice },
          canvas.width,
          canvas.height,
        );
      });
    return () => {
      active = false;
    };
  }, [d, state, width, height]);
  return (
    <canvas
      ref={ref}
      className="stretch-preview"
      aria-label={`${d.name} stretched to ${width} by ${height} pixels`}
    />
  );
}
export function ExportOptions({
  design: d,
  state,
  settings: s,
  onChange,
  busy,
  onExport,
  guides,
  onGuides,
  onSlice,
}: {
  design: Design;
  state: ButtonState;
  settings: ExportSettings;
  onChange: (v: Partial<ExportSettings>) => void;
  busy: boolean;
  onExport: () => void;
  guides: boolean;
  onGuides: (v: boolean) => void;
  onSlice: (v: number) => void;
}) {
  const p = padding(d),
    id = useId(),
    stateLabel =
      state === "normal" ? "Default" : state[0].toUpperCase() + state.slice(1);
  const [stretch, setStretch] = useState({
    width: Math.min(1024, Math.round(d.width * 1.6)),
    height: d.height,
  });
  return (
    <div className="export-options">
      <label className="field-label">Export</label>
      <Choice
        label="Export scope"
        value={s.scope}
        options={[
          { value: "png", label: `${stateLabel} state · PNG` },
          { value: "states", label: "All button states · ZIP" },
          { value: "kit", label: "Entire asset kit · ZIP" },
        ]}
        onChange={(v) => onChange({ scope: v as ExportSettings["scope"] })}
      />
      <label className="field-label mt-5">Resolution</label>
      <Choice
        label="Export scale"
        value={String(s.scale)}
        options={[1, 2, 4].map((v) => ({
          value: String(v),
          label: `${v}× resolution`,
        }))}
        onChange={(v) => onChange({ scale: Number(v) })}
      />
      <div className="export-dimensions">
        <strong>
          {(d.width + p * 2) * s.scale} ×{" "}
          {(d.height + p * 2 + depthOf(d)) * s.scale}
        </strong>
        <span>
          Pixels, including transparent effect padding
          {s.scope === "png" &&
            ` · ${stateLabel} state, chosen under the canvas`}
        </span>
      </div>
      {s.scope !== "png" && (
        <>
          <label className="field-label mt-5">Button states</label>
          <Choice
            label="Button states"
            value={s.states}
            options={[
              { value: "all", label: "All four states" },
              { value: "phone", label: "Phone · no hover" },
              { value: "default", label: "Default state only" },
            ]}
            onChange={(v) =>
              onChange({ states: v as ExportSettings["states"] })
            }
          />
          <label className="field-label mt-5">Unity texture import</label>
          <Choice
            label="Unity texture import"
            value={s.compression}
            options={[
              { value: "normal", label: "Compressed · platform default" },
              { value: "none", label: "Uncompressed" },
            ]}
            onChange={(v) =>
              onChange({ compression: v as ExportSettings["compression"] })
            }
          />
        </>
      )}
      <div className="toggle-row">
        <label htmlFor={id + "content"}>Bake text into images</label>
        <Switch
          id={id + "content"}
          checked={s.content}
          onCheckedChange={(content) => onChange({ content })}
        />
      </div>
      {!isText(d) && (
        <>
          <div className="export-divider" />
          <div className="toggle-row">
            <label htmlFor={id + "guides"}>9-slice guides</label>
            <Switch
              id={id + "guides"}
              checked={guides}
              onCheckedChange={onGuides}
            />
          </div>
          <Range
            label="Protected border"
            value={Math.min(
              d.slice,
              Math.floor(Math.min(d.width, d.height) / 2) - 1,
            )}
            max={Math.max(0, Math.floor(Math.min(d.width, d.height) / 2) - 1)}
            onChange={onSlice}
          />
          <p className="help-text">
            Keep corners and edges intact when resizing in Unity. For resizable
            assets, export text and icons separately.
          </p>
          <div className="field-label">Stretch preview</div>
          <div className="two-fields">
            <NumberField
              label="Stretch width"
              displayLabel="W"
              value={stretch.width}
              min={24}
              max={1024}
              onChange={(width) => setStretch((v) => ({ ...v, width }))}
            />
            <NumberField
              label="Stretch height"
              displayLabel="H"
              value={stretch.height}
              min={24}
              max={1024}
              onChange={(height) => setStretch((v) => ({ ...v, height }))}
            />
          </div>
          <div className="stretch-box checker">
            <StretchPreview
              design={d}
              state={state}
              width={stretch.width}
              height={stretch.height}
            />
          </div>
          <p className="help-text">
            How the Unity Sliced image type will show this asset at another
            size with the protected border above.
          </p>
        </>
      )}
      <button
        className="primary-button full"
        disabled={busy}
        onClick={onExport}
      >
        <Download size={16} />
        {busy
          ? "Preparing export…"
          : s.scope === "png"
            ? "Download PNG"
            : "Download ZIP"}
      </button>
      <p className="help-text">
        ZIP packs include sprite settings, a Unity importer, and setup
        instructions.
      </p>
    </div>
  );
}
