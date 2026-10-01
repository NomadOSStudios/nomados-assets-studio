"use client";
import { useEffect, useState } from "react";
import { baseDesign, renderDesign, canvasBlob, padding } from "@/lib/studio";
import { initialProject, parseProject, defaultEffect } from "@/lib/project";
import { exportAssets, exportEffect } from "@/lib/exports";
import { renderEffect } from "@/lib/effects";
function entries(bytes: Uint8Array) {
  const view = new DataView(bytes.buffer);
  let p = 0;
  const result = new Map<string, Uint8Array>();
  while (view.getUint32(p, true) === 0x04034b50) {
    const size = view.getUint32(p + 18, true),
      n = view.getUint16(p + 26, true),
      extra = view.getUint16(p + 28, true),
      name = new TextDecoder().decode(bytes.slice(p + 30, p + 30 + n)),
      start = p + 30 + n + extra;
    result.set(name, bytes.slice(start, start + size));
    p = start + size;
  }
  return result;
}
export default function Verification() {
  const [report, setReport] = useState<string[]>([]),
    [url, setUrl] = useState("");
  useEffect(() => {
    let active = true;
    const lines: string[] = [];
    function check(name: string, condition: boolean) {
      if (!condition) throw new Error(name);
      lines.push("PASS " + name);
      if (active) setReport([...lines]);
    }
    async function run() {
      try {
        const d = baseDesign,
          p = padding(d),
          one = renderDesign(d),
          two = renderDesign(d, "normal", 2);
        check(
          "PNG dimensions include symmetric padding and depth",
          one.width === d.width + 2 * p &&
            one.height === d.height + 2 * p + d.depth,
        );
        check(
          "2× export doubles dimensions",
          two.width === one.width * 2 && two.height === one.height * 2,
        );
        const ctx = one.getContext("2d")!;
        check(
          "PNG exterior remains transparent",
          ctx.getImageData(0, 0, 1, 1).data[3] === 0,
        );
        check(
          "Button center is opaque",
          ctx.getImageData(p + d.width / 2, p + d.height / 2, 1, 1).data[3] ===
            255,
        );
        const normal = one.toDataURL();
        check(
          "Pressed state differs from default",
          renderDesign(d, "pressed").toDataURL() !== normal,
        );
        check(
          "Disabled state differs from default",
          renderDesign(d, "disabled").toDataURL() !== normal,
        );
        const zip = await exportAssets(
            initialProject.assets,
            1,
            true,
            "normal",
            false,
          ),
          files = entries(new Uint8Array(await zip.arrayBuffer()));
        check(
          "Kit ZIP includes 4 button states, 2 other assets, manifest and importer",
          files.size === 9,
        );
        const manifest = JSON.parse(
          new TextDecoder().decode(files.get("uim-manifest.json")),
        );
        check(
          "All sprite borders leave a resizable center",
          manifest.assets.every(
            (a: {
              left: number;
              right: number;
              width: number;
              top: number;
              bottom: number;
              height: number;
            }) => a.left + a.right < a.width && a.top + a.bottom < a.height,
          ),
        );
        const bitmap = await createImageBitmap(
          new Blob([files.get("01-primary-button-normal.png")! as BlobPart], {
            type: "image/png",
          }),
        );
        check(
          "PNG files inside ZIP decode at expected dimensions",
          bitmap.width === one.width && bitmap.height === one.height,
        );
        bitmap.close();
        if (active) setUrl(URL.createObjectURL(zip));
        const effect = { ...defaultEffect, type: "background" as const };
        check(
          "Background loop joins exactly",
          renderEffect(effect, 0).toDataURL() ===
            renderEffect(effect, effect.duration).toDataURL(),
        );
        check(
          "Confetti is deterministic",
          renderEffect(defaultEffect, 0.5).toDataURL() ===
            renderEffect(defaultEffect, 0.5).toDataURL(),
        );
        check(
          "Animation changes over time",
          renderEffect(effect, 0).toDataURL() !==
            renderEffect(effect, 0.5).toDataURL(),
        );
        const fx = entries(
            new Uint8Array(
              await (
                await exportEffect(defaultEffect, "sheet", () => {})
              ).arrayBuffer(),
            ),
          ),
          meta = JSON.parse(new TextDecoder().decode(fx.get("animation.json")));
        check(
          "Sprite sheets contain every frame exactly once",
          meta.frameCount === 48 &&
            meta.sheets.reduce(
              (n: number, s: { frameCount: number }) => n + s.frameCount,
              0,
            ) === 48,
        );
        for (const s of meta.sheets) {
          const b = await createImageBitmap(
            new Blob([fx.get(s.file)! as BlobPart], { type: "image/png" }),
          );
          check(
            "Sheet " + s.file + " stays within 2048 px",
            b.width <= 2048 && b.height <= 2048,
          );
          b.close();
        }
        check(
          "Editable project round-trip preserves assets",
          parseProject(JSON.parse(JSON.stringify(initialProject))).assets
            .length === 3,
        );
        let rejected = false;
        try {
          parseProject({
            ...initialProject,
            assets: [{ ...baseDesign, width: 999999 }],
          });
        } catch {
          rejected = true;
        }
        check("Invalid project dimensions are rejected", rejected);
        rejected = false;
        try {
          parseProject({ ...initialProject, assets: [baseDesign, baseDesign] });
        } catch {
          rejected = true;
        }
        check("Duplicate asset IDs are rejected", rejected);
        lines.push("ALL CHECKS PASSED");
        if (active) setReport([...lines]);
      } catch (e) {
        if (active) setReport([...lines, "FAIL " + String(e)]);
      }
    }
    run();
    return () => {
      active = false;
    };
  }, []);
  return (
    <main style={{ padding: 40, fontFamily: "monospace" }}>
      <h1>UIM verification</h1>
      <pre style={{ whiteSpace: "pre-wrap" }}>{report.join("\n")}</pre>
      {url && (
        <a href={url} download="uim-verified-kit.zip">
          Download verified kit
        </a>
      )}
    </main>
  );
}
