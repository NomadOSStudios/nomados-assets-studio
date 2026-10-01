"use client";
import { useEffect, useState } from "react";
import { AssetCanvas } from "@/components/studio-controls";
import { DesignInspector } from "@/components/design-inspector";
import {
  baseDesign,
  canvasBlob,
  padding,
  renderDesign,
  type Design,
} from "@/lib/studio";
import { initialProject, parseProject, styleValues } from "@/lib/project";
import { defaultScreen, renderScreen } from "@/lib/screen";

const fixture: Design = {
  ...baseDesign,
  width: 96,
  height: 64,
  radius: 0,
  fill: "#ff0000",
  gradient: false,
  border: "#0000ff",
  borderWidth: 12,
  surface: "flat",
  shadow: 0,
  shadowBlur: 0,
  shadowOffset: 0,
  depth: 0,
  glow: 0,
  includeText: false,
  icon: "",
};

export default function BorderVerification() {
  const [report, setReport] = useState<string[]>([]);
  const [design, setDesign] = useState<Design>({ ...fixture, radius: 14 });
  useEffect(() => {
    let active = true;
    const lines: string[] = [];
    function check(name: string, condition: boolean) {
      if (!condition) throw new Error(name);
      lines.push(`PASS ${name}`);
    }
    async function run() {
      try {
        for (const borderPosition of ["inside", "center", "outside"] as const) {
          const d = { ...fixture, borderPosition };
          const outset = borderPosition === "outside" ? 12 : borderPosition === "center" ? 6 : 0;
          for (const scale of [1, 2, 4]) {
            const canvas = renderDesign(d, "normal", scale);
            const p = padding(d);
            const ctx = canvas.getContext("2d")!;
            const pixel = (x: number, y = p + d.height / 2) => ctx.getImageData(x * scale, y * scale, 1, 1).data;
            check(`${borderPosition} at ${scale}× has the correct outer edge and clear padding`,
              pixel(p - outset - 1)[3] === 0 &&
              pixel(p - outset)[2] === 255 &&
              pixel(p + d.width + outset - 1)[2] === 255 &&
              pixel(p + d.width + outset)[3] === 0 &&
              pixel(p + d.width / 2, p - outset - 1)[3] === 0);
            check(`${borderPosition} at ${scale}× covers exactly the requested part of the fill`,
              pixel(p + 12 - outset - 1)[2] === 255 &&
              pixel(p + 12 - outset)[0] === 255);
            const bitmap = await createImageBitmap(await canvasBlob(canvas));
            check(`${borderPosition} at ${scale}× exports a valid, full-sized PNG`,
              bitmap.width === canvas.width && bitmap.height === canvas.height);
            bitmap.close();
          }
        }
        const rounded = renderDesign({ ...fixture, radius: 8 });
        const p = padding(fixture);
        check("Thick inside borders preserve rounded outer corners",
          rounded.getContext("2d")!.getImageData(p, p, 1, 1).data[3] === 0);
        const smallest = renderDesign({ ...fixture, width: 24, height: 24 });
        check("A border filling the smallest shape renders without an inverted inner path",
          smallest.getContext("2d")!.getImageData(p + 12, p + 12, 1, 1).data[2] === 255);
        check("Zero-width borders are identical in every position",
          renderDesign({ ...fixture, borderWidth: 0, borderPosition: "inside" }).toDataURL() ===
          renderDesign({ ...fixture, borderWidth: 0, borderPosition: "outside" }).toDataURL());
        const outside: Design = { ...fixture, borderPosition: "outside", x: 30, y: 30 };
        const screen = await renderScreen({ ...defaultScreen, width: 160, height: 120, background: "transparent" }, [outside]);
        const screenPixel = screen.getContext("2d")!.getImageData(18, 62, 1, 1).data;
        check("Screen export includes outside borders at the asset's unchanged position", screenPixel[2] === 255 && screenPixel[3] === 255);
        const legacyAsset: Partial<Design> = { ...baseDesign };
        delete legacyAsset.borderPosition;
        check("Existing projects default to inside borders",
          parseProject({ ...initialProject, assets: [legacyAsset] }).assets[0].borderPosition === "inside");
        const restored = parseProject(JSON.parse(JSON.stringify({ ...initialProject, assets: [outside], styles: [{ name: "Outside", label: "Saved style", values: styleValues(outside) }] })));
        check("Border placement survives project and saved-style round trips",
          restored.assets[0].borderPosition === "outside" && restored.styles[0].values.borderPosition === "outside");
        let rejected = false;
        try {
          parseProject({ ...initialProject, assets: [{ ...fixture, borderPosition: "invalid" }] });
        } catch {
          rejected = true;
        }
        check("Invalid border positions are rejected", rejected);
        lines.push("ALL CHECKS PASSED");
      } catch (e) {
        lines.push(`FAIL ${String(e)}`);
      }
      if (active) setReport(lines);
    }
    run();
    return () => { active = false; };
  }, []);
  return (
    <main style={{ display: "flex", alignItems: "flex-start", gap: 32, padding: 32 }}>
      <div>
        <h1>Border verification</h1>
        <pre>{report.join("\n")}</pre>
        <AssetCanvas design={design} />
        <output aria-label="Applied border position">{design.borderPosition}</output>
      </div>
      <aside style={{ width: 320 }}>
        <DesignInspector
          design={design}
          patch={(v) => setDesign((d) => ({ ...d, ...v }))}
          onImage={() => {}}
          state="normal"
          fonts={[]}
          onFontUpload={() => {}}
          onFontRemove={() => {}}
        />
      </aside>
    </main>
  );
}
