/** Project fonts: uploaded files kept in the project as data URLs. */
export type ProjectFont = { name: string; data: string };

const loaded = new Set<string>();

/** Registers project fonts with the document so canvas text can use them. */
export async function ensureFonts(fonts: ProjectFont[]) {
  await Promise.all(
    fonts.map(async (font) => {
      if (loaded.has(font.name)) return;
      try {
        const face = new FontFace(font.name, `url(${font.data})`);
        await face.load();
        document.fonts.add(face);
        loaded.add(font.name);
      } catch {
        // A broken font file falls back to the system family.
      }
    }),
  );
}

/** Reads a font file into a data URL with a MIME the schema accepts. */
export function readFontFile(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  const mime: Record<string, string> = {
    ttf: "font/ttf",
    otf: "font/otf",
    woff: "font/woff",
    woff2: "font/woff2",
  };
  if (!mime[extension]) throw new Error("Choose a TTF, OTF, WOFF, or WOFF2 file.");
  if (file.size > 4000000) throw new Error("Fonts must be smaller than 4 MB.");
  return new Promise<ProjectFont>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = String(reader.result).split(",")[1] ?? "";
      resolve({
        name: fontName(file.name),
        data: `data:${mime[extension]};base64,${base64}`,
      });
    };
    reader.onerror = () => reject(new Error("Could not read that font."));
    reader.readAsDataURL(file);
  });
}

/** A family name from a file name: "Press_Start-2P.ttf" → "Press Start 2P". */
export function fontName(fileName: string) {
  return (
    fileName
      .replace(/\.[^.]+$/, "")
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 60) || "Custom font"
  );
}
