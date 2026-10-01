"use client";
import {
  ArrowLeftRight,
  Copy,
  Download,
  ImagePlus,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Choice, Color, NumberField, Range } from "./studio-controls";
import {
  screenPresets,
  type Screen,
  type ScreenSettings,
  type ViewSettings,
} from "@/lib/screen";

export function ScreenInspector({
  screen,
  screens,
  onSelectScreen,
  onAddScreen,
  onDuplicateScreen,
  onDeleteScreen,
  onChange,
  onImage,
  onExport,
  onExportAll,
  busy,
  view,
  onView,
}: {
  screen: Screen;
  screens: Screen[];
  onSelectScreen: (id: string) => void;
  onAddScreen: () => void;
  onDuplicateScreen: () => void;
  onDeleteScreen: () => void;
  onChange: (update: Partial<ScreenSettings>) => void;
  onImage: () => void;
  onExport: () => void;
  onExportAll: () => void;
  busy: boolean;
  view: ViewSettings;
  onView: (update: Partial<ViewSettings>) => void;
}) {
  const preset = screenPresets.find(
    (p) => p.width === screen.width && p.height === screen.height,
  );
  return (
    <>
      <section className="property-section">
        <div className="section-heading">
          <h3>Screens</h3>
          <button
            className="icon-button"
            title="Add screen"
            aria-label="Add screen"
            disabled={screens.length >= 20}
            onClick={onAddScreen}
          >
            <Plus size={16} />
          </button>
        </div>
        <div className="screen-list">
          {screens.map((s) => (
            <button
              key={s.id}
              className={`screen-row ${s.id === screen.id ? "selected" : ""}`}
              aria-current={s.id === screen.id ? "true" : undefined}
              onClick={() => onSelectScreen(s.id)}
            >
              <span>{s.name}</span>
              <small>
                {s.width} × {s.height} · {Object.keys(s.placements).length}{" "}
                placed
              </small>
            </button>
          ))}
        </div>
        <div className="two-fields mt-3">
          <button
            className="secondary-button"
            title="Duplicate this screen with its layout"
            disabled={screens.length >= 20}
            onClick={onDuplicateScreen}
          >
            <Copy size={15} /> Duplicate
          </button>
          <button
            className="secondary-button"
            title="Delete this screen"
            disabled={screens.length < 2}
            onClick={onDeleteScreen}
          >
            <Trash2 size={15} /> Delete
          </button>
        </div>
        <p className="help-text">
          Assets are shared between screens. Each screen remembers where its
          assets sit; click an asset in the list to place it here.
        </p>
      </section>
      <section className="property-section">
        <label className="field-label" htmlFor="screen-name">
          Screen name
        </label>
        <input
          className="text-input no-margin"
          id="screen-name"
          value={screen.name}
          maxLength={80}
          onChange={(e) =>
            onChange({ name: e.target.value || "Untitled screen" })
          }
        />
      </section>
      <section className="property-section">
        <div className="section-heading">
          <h3>Screen size</h3>
          <button
            className="icon-button"
            title="Swap width and height"
            aria-label="Swap screen orientation"
            onClick={() =>
              onChange({ width: screen.height, height: screen.width })
            }
          >
            <ArrowLeftRight size={16} />
          </button>
        </div>
        <Choice
          label="Screen size preset"
          value={preset?.value || "custom"}
          options={[
            { value: "custom", label: "Custom size" },
            ...screenPresets,
          ]}
          onChange={(value) => {
            const preset = screenPresets.find((p) => p.value === value);
            if (preset)
              onChange({ width: preset.width, height: preset.height });
          }}
        />
        <div className="two-fields mt-4">
          <NumberField
            label="Screen width"
            displayLabel="W"
            value={screen.width}
            min={64}
            max={4096}
            onChange={(width) => onChange({ width: Math.round(width) })}
          />
          <NumberField
            label="Screen height"
            displayLabel="H"
            value={screen.height}
            min={64}
            max={4096}
            onChange={(height) => onChange({ height: Math.round(height) })}
          />
        </div>
        <p className="help-text">
          64–4096 px per side. Resizing keeps your assets at their current
          positions.
        </p>
      </section>
      <section className="property-section">
        <div className="section-heading">
          <h3>Guides</h3>
        </div>
        <div className="toggle-row">
          <label htmlFor="show-grid">Show grid</label>
          <Switch
            id="show-grid"
            checked={view.showGrid}
            onCheckedChange={(showGrid) => onView({ showGrid })}
          />
        </div>
        <div className="field-label">Grid size</div>
        <Choice
          label="Grid size"
          value={String(view.grid)}
          options={[4, 8, 12, 16, 24, 32, 48, 64].map((v) => ({
            value: String(v),
            label: `${v} px`,
          }))}
          onChange={(v) => onView({ grid: Number(v) })}
        />
        <div className="toggle-row">
          <label htmlFor="snap-grid">Snap to grid</label>
          <Switch
            id="snap-grid"
            checked={view.snapGrid}
            onCheckedChange={(snapGrid) => onView({ snapGrid })}
          />
        </div>
        <div className="toggle-row">
          <label htmlFor="show-rulers">Rulers</label>
          <Switch
            id="show-rulers"
            checked={view.rulers}
            onCheckedChange={(rulers) => onView({ rulers })}
          />
        </div>
        <p className="help-text">
          Assets also snap to the screen edges and centre and to each other.
          Hold ⌘ (Ctrl) while dragging to skip snapping.
        </p>
      </section>
      <section className="property-section">
        <div className="section-heading">
          <h3>Background</h3>
        </div>
        <Choice
          label="Screen background type"
          value={screen.background}
          options={[
            { value: "solid", label: "Solid color" },
            { value: "gradient", label: "Gradient" },
            { value: "image", label: "Image" },
            { value: "transparent", label: "Transparent" },
          ]}
          onChange={(background) =>
            onChange({ background: background as ScreenSettings["background"] })
          }
        />
        {screen.background !== "transparent" && (
          <div className="mt-4">
            <div className="field-label">
              {screen.background === "image" ? "Base color" : "Color"}
            </div>
            <div
              className={screen.background === "gradient" ? "two-fields" : ""}
            >
              <Color
                label="Screen background color"
                value={screen.color}
                onChange={(color) => onChange({ color })}
              />
              {screen.background === "gradient" && (
                <Color
                  label="Screen gradient end color"
                  value={screen.colorEnd}
                  onChange={(colorEnd) => onChange({ colorEnd })}
                />
              )}
            </div>
          </div>
        )}
        {screen.background === "gradient" && (
          <Range
            label="Screen gradient angle"
            value={screen.angle}
            max={360}
            suffix="°"
            onChange={(angle) => onChange({ angle })}
          />
        )}
        {screen.background === "image" && (
          <>
            {screen.image && (
              <div className="screen-image-preview">
                <img src={screen.image} alt="Screen background" />
              </div>
            )}
            <button className="secondary-button full mt-4" onClick={onImage}>
              <ImagePlus size={16} />
              {screen.image ? "Replace background" : "Upload background"}
            </button>
            {screen.image && (
              <div className="inline-actions">
                <button
                  className="text-button"
                  onClick={() => onChange({ image: "" })}
                >
                  <X size={14} /> Remove image
                </button>
              </div>
            )}
            <div className="mt-4">
              <Choice
                label="Background image fit"
                value={screen.imageFit}
                options={[
                  { value: "cover", label: "Fill screen (crop)" },
                  { value: "contain", label: "Fit inside" },
                  { value: "stretch", label: "Stretch to screen" },
                ]}
                onChange={(imageFit) =>
                  onChange({ imageFit: imageFit as ScreenSettings["imageFit"] })
                }
              />
            </div>
            <p className="help-text">
              PNG, JPEG, or WebP, up to 2.5 MB. Images are stored in your local
              project file.
            </p>
          </>
        )}
        {screen.background === "transparent" && (
          <p className="help-text">
            The checkerboard is a preview only. Exported areas without assets
            stay transparent.
          </p>
        )}
      </section>
      <section className="property-section">
        <h3>Export screen</h3>
        <p className="help-text">
          A single {screen.width} × {screen.height} PNG with your background and
          arranged assets.
        </p>
        <button
          className="primary-button full"
          disabled={busy}
          onClick={onExport}
        >
          <Download size={16} />
          {busy ? "Preparing screen…" : "Download screen PNG"}
        </button>
        {screens.length > 1 && (
          <button
            className="secondary-button full mt-3"
            disabled={busy}
            onClick={onExportAll}
          >
            <Download size={15} /> Export all {screens.length} screens
          </button>
        )}
      </section>
    </>
  );
}
