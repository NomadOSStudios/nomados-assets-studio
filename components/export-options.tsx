"use client";
import { useId } from "react";
import { Download } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Choice, Range } from "./studio-controls";
import { padding, type ButtonState, type Design } from "@/lib/studio";
export type ExportSettings = {
  scope: "png" | "states" | "kit";
  scale: number;
  content: boolean;
};
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
          {(d.height + p * 2 + d.depth) * s.scale}
        </strong>
        <span>
          Pixels, including transparent effect padding
          {s.scope === "png" &&
            ` · ${stateLabel} state, chosen under the canvas`}
        </span>
      </div>
      <div className="toggle-row">
        <label htmlFor={id + "content"}>Include text & icons</label>
        <Switch
          id={id + "content"}
          checked={s.content}
          onCheckedChange={(content) => onChange({ content })}
        />
      </div>
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
