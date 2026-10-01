"use client";
import { Plus, Upload, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Range, Color, Choice, NumberField } from "./studio-controls";
import {
  iconNames,
  isButtonLike,
  isText,
  surfaces,
  systemFonts,
  type BorderPosition,
  type ButtonState,
  type Design,
  type GradientType,
  type Shape,
  type StateStyles,
  type Surface,
  type Tail,
  type TextAlign,
} from "@/lib/studio";
import type { ProjectFont } from "@/lib/fonts";

const stateLabel = (s: ButtonState) =>
  s === "normal" ? "Default" : s[0].toUpperCase() + s.slice(1);

export function DesignInspector({
  design: d,
  patch,
  onImage,
  state,
  fonts,
  onFontUpload,
  onFontRemove,
}: {
  design: Design;
  patch: (v: Partial<Design>) => void;
  onImage: (type: "texture" | "iconData") => void;
  state: ButtonState;
  fonts: ProjectFont[];
  onFontUpload: () => void;
  onFontRemove: (name: string) => void;
}) {
  // Titles and paragraphs have no shape, so only the text controls apply.
  const text = isText(d);
  // Kinds whose text colour drives a knob or check mark instead of a label.
  const noLabel = ["toggle", "checkbox", "slider", "healthbar"].includes(d.kind);
  const override =
    state !== "normal" && isButtonLike(d) ? d.stateStyles?.[state] : undefined;
  const setOverride = (value: Partial<NonNullable<typeof override>> | null) => {
    if (state === "normal") return;
    const next: StateStyles = { ...d.stateStyles };
    if (value === null) delete next[state];
    else next[state] = { ...next[state], ...value };
    patch({ stateStyles: next });
  };
  const gradientCss = () => {
    const stops = [
      `${d.fill} 0%`,
      ...[...d.stops]
        .sort((a, b) => a.at - b.at)
        .map((s) => `${s.color} ${s.at}%`),
      `${d.gradient ? d.fillEnd : d.fill} 100%`,
    ].join(",");
    return d.gradient && d.gradientType === "radial"
      ? `radial-gradient(circle, ${stops})`
      : `linear-gradient(${d.angle + 90}deg, ${stops})`;
  };
  const tabCount = Math.max(
    1,
    d.text.split("|").filter((t) => t.trim()).length || 3,
  );
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
            min={8}
            onChange={(width) => patch({ width })}
          />
          <NumberField
            label="Height"
            value={d.height}
            min={8}
            onChange={(height) => patch({ height })}
          />
        </div>
        {!text && (
          <>
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
          </>
        )}
      </section>
      {state !== "normal" && isButtonLike(d) && (
        <section className="property-section state-section">
          <div className="section-heading">
            <h3>{stateLabel(state)} state</h3>
            <label className="heading-toggle" htmlFor="state-override">
              Custom colors
              <Switch
                id="state-override"
                checked={!!override}
                onCheckedChange={(on) =>
                  on
                    ? setOverride({
                        fill: d.fill,
                        fillEnd: d.fillEnd,
                        border: d.border,
                        textColor: d.textColor,
                      })
                    : setOverride(null)
                }
              />
            </label>
          </div>
          {override ? (
            <>
              <div className="two-fields">
                <Color
                  label={`${stateLabel(state)} fill`}
                  value={override.fill ?? d.fill}
                  onChange={(fill) => setOverride({ fill })}
                />
                {d.gradient && (
                  <Color
                    label={`${stateLabel(state)} fill end`}
                    value={override.fillEnd ?? d.fillEnd}
                    onChange={(fillEnd) => setOverride({ fillEnd })}
                  />
                )}
              </div>
              <div className="two-fields mt-3">
                <Color
                  label={`${stateLabel(state)} border`}
                  value={override.border ?? d.border}
                  onChange={(border) => setOverride({ border })}
                />
                <Color
                  label={`${stateLabel(state)} text color`}
                  value={override.textColor ?? d.textColor}
                  onChange={(textColor) => setOverride({ textColor })}
                />
              </div>
              <p className="help-text">
                Only the {stateLabel(state).toLowerCase()} export uses these
                colors. Everything else still follows the default look.
              </p>
            </>
          ) : (
            <p className="help-text">
              Hover, pressed, and disabled are drawn automatically from the
              default look. Turn on custom colors to override this state.
            </p>
          )}
        </section>
      )}
      {!text && (
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
          <div className="gradient-preview" style={{ background: gradientCss() }} />
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
            <>
              <div className="mt-3">
                <div className="field-label">Gradient type</div>
                <Choice
                  label="Gradient type"
                  value={d.gradientType}
                  options={[
                    { value: "linear", label: "Linear" },
                    { value: "radial", label: "Radial · from the centre" },
                  ]}
                  onChange={(v) => patch({ gradientType: v as GradientType })}
                />
              </div>
              {d.gradientType === "linear" && (
                <Range
                  label="Gradient angle"
                  value={d.angle}
                  max={360}
                  suffix="°"
                  onChange={(angle) => patch({ angle })}
                />
              )}
              {d.stops.map((stop, i) => (
                <div key={i} className="stop-row">
                  <Color
                    label={`Color stop ${i + 1}`}
                    value={stop.color}
                    onChange={(color) =>
                      patch({
                        stops: d.stops.map((s, j) => (j === i ? { ...s, color } : s)),
                      })
                    }
                  />
                  <NumberField
                    label={`Color stop ${i + 1} position`}
                    displayLabel="At"
                    value={stop.at}
                    max={100}
                    suffix="%"
                    onChange={(at) =>
                      patch({
                        stops: d.stops.map((s, j) => (j === i ? { ...s, at } : s)),
                      })
                    }
                  />
                  <button
                    className="icon-button"
                    aria-label={`Remove color stop ${i + 1}`}
                    title="Remove stop"
                    onClick={() =>
                      patch({ stops: d.stops.filter((_, j) => j !== i) })
                    }
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              {d.stops.length < 4 && (
                <div className="inline-actions">
                  <button
                    className="text-button"
                    onClick={() =>
                      patch({
                        stops: [
                          ...d.stops,
                          {
                            at: Math.round(((d.stops.length + 1) * 100) / (d.stops.length + 2)),
                            color: d.fillEnd,
                          },
                        ],
                      })
                    }
                  >
                    <Plus size={13} /> Add color stop
                  </button>
                </div>
              )}
            </>
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
          {d.texture && (
            <>
              <Range
                label="Texture opacity"
                value={d.textureOpacity}
                max={100}
                suffix="%"
                onChange={(textureOpacity) => patch({ textureOpacity })}
              />
              <Range
                label="Texture scale"
                value={d.textureScale}
                min={10}
                max={400}
                suffix="%"
                onChange={(textureScale) => patch({ textureScale })}
              />
              <div className="toggle-row">
                <label htmlFor="texture-repeat">Tile texture</label>
                <Switch
                  id="texture-repeat"
                  checked={d.textureRepeat}
                  onCheckedChange={(textureRepeat) => patch({ textureRepeat })}
                />
              </div>
            </>
          )}
          <Range
            label="Grain"
            value={d.grain}
            max={100}
            suffix="%"
            onChange={(grain) => patch({ grain })}
          />
        </section>
      )}
      {!text && (
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
            {d.kind === "frame"
              ? "A frame is only its border, so the stroke is the whole shape."
              : d.borderPosition === "outside"
                ? "Extends beyond the shape without covering its fill."
                : d.borderPosition === "center"
                  ? "Half the border sits inside the shape, half outside."
                  : "Drawn within the shape's width and height."}
          </p>
        </section>
      )}
      {!text && (
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
          {d.shadow > 0 && (
            <div className="mt-3">
              <div className="field-label">Shadow color</div>
              <Color
                label="Shadow color"
                value={d.shadowColor}
                onChange={(shadowColor) => patch({ shadowColor })}
              />
            </div>
          )}
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
          {d.glow > 0 && (
            <div className="mt-3">
              <div className="field-label">Glow color</div>
              <Color
                label="Glow color"
                value={d.glowColor ?? d.border}
                onChange={(glowColor) => patch({ glowColor })}
              />
            </div>
          )}
        </section>
      )}
      {(d.kind === "bar" || d.kind === "slider" || d.kind === "healthbar") && (
        <section className="property-section">
          <h3>
            {d.kind === "slider"
              ? "Slider"
              : d.kind === "healthbar"
                ? "Health bar"
                : "Progress fill"}
          </h3>
          <Range
            label={d.kind === "slider" ? "Knob position" : "Fill amount"}
            value={d.progress}
            max={100}
            suffix="%"
            onChange={(progress) => patch({ progress })}
          />
          {d.kind === "healthbar" && (
            <Range
              label="Segments"
              value={d.segments}
              min={2}
              max={40}
              suffix=""
              onChange={(segments) => patch({ segments: Math.round(segments) })}
            />
          )}
          <div className="two-fields mt-4">
            <div>
              <div className="field-label">Fill color</div>
              <Color
                label="Fill color"
                value={d.accent ?? d.border}
                onChange={(accent) => patch({ accent })}
              />
            </div>
            {d.kind === "slider" && (
              <div>
                <div className="field-label">Knob color</div>
                <Color
                  label="Knob color"
                  value={d.textColor}
                  onChange={(textColor) => patch({ textColor })}
                />
              </div>
            )}
          </div>
          <p className="help-text">
            {d.kind === "healthbar"
              ? "Export a full and an empty bar, or hide segments in Unity, to animate health."
              : "Export a 0% and a 100% version, or mask the fill in Unity, for a bar that moves in game."}
          </p>
        </section>
      )}
      {(d.kind === "toggle" || d.kind === "checkbox") && (
        <section className="property-section">
          <h3>{d.kind === "toggle" ? "Toggle" : "Checkbox"}</h3>
          <div className="toggle-row">
            <label htmlFor="kind-on">{d.kind === "toggle" ? "On" : "Checked"}</label>
            <Switch
              id="kind-on"
              checked={d.on}
              onCheckedChange={(on) => patch({ on })}
            />
          </div>
          <div className="field-label">
            {d.kind === "toggle" ? "Knob color" : "Check color"}
          </div>
          <Color
            label={d.kind === "toggle" ? "Knob color" : "Check color"}
            value={d.textColor}
            onChange={(textColor) => patch({ textColor })}
          />
          <p className="help-text">
            Export both states and swap the sprite in Unity when the value
            changes.
          </p>
        </section>
      )}
      {d.kind === "tabs" && (
        <section className="property-section">
          <h3>Tabs</h3>
          <NumberField
            label="Active tab"
            displayLabel="Active"
            value={Math.min(d.activeTab, tabCount - 1)}
            max={tabCount - 1}
            suffix=""
            onChange={(activeTab) => patch({ activeTab: Math.round(activeTab) })}
          />
          <div className="field-label mt-4">Highlight color</div>
          <Color
            label="Active tab color"
            value={d.accent ?? d.border}
            onChange={(accent) => patch({ accent })}
          />
          <p className="help-text">
            Separate tab labels with a vertical bar in the text field, for
            example Items | Skills | Map. Export once per active tab.
          </p>
        </section>
      )}
      {d.kind === "bubble" && (
        <section className="property-section">
          <h3>Speech bubble</h3>
          <div className="field-label">Tail</div>
          <Choice
            label="Tail direction"
            value={d.tail}
            options={[
              { value: "bottom", label: "Bottom" },
              { value: "top", label: "Top" },
              { value: "left", label: "Left" },
              { value: "right", label: "Right" },
            ]}
            onChange={(v) => patch({ tail: v as Tail })}
          />
          <p className="help-text">
            The tail reaches into the transparent padding, outside the body
            used for 9-slice borders.
          </p>
        </section>
      )}
      {!noLabel && (
        <section className="property-section">
          <div className="section-heading">
            <h3>{text ? "Text" : "Text & icon"}</h3>
            {!text && (
              <label className="heading-toggle" htmlFor="show-text">
                Show text
                <Switch
                  id="show-text"
                  checked={d.includeText}
                  onCheckedChange={(includeText) => patch({ includeText })}
                />
              </label>
            )}
          </div>
          <div className={d.includeText || text ? undefined : "is-dimmed"}>
            {d.kind === "paragraph" ? (
              <textarea
                className="text-input no-margin"
                aria-label="Paragraph text"
                placeholder="Paragraph text"
                rows={4}
                value={d.text}
                maxLength={600}
                onChange={(e) => patch({ text: e.target.value })}
              />
            ) : (
              <input
                className="text-input no-margin"
                aria-label="Label text"
                placeholder={
                  d.kind === "window"
                    ? "Window title"
                    : d.kind === "title"
                      ? "Title text"
                      : d.kind === "tabs"
                        ? "Items | Skills | Map"
                        : "Label text"
                }
                value={d.text}
                maxLength={120}
                onChange={(e) => patch({ text: e.target.value })}
              />
            )}
            <div className="mt-3">
              <div className="field-label">Font family</div>
              <Choice
                label="Font family"
                value={
                  systemFonts.includes(d.font) || fonts.some((f) => f.name === d.font)
                    ? d.font
                    : "Arial"
                }
                options={[
                  ...systemFonts.map((v) => ({ value: v, label: v })),
                  ...fonts.map((f) => ({
                    value: f.name,
                    label: `${f.name} · project font`,
                  })),
                ]}
                onChange={(font) => patch({ font })}
              />
            </div>
            <div className="inline-actions">
              <button className="text-button" onClick={onFontUpload}>
                <Upload size={13} /> Upload font (TTF, OTF, WOFF)
              </button>
            </div>
            {fonts.length > 0 && (
              <ul className="font-list">
                {fonts.map((f) => (
                  <li key={f.name}>
                    <span style={{ fontFamily: `"${f.name}", sans-serif` }}>
                      {f.name}
                    </span>
                    <button
                      className="icon-button"
                      aria-label={`Remove font ${f.name}`}
                      title="Remove font from project"
                      onClick={() => onFontRemove(f.name)}
                    >
                      <X size={13} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <Range
              label="Font size"
              value={d.fontSize}
              min={10}
              max={96}
              onChange={(fontSize) => patch({ fontSize })}
            />
            {text && (
              <>
                <div className="mt-3">
                  <div className="field-label">Alignment</div>
                  <Choice
                    label="Text alignment"
                    value={d.textAlign}
                    options={[
                      { value: "left", label: "Left" },
                      { value: "center", label: "Center" },
                      { value: "right", label: "Right" },
                    ]}
                    onChange={(v) => patch({ textAlign: v as TextAlign })}
                  />
                </div>
                <Range
                  label="Line height"
                  value={d.lineHeight}
                  min={1}
                  max={2.5}
                  step={0.05}
                  suffix="×"
                  onChange={(lineHeight) => patch({ lineHeight })}
                />
                <p className="help-text">
                  Text wraps inside the box. Titles sit in the middle; paragraphs
                  flow from the top.
                </p>
              </>
            )}
            <div className="toggle-row">
              <label htmlFor="bold-label">Bold text</label>
              <Switch
                id="bold-label"
                checked={d.bold}
                onCheckedChange={(bold) => patch({ bold })}
              />
            </div>
            <div className="toggle-row">
              <label htmlFor="uppercase-label">Uppercase</label>
              <Switch
                id="uppercase-label"
                checked={d.uppercase}
                onCheckedChange={(uppercase) => patch({ uppercase })}
              />
            </div>
            <Range
              label="Letter spacing"
              value={d.letterSpacing}
              min={-4}
              max={24}
              step={0.5}
              onChange={(letterSpacing) => patch({ letterSpacing })}
            />
            <div className="mt-3">
              <div className="field-label">Text color</div>
              <Color
                label="Text color"
                value={d.textColor}
                onChange={(textColor) => patch({ textColor })}
              />
            </div>
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
          {!text && !d.includeText && (
            <p className="help-text">
              Text is hidden in previews and exports. The icon still shows.
            </p>
          )}
          {!text && d.kind !== "tabs" && (
            <>
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
            </>
          )}
        </section>
      )}
      <section className="property-section">
        <div className="section-heading">
          <h3>Rendering</h3>
          <label className="heading-toggle" htmlFor="pixel-art">
            Pixel art
            <Switch
              id="pixel-art"
              checked={d.pixelSize >= 2}
              onCheckedChange={(on) => patch({ pixelSize: on ? 3 : 0 })}
            />
          </label>
        </div>
        {d.pixelSize >= 2 ? (
          <>
            <Range
              label="Pixel size"
              value={d.pixelSize}
              min={2}
              max={8}
              onChange={(pixelSize) => patch({ pixelSize: Math.round(pixelSize) })}
            />
            <p className="help-text">
              Rendered at 1/{d.pixelSize} size and scaled up without
              smoothing, so edges and text turn into chunky pixels.
            </p>
          </>
        ) : (
          <p className="help-text">
            Smooth, anti-aliased rendering. Turn on pixel art for a retro look.
          </p>
        )}
      </section>
    </>
  );
}
