"use client";
import { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw, Shuffle, Download } from "lucide-react";
import { Range, Color, Choice, NumberField } from "./studio-controls";
import { drawEffect } from "@/lib/effects";
import type { Effect } from "@/lib/project";
export type EffectFormat = "sheet" | "sequence";
export function EffectWorkspace({
  effect: e,
  onChange,
  format,
  onFormat,
  progress,
  onExport,
}: {
  effect: Effect;
  onChange: (v: Partial<Effect>) => void;
  format: EffectFormat;
  onFormat: (v: EffectFormat) => void;
  progress: number | null;
  onExport: () => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null),
    [playing, setPlaying] = useState(true),
    [time, setTime] = useState(0),
    timeRef = useRef(0);
  useEffect(() => {
    timeRef.current = Math.min(timeRef.current, e.duration);
    setTime(timeRef.current);
  }, [e.duration]);
  useEffect(() => {
    let frame = 0,
      last = performance.now();
    function tick(now: number) {
      if (playing) {
        timeRef.current = (timeRef.current + (now - last) / 1000) % e.duration;
        setTime(timeRef.current);
      }
      last = now;
      const c = ref.current;
      if (c) {
        if (c.width !== e.width || c.height !== e.height) {
          c.width = e.width;
          c.height = e.height;
        }
        drawEffect(c.getContext("2d")!, e, timeRef.current);
      }
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [e, playing]);
  return (
    <>
      <section className="workspace effect-workspace">
        <div className="workspace-toolbar">
          <div className="breadcrumbs">
            Effects <span>/</span>
            <strong>
              {e.type === "confetti"
                ? "Confetti burst"
                : e.type === "sparkles"
                  ? "Sparkles"
                  : "Floating background"}
            </strong>
          </div>
          <span className="subtle-badge">
            {e.type === "confetti" ? "One-shot" : "Seamless loop"}
          </span>
        </div>
        <div className="design-stage checker">
          <div className="canvas-label">
            <span className="small-label">ANIMATION</span>
            <span>
              {e.width} × {e.height} px
            </span>
          </div>
          <canvas
            className="effect-canvas"
            ref={ref}
            aria-label={`${e.type} animation preview`}
            style={{ aspectRatio: `${e.width}/${e.height}` }}
          />
        </div>
        <div className="timeline">
          <div className="timeline-toolbar">
            <button
              className="icon-button"
              aria-label={playing ? "Pause animation" : "Play animation"}
              title={playing ? "Pause" : "Play"}
              onClick={() => setPlaying(!playing)}
            >
              {playing ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <button
              className="icon-button"
              aria-label="Restart animation"
              title="Restart"
              onClick={() => {
                timeRef.current = 0;
                setTime(0);
                setPlaying(true);
              }}
            >
              <RotateCcw size={16} />
            </button>
            <span>
              {time.toFixed(2)}s{" "}
              <span className="muted">/ {e.duration.toFixed(1)}s</span>
            </span>
            <span className="subtle-badge">{e.fps} FPS</span>
          </div>
          <Range
            label="Playhead"
            value={Math.round(time * 100) / 100}
            max={e.duration}
            step={0.01}
            suffix="s"
            onChange={(v) => {
              timeRef.current = v;
              setTime(v);
              setPlaying(false);
            }}
          />
        </div>
        <footer className="workspace-footer">
          <span>Preview and export share exact frame timing</span>
          <span>{Math.round(e.fps * e.duration)} frames</span>
        </footer>
      </section>
      <aside className="inspector">
        <div className="inspector-heading">
          <h2>Effect settings</h2>
        </div>
        <div className="inspector-scroll">
          <section className="property-section">
            <Choice
              label="Effect type"
              value={e.type}
              options={[
                { value: "confetti", label: "Confetti burst" },
                { value: "sparkles", label: "Sparkles" },
                { value: "background", label: "Floating background" },
              ]}
              onChange={(v) => {
                onChange({ type: v as Effect["type"] });
                timeRef.current = 0;
              }}
            />
            <div className="two-fields mt-4">
              <NumberField
                label="Width"
                value={e.width}
                min={64}
                onChange={(width) => onChange({ width })}
              />
              <NumberField
                label="Height"
                value={e.height}
                min={64}
                onChange={(height) => onChange({ height })}
              />
            </div>
            <Range
              label="Duration"
              value={e.duration}
              min={1}
              max={5}
              step={0.5}
              suffix="s"
              onChange={(duration) => onChange({ duration })}
            />
            <div className="mt-4">
              <Choice
                label="Frame rate"
                value={String(e.fps)}
                options={[12, 24, 30].map((v) => ({
                  value: String(v),
                  label: `${v} frames / second`,
                }))}
                onChange={(v) => onChange({ fps: Number(v) as 12 | 24 | 30 })}
              />
            </div>
          </section>
          <section className="property-section">
            <h3>Appearance</h3>
            <div className="two-fields mt-4">
              <Color
                label="Primary effect color"
                value={e.color}
                onChange={(color) => onChange({ color })}
              />
              <Color
                label="Secondary effect color"
                value={e.secondary}
                onChange={(secondary) => onChange({ secondary })}
              />
            </div>
            <Range
              label="Amount"
              value={e.count}
              min={10}
              max={180}
              suffix=""
              onChange={(count) => onChange({ count })}
            />
            <Range
              label="Particle size"
              value={e.size}
              min={2}
              max={24}
              onChange={(size) => onChange({ size })}
            />
            <Range
              label="Movement"
              value={e.speed}
              min={0.2}
              max={3}
              step={0.1}
              suffix="×"
              onChange={(speed) => onChange({ speed })}
            />
            {e.type === "confetti" && (
              <>
                <Range
                  label="Spread"
                  value={e.spread}
                  min={20}
                  max={180}
                  suffix="°"
                  onChange={(spread) => onChange({ spread })}
                />
                <Range
                  label="Gravity"
                  value={e.gravity}
                  max={500}
                  suffix=""
                  onChange={(gravity) => onChange({ gravity })}
                />
              </>
            )}
            <button
              className="secondary-button full mt-4"
              onClick={() =>
                onChange({ seed: Math.floor(Math.random() * 9998) + 1 })
              }
            >
              <Shuffle size={15} /> New variation
            </button>
          </section>
          <section className="property-section">
            <h3>Export animation</h3>
            <div className="mt-4">
              <Choice
                label="Animation format"
                value={format}
                options={[
                  { value: "sheet", label: "PNG sprite sheets" },
                  { value: "sequence", label: "PNG frame sequence" },
                ]}
                onChange={(v) => onFormat(v as EffectFormat)}
              />
            </div>
            <p className="help-text">
              {Math.round(e.fps * e.duration)} frames · about{" "}
              {Math.round(
                (e.width * e.height * 4 * e.fps * e.duration) / 1048576,
              )}{" "}
              MB of raw texture memory. Sprite sheets are split at 2048 px.
            </p>
            <button
              className="primary-button full"
              disabled={progress !== null}
              onClick={onExport}
            >
              <Download size={16} />
              {progress === null
                ? "Export animation ZIP"
                : `Exporting ${progress}%`}
            </button>
            <p className="help-text">
              Includes frame timing and Unity import instructions.
            </p>
          </section>
        </div>
      </aside>
    </>
  );
}
