"use client";
import { useEffect, useId, useRef, useState } from "react";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  drawDesign,
  padding,
  loadImages,
  type Design,
  type ButtonState,
} from "@/lib/studio";
export function AssetCanvas({
  design,
  state = "normal",
}: {
  design: Design;
  state?: ButtonState;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let active = true;
    const paint = () => {
      const c = ref.current;
      if (!c || !active) return;
      const p = padding(design);
      c.width = (design.width + p * 2) * 2;
      c.height = (design.height + p * 2 + design.depth) * 2;
      const ctx = c.getContext("2d")!;
      ctx.scale(2, 2);
      drawDesign(ctx, design, state);
    };
    paint();
    if (design.texture || design.iconData)
      loadImages(design)
        .then(paint)
        .catch(() => {});
    return () => {
      active = false;
    };
  }, [design, state]);
  return <canvas ref={ref} aria-label={`${design.name}, ${state} state`} />;
}
function NumericInput({
  id,
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
}: {
  id?: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
}) {
  // Keep partial input intact while typing, including on a moving playhead.
  const [draft, setDraft] = useState<string | null>(null);
  const cancelCommit = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const field = inputRef.current?.parentElement;
    if (!field) return;
    let wheelValue = value;
    function adjust(event: WheelEvent) {
      // Preserve pinch zoom and horizontal scrolling. A non-passive listener
      // prevents the inspector and the native number input scrolling together.
      if (
        event.ctrlKey ||
        !event.deltaY ||
        Math.abs(event.deltaX) > Math.abs(event.deltaY)
      )
        return;
      event.preventDefault();
      event.stopPropagation();
      const amount = step * (event.shiftKey ? 10 : 1);
      const next = Math.min(
        max,
        Math.max(
          min,
          Number((wheelValue + (event.deltaY < 0 ? amount : -amount)).toFixed(6)),
        ),
      );
      setDraft(null);
      if (next !== wheelValue) {
        wheelValue = next;
        onChange(next);
      }
    }
    field.addEventListener("wheel", adjust, { passive: false });
    return () => field.removeEventListener("wheel", adjust);
  }, [value, min, max, step, onChange]);
  return (
    <input
      ref={inputRef}
      id={id}
      type="number"
      aria-label={label}
      title="Scroll to adjust · Shift for larger steps · Type an exact value"
      value={draft ?? String(value)}
      min={min}
      max={max}
      step={step}
      onChange={(e) => {
        const text = e.target.value;
        setDraft(text);
        const n = Number(text);
        if (text.trim() && Number.isFinite(n) && n >= min && n <= max)
          onChange(n);
      }}
      onBlur={() => {
        if (!cancelCommit.current && draft !== null && draft.trim()) {
          const n = Number(draft);
          if (Number.isFinite(n)) {
            const next = Math.min(max, Math.max(min, n));
            if (next !== value) onChange(next);
          }
        }
        cancelCommit.current = false;
        setDraft(null);
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape" || e.key === "Enter") {
          e.preventDefault();
          cancelCommit.current = e.key === "Escape";
          e.currentTarget.blur();
        }
      }}
    />
  );
}
export function Range({
  label,
  value,
  onChange,
  max = 64,
  min = 0,
  suffix = "px",
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  max?: number;
  min?: number;
  suffix?: string;
  step?: number;
}) {
  const id = useId();
  return (
    <div className="range-control">
      <div className="field-label">
        <label htmlFor={id}>{label}</label>
        <div className="range-value">
          <NumericInput
            id={id}
            label={label}
            value={value}
            min={min}
            max={max}
            step={step}
            onChange={onChange}
          />
          {suffix && <small>{suffix}</small>}
        </div>
      </div>
      <Slider
        className="numeric-slider"
        aria-label={label}
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(v) => onChange(v[0])}
      />
    </div>
  );
}
export function Color({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const cancelCommit = useRef(false);
  function normalize(text: string, allowShort = false) {
    const hex = text.trim().replace(/^#/, "");
    if (/^[\da-f]{6}$/i.test(hex)) return `#${hex.toLowerCase()}`;
    if (allowShort && /^[\da-f]{3}$/i.test(hex))
      return `#${hex
        .split("")
        .map((char) => char + char)
        .join("")
        .toLowerCase()}`;
    return null;
  }
  return (
    <div className="color-field">
      <input
        type="color"
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <input
        type="text"
        aria-label={`${label} hex`}
        value={draft ?? value.toUpperCase()}
        spellCheck={false}
        autoComplete="off"
        maxLength={9}
        onChange={(e) => {
          setDraft(e.target.value);
          const next = normalize(e.target.value);
          if (next && next !== value) onChange(next);
        }}
        onBlur={() => {
          if (!cancelCommit.current && draft !== null) {
            const next = normalize(draft, true);
            if (next && next !== value) onChange(next);
          }
          cancelCommit.current = false;
          setDraft(null);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape" || e.key === "Enter") {
            e.preventDefault();
            cancelCommit.current = e.key === "Escape";
            e.currentTarget.blur();
          }
        }}
      />
    </div>
  );
}
export function Choice({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="choice" aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
export function NumberField({
  label,
  displayLabel,
  value,
  onChange,
  min = 0,
  max = 1024,
  step = 1,
}: {
  label: string;
  displayLabel?: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <div className="number-control">
      <label className="number-field">
        <span>
          {displayLabel ??
            (label === "Width" ? "W" : label === "Height" ? "H" : label)}
        </span>
        <NumericInput
          label={label}
          value={value}
          onChange={onChange}
          min={min}
          max={max}
          step={step}
        />
        <small>px</small>
      </label>
      <Slider
        className="numeric-slider"
        aria-label={label}
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(v) => onChange(v[0])}
      />
    </div>
  );
}
