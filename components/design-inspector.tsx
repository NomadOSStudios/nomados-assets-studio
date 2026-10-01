"use client";
import { Upload, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Range, Color, Choice, NumberField } from "./studio-controls";
import {
  iconNames,
  surfaces,
  type BorderPosition,
  type Design,
  type Shape,
  type Surface,
} from "@/lib/studio";
export function DesignInspector({
  design: d,
  patch,
  onImage,
}: {
  design: Design;
  patch: (v: Partial<Design>) => void;
  onImage: (type: "texture" | "iconData") => void;
}) {
  return (
    <>
      <section className="property-section">
        <label className="field-label" htmlFor="asset-name">
          Asset name
        </label>
        <input
          id="asset-name"
          className="text-input no-margin"
          value={d.name}
          maxLength={80}
          onChange={(e) => patch({ name: e.target.value || "Untitled asset" })}
        />
      </section>
      <section className="property-section">
        <div className="section-heading">
          <h3>Dimensions</h3>
        </div>
        <div className="two-fields">
          <NumberField
            label="Width"
            value={d.width}
            min={24}
            onChange={(width) => patch({ width })}
          />
          <NumberField
            label="Height"
            value={d.height}
            min={24}
            onChange={(height) => patch({ height })}
          />
        </div>
        <div className="toggle-row">
          <label htmlFor="individual-corners">Individual corners</label>
          <Switch
            id="individual-corners"
            checked={d.independentCorners}
            onCheckedChange={(independentCorners) =>
              patch({
                independentCorners,
                corners: [d.radius, d.radius, d.radius, d.radius],
              })
            }
          />
        </div>
        {d.independentCorners ? (
          ["Top left", "Top right", "Bottom right", "Bottom left"].map(
            (label, i) => (
              <Range
                key={label}
                label={label}
                value={d.corners[i]}
                max={128}
                onChange={(v) => {
                  const corners = [...d.corners] as Design["corners"];
                  corners[i] = v;
                  patch({ corners });
                }}
              />
            ),
          )
        ) : (
          <Range
            label="Corner radius"
            value={d.radius}
            max={128}
            onChange={(radius) => patch({ radius })}
          />
        )}
        <div className="mt-4">
          <div className="field-label">Corner style</div>
          <Choice
            label="Corner style"
            value={d.shape}
            options={[
              { value: "round", label: "Rounded" },
              { value: "cut", label: "Cut · chamfered" },
            ]}
            onChange={(v) => patch({ shape: v as Shape })}
          />
        </div>
      </section>
      <section className="property-section">
        <div className="section-heading">
          <h3>Fill</h3>
          <label className="heading-toggle" htmlFor="gradient-fill">
            Gradient
            <Switch
              id="gradient-fill"
              checked={d.gradient}
              onCheckedChange={(gradient) => patch({ gradient })}
            />
          </label>
        </div>
        <div
          className="gradient-preview"
          style={{
            background: `linear-gradient(${d.angle + 90}deg,${d.fill},${d.gradient ? d.fillEnd : d.fill})`,
          }}
        />
        <div className="two-fields">
          <Color
            label="Fill start"
            value={d.fill}
            onChange={(fill) => patch({ fill })}
          />
          {d.gradient && (
            <Color
              label="Fill end"
              value={d.fillEnd}
              onChange={(fillEnd) => patch({ fillEnd })}
            />
          )}
        </div>
        {d.gradient && (
          <Range
            label="Gradient angle"
            value={d.angle}
            max={360}
            suffix="°"
            onChange={(angle) => patch({ angle })}
          />
        )}
        <div className="inline-actions">
          <button className="text-button" onClick={() => onImage("texture")}>
            <Upload size={13} />
            {d.texture ? "Replace texture" : "Add texture"}
          </button>
          {d.texture && (
            <button
              className="icon-button"
              aria-label="Remove texture"
              onClick={() => patch({ texture: "" })}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </section>
      <section className="property-section">
        <div className="section-heading">
          <h3>Border</h3>
          <div className="border-position-choice">
            <Choice
              label="Border position"
              value={d.borderPosition ?? "inside"}
              options={[
                { value: "inside", label: "Inside" },
                { value: "center", label: "Center" },
                { value: "outside", label: "Outside" },
              ]}
              onChange={(v) => patch({ borderPosition: v as BorderPosition })}
            />
          </div>
        </div>
        <div className="two-fields">
          <Color
            label="Border color"
            value={d.border}
            onChange={(border) => patch({ border })}
          />
          <NumberField
            label="Stroke"
            value={d.borderWidth}
            max={12}
            step={0.5}
            onChange={(borderWidth) => patch({ borderWidth })}
          />
        </div>
        <p className="help-text">
          {d.borderPosition === "outside"
            ? "Extends beyond the shape without covering its fill."
            : d.borderPosition === "center"
              ? "Half the border sits inside the shape, half outside."
              : "Drawn within the shape's width and height."}
        </p>
      </section>
      <section className="property-section">
        <div className="section-heading">
          <h3>Depth & lighting</h3>
        </div>
        <div className="field-label">Surface</div>
        <Choice
          label="Surface style"
          value={d.surface}
          options={surfaces}
          onChange={(v) => patch({ surface: v as Surface })}
        />
        {d.surface !== "flat" && (
          <>
            <Range
              label="Highlight"
              value={d.highlight}
              max={100}
              suffix="%"
              onChange={(highlight) => patch({ highlight })}
            />
            <Range
              label="Light angle"
              value={d.lightAngle}
              max={360}
              suffix="°"
              onChange={(lightAngle) => patch({ lightAngle })}
            />
            <p className="help-text">
              90° lights from the top, 180° from the left. Bevels, emboss,
              engrave, and soft shading all follow it.
            </p>
          </>
        )}
        <Range
          label="Depth"
          value={d.depth}
          max={16}
          onChange={(depth) => patch({ depth })}
        />
        <Range
          label="Shadow opacity"
          value={d.shadow}
          max={100}
          suffix="%"
          onChange={(shadow) => patch({ shadow })}
        />
        <Range
          label="Shadow blur"
          value={d.shadowBlur}
          max={40}
          onChange={(shadowBlur) => patch({ shadowBlur })}
        />
        <Range
          label="Shadow offset"
          value={d.shadowOffset}
          max={40}
          onChange={(shadowOffset) => patch({ shadowOffset })}
        />
        <Range
          label="Glow"
          value={d.glow}
          max={32}
          onChange={(glow) => patch({ glow })}
        />
      </section>
      {d.kind === "bar" && (
        <section className="property-section">
          <h3>Progress fill</h3>
          <Range
            label="Fill amount"
            value={d.progress}
            max={100}
            suffix="%"
            onChange={(progress) => patch({ progress })}
          />
          <div className="field-label mt-4">Fill color</div>
          <Color
            label="Fill color"
            value={d.accent ?? d.border}
            onChange={(accent) => patch({ accent })}
          />
          <p className="help-text">
            Export a 0% and a 100% bar, or mask the fill in Unity, for a bar
            that moves in game.
          </p>
        </section>
      )}
      <section className="property-section">
        <div className="section-heading">
          <h3>Text & icon</h3>
          <label className="heading-toggle" htmlFor="show-text">
            Show text
            <Switch
              id="show-text"
              checked={d.includeText}
              onCheckedChange={(includeText) => patch({ includeText })}
            />
          </label>
        </div>
        <div className={d.includeText ? undefined : "is-dimmed"}>
          <input
            className="text-input no-margin"
            aria-label="Label text"
            placeholder={d.kind === "window" ? "Window title" : "Label text"}
            value={d.text}
            maxLength={120}
            onChange={(e) => patch({ text: e.target.value })}
          />
          <div className="mt-3">
            <Choice
              label="Font family"
              value={d.font}
              options={[
                "Arial",
                "Verdana",
                "Georgia",
                "Trebuchet MS",
                "Courier New",
              ].map((v) => ({ value: v, label: v }))}
              onChange={(font) => patch({ font })}
            />
          </div>
          <Range
            label="Font size"
            value={d.fontSize}
            min={10}
            max={96}
            onChange={(fontSize) => patch({ fontSize })}
          />
          <div className="toggle-row">
            <label htmlFor="bold-label">Bold text</label>
            <Switch
              id="bold-label"
              checked={d.bold}
              onCheckedChange={(bold) => patch({ bold })}
            />
          </div>
          <Color
            label="Text color"
            value={d.textColor}
            onChange={(textColor) => patch({ textColor })}
          />
          <Range
            label="Outline"
            value={d.textOutline}
            max={8}
            step={0.5}
            onChange={(textOutline) => patch({ textOutline })}
          />
          {d.textOutline > 0 && (
            <div className="mt-3">
              <div className="field-label">Outline color</div>
              <Color
                label="Outline color"
                value={d.textOutlineColor}
                onChange={(textOutlineColor) => patch({ textOutlineColor })}
              />
            </div>
          )}
          <div className="toggle-row">
            <label htmlFor="text-shadow">Text shadow</label>
            <Switch
              id="text-shadow"
              checked={d.textShadow}
              onCheckedChange={(textShadow) => patch({ textShadow })}
            />
          </div>
        </div>
        {!d.includeText && (
          <p className="help-text">
            Text is hidden in previews and exports. The icon still shows.
          </p>
        )}
        <div className="mt-3">
          <Choice
            label="Icon"
            value={d.icon || "none"}
            options={[
              { value: "none", label: "No icon" },
              ...iconNames
                .filter((v) => v)
                .map((v) => ({
                  value: v,
                  label: v[0].toUpperCase() + v.slice(1),
                })),
            ]}
            onChange={(icon) =>
              patch({ icon: icon === "none" ? "" : icon, iconData: "" })
            }
          />
        </div>
        <div className="inline-actions">
          <button className="text-button" onClick={() => onImage("iconData")}>
            <Upload size={13} />
            {d.iconData ? "Replace icon" : "Upload icon"}
          </button>
          {d.iconData && (
            <button
              className="icon-button"
              aria-label="Remove uploaded icon"
              onClick={() => patch({ iconData: "" })}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </section>
    </>
  );
}
