"use client";
import { ArrowLeftRight, Download, ImagePlus, X } from "lucide-react";
import { Choice, Color, NumberField, Range } from "./studio-controls";
import { screenPresets, type ScreenSettings } from "@/lib/screen";

export function ScreenInspector({
  screen,
  onChange,
  onImage,
  onExport,
  busy,
}: {
  screen: ScreenSettings;
  onChange: (update: Partial<ScreenSettings>) => void;
  onImage: () => void;
  onExport: () => void;
  busy: boolean;
}) {
  const preset = screenPresets.find(
    (p) => p.width === screen.width && p.height === screen.height,
  );
  return (
    <>
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
      </section>
    </>
  );
}
