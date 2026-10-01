"use client";
import { useEffect, useState } from "react";
import {
  defaultScreen,
  defaultView,
  renderScreen,
  fitScreenAsset,
  type Screen,
} from "@/lib/screen";
import { initialProject, parseProject } from "@/lib/project";
import { baseDesign, canvasBlob } from "@/lib/studio";
import { ScreenInspector } from "@/components/screen-inspector";
import { ScenePreview } from "@/components/scene-preview";

export default function ScreenVerification() {
  const [screen, setScreen] = useState<Screen>({
    ...defaultScreen,
    id: "screen-1",
    placements: {},
  });
  const [report, setReport] = useState<string[]>([]);
  useEffect(() => {
    let active = true;
    const lines: string[] = [];
    function check(name: string, condition: boolean) {
      if (!condition) throw new Error(name);
      lines.push(`PASS ${name}`);
      if (active) setReport([...lines]);
    }
    const pixel = (c: HTMLCanvasElement, x: number, y: number) =>
      Array.from(c.getContext("2d")!.getImageData(x, y, 1, 1).data).join(",");
    async function verify() {
      try {
        // A version-one file: no screens list, positions on the assets.
        const { screens: _screens, activeScreen: _active, ...legacy } =
          initialProject;
        void _screens;
        void _active;
        const migrated = parseProject(legacy);
        check(
          "Old projects retain their original 960 × 640 canvas",
          migrated.screens[0].width === 960 &&
            migrated.screens[0].height === 640 &&
            migrated.screens[0].color === "#10151d",
        );
        check(
          "Old projects preserve existing asset positions",
          migrated.assets[0].x === initialProject.assets[0].x,
        );
        const expanded = parseProject({
          ...legacy,
          screen: {
            ...defaultScreen,
            width: 1920,
            height: 1080,
            background: "gradient",
          },
          assets: [{ ...baseDesign, x: 1500, y: 800 }],
        });
        const restored = parseProject(JSON.parse(JSON.stringify(expanded)));
        check(
          "Screen settings and positions beyond the old canvas survive save/open",
          restored.screens[0].width === 1920 &&
            restored.screens[0].background === "gradient" &&
            restored.assets[0].x === 1500,
        );
        let rejected = false;
        try {
          parseProject({
            ...legacy,
            screen: { ...defaultScreen, width: 4097 },
          });
        } catch {
          rejected = true;
        }
        check("Oversized screens are rejected", rejected);
        const solid = await renderScreen(
          { ...defaultScreen, width: 320, height: 180, color: "#224466" },
          [],
        );
        check(
          "Export uses the chosen screen dimensions without padding",
          solid.width === 320 && solid.height === 180,
        );
        check(
          "Solid background fills the exported PNG",
          pixel(solid, 0, 0) === "34,68,102,255",
        );
        const transparent = await renderScreen(
          {
            ...defaultScreen,
            width: 128,
            height: 128,
            background: "transparent",
          },
          [],
        );
        check(
          "Transparent backgrounds export alpha without checkerboard",
          pixel(transparent, 0, 0) === "0,0,0,0",
        );
        const gradient = await renderScreen(
          {
            ...defaultScreen,
            width: 128,
            height: 128,
            background: "gradient",
            color: "#ff0000",
            colorEnd: "#0000ff",
            angle: 90,
          },
          [],
        );
        check(
          "Gradient background changes across the screen",
          pixel(gradient, 64, 2) !== pixel(gradient, 64, 126),
        );
        const source = document.createElement("canvas");
        source.width = 200;
        source.height = 100;
        const ctx = source.getContext("2d")!;
        ctx.fillStyle = "#ff0000";
        ctx.fillRect(0, 0, 200, 100);
        const imageScreen = {
          ...defaultScreen,
          width: 128,
          height: 128,
          background: "image" as const,
          color: "#00ff00",
          image: source.toDataURL(),
        };
        const contain = await renderScreen(
          { ...imageScreen, imageFit: "contain" },
          [],
        );
        check(
          "Image fit preserves the base color in letterboxed areas",
          pixel(contain, 64, 0) === "0,255,0,255" &&
            pixel(contain, 64, 64) === "255,0,0,255",
        );
        const cover = await renderScreen(
          { ...imageScreen, imageFit: "cover" },
          [],
        );
        check(
          "Image fill covers the entire screen",
          pixel(cover, 0, 0) === "255,0,0,255",
        );
        const large = await renderScreen(
          { ...defaultScreen, width: 1920, height: 1080 },
          [{ ...baseDesign, x: 1500, y: 800 }],
        );
        check(
          "Assets render past the former 960 × 640 boundary",
          pixel(large, 1510, 840) !== pixel(large, 0, 0),
        );
        const blob = await canvasBlob(large);
        const bitmap = await createImageBitmap(blob);
        check(
          "Encoded screen PNG decodes at exact output size",
          bitmap.width === 1920 && bitmap.height === 1080,
        );
        bitmap.close();
        const position = fitScreenAsset(
          baseDesign,
          { ...defaultScreen, width: 1280, height: 720 },
          5000,
          5000,
        );
        check(
          "Drag limits use the selected screen size and asset bounds",
          position.x === 1280 - baseDesign.width &&
            position.y === 720 - baseDesign.height,
        );
        lines.push("ALL SCREEN CHECKS PASSED");
        if (active) setReport([...lines]);
      } catch (error) {
        if (active) setReport([...lines, `FAIL ${String(error)}`]);
      }
    }
    void verify();
    return () => {
      active = false;
    };
  }, []);
  return (
    <main style={{ padding: 20 }}>
      <h1>Screen verification (isolated test project)</h1>
      <pre>{report.join("\n")}</pre>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 300px",
          minHeight: 640,
        }}
      >
        <div className="design-stage" style={{ minHeight: 600 }}>
          <ScenePreview
            screen={screen}
            assets={initialProject.assets}
            selection={[]}
            zoom="fit"
            view={defaultView}
            onSelect={() => {}}
            onMove={() => {}}
            onResize={() => {}}
            onDuplicate={() => null}
          />
        </div>
        <ScreenInspector
          screen={screen}
          screens={[screen]}
          onSelectScreen={() => {}}
          onAddScreen={() => {}}
          onDuplicateScreen={() => {}}
          onDeleteScreen={() => {}}
          onChange={(v) => setScreen((s) => ({ ...s, ...v }))}
          onImage={() => {}}
          onExport={() => {}}
          onExportAll={() => {}}
          busy={false}
          view={defaultView}
          onView={() => {}}
        />
      </div>
    </main>
  );
}
