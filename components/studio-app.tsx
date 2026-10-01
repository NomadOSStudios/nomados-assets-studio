"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { flushSync } from "react-dom";
import {
  Box,
  Layers2,
  Plus,
  Download,
  ChevronDown,
  MousePointer2,
  Check,
  SlidersHorizontal,
  Copy,
  PanelTop,
  Square,
  Palette,
  Undo2,
  Redo2,
  Save,
  FolderOpen,
  Trash2,
  Film,
  LayoutTemplate,
  PenTool,
  BookmarkPlus,
  AlertCircle,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { AssetCanvas, Choice, NumberField } from "./studio-controls";
import { DesignInspector } from "./design-inspector";
import { ExportOptions, type ExportSettings } from "./export-options";
import { EffectWorkspace } from "./effect-workspace";
import { ScenePreview } from "./scene-preview";
import { ScreenInspector } from "./screen-inspector";
import {
  defaultScreen,
  fitScreenAsset,
  renderScreen,
  type ScreenSettings,
} from "@/lib/screen";
import {
  type Design,
  type AssetKind,
  type ButtonState,
  baseDesign,
  presets,
  states,
  padding,
  loadImages,
  renderDesign,
  canvasBlob,
  download,
  slug,
} from "@/lib/studio";
import {
  initialProject,
  readProject,
  writeProject,
  parseProject,
  styleValues,
  designSchema,
  type Project,
  type Effect,
} from "@/lib/project";
import { exportAssets } from "@/lib/exports";

type History = { past: Project[]; present: Project; future: Project[] };
export default function Studio() {
  const [history, setHistory] = useState<History>({
    past: [],
    present: initialProject,
    future: [],
  });
  const project = history.present,
    assets = project.assets;
  const screen = project.screen ?? defaultScreen;
  const [selected, setSelected] = useState("play-button"),
    [state, setState] = useState<ButtonState>("normal"),
    [zoom, setZoom] = useState("100"),
    [background, setBackground] = useState("dark"),
    [mode, setMode] = useState("asset"),
    [inspector, setInspector] = useState("design"),
    [screenInspector, setScreenInspector] = useState("screen"),
    [screenZoom, setScreenZoom] = useState("fit");
  const [ready, setReady] = useState(false),
    [dirty, setDirty] = useState(false),
    [saveStatus, setSaveStatus] = useState("Opening project…");
  const [exportOpen, setExportOpen] = useState(false),
    [busy, setBusy] = useState(false),
    [exportSettings, setExportSettings] = useState<ExportSettings>({
      scope: "png",
      scale: 1,
      content: true,
    }),
    [guides, setGuides] = useState(false);
  const [styleOpen, setStyleOpen] = useState(false),
    [styleName, setStyleName] = useState(""),
    [renameOpen, setRenameOpen] = useState(false),
    [projectName, setProjectName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null),
    imageRef = useRef<HTMLInputElement>(null),
    imageTarget = useRef<{
      id: string;
      field: "texture" | "iconData" | "screen";
    } | null>(null),
    lastEdit = useRef(0),
    saveRevision = useRef(0),
    projectRef = useRef(project);
  projectRef.current = project;
  const d = assets.find((a) => a.id === selected) || assets[0];
  const change = useCallback((fn: (p: Project) => Project, group = true) => {
    const now = Date.now(),
      separate = !group || now - lastEdit.current > 450;
    lastEdit.current = now;
    setDirty(true);
    setSaveStatus("Saving…");
    setHistory((h) => ({
      past: separate ? [...h.past.slice(-49), h.present] : h.past,
      present: fn(h.present),
      future: [],
    }));
  }, []);
  const patch = (v: Partial<Design>) =>
    change((p) => ({
      ...p,
      assets: p.assets.map((a) => (a.id === d.id ? { ...a, ...v } : a)),
    }));
  const patchScreen = (update: Partial<ScreenSettings>) =>
    change((p) => ({
      ...p,
      screen: { ...(p.screen ?? defaultScreen), ...update },
    }));
  const undo = useCallback(() => {
    lastEdit.current = 0;
    setHistory((h) =>
      h.past.length
        ? {
            past: h.past.slice(0, -1),
            present: h.past[h.past.length - 1],
            future: [h.present, ...h.future],
          }
        : h,
    );
    setDirty(true);
  }, []);
  const redo = useCallback(() => {
    lastEdit.current = 0;
    setHistory((h) =>
      h.future.length
        ? {
            past: [...h.past, h.present],
            present: h.future[0],
            future: h.future.slice(1),
          }
        : h,
    );
    setDirty(true);
  }, []);
  useEffect(() => {
    let active = true;
    readProject()
      .then((p) => {
        if (!active) return;
        if (p) {
          setHistory({ past: [], present: p, future: [] });
          setSelected(p.assets[0].id);
        }
        setSaveStatus("Saved on this device");
      })
      .catch(() => {
        if (active) {
          setSaveStatus("Local save unavailable");
          toast.error(
            "Could not open the local save. You can still import a project file.",
          );
        }
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (!ready || !dirty) return;
    const revision = ++saveRevision.current;
    setSaveStatus("Saving…");
    const timer = setTimeout(() => {
      writeProject(project)
        .then(() => {
          if (revision === saveRevision.current)
            setSaveStatus("Saved on this device");
        })
        .catch(() => {
          if (revision === saveRevision.current) {
            setSaveStatus("Save failed · download backup");
            toast.error(
              "Local storage is unavailable or full. Save a project file to keep your work.",
            );
          }
        });
    }, 400);
    return () => clearTimeout(timer);
  }, [project, ready, dirty]);
  useEffect(() => {
    function key(e: KeyboardEvent) {
      if (
        !(e.metaKey || e.ctrlKey) ||
        e.key.toLowerCase() !== "z" ||
        (e.target instanceof HTMLElement &&
          ["INPUT", "TEXTAREA"].includes(e.target.tagName))
      )
        return;
      e.preventDefault();
      e.shiftKey ? redo() : undo();
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [undo, redo]);
  useEffect(() => {
    const context = (
      document as Document & {
        modelContext?: {
          registerTool: (
            tool: unknown,
            options: { signal: AbortSignal },
          ) => void | Promise<void>;
        };
      }
    ).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const register = (tool: unknown) => {
      try {
        Promise.resolve(
          context.registerTool(tool, { signal: lifecycle.signal }),
        ).catch(() => {});
      } catch {}
    };
    register({
      name: "get_ui_project",
      title: "Read UI project",
      description:
        "Read the current UI asset designs and animation settings. Image bytes are omitted.",
      inputSchema: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      execute: () => ({
        name: projectRef.current.name,
        assets: projectRef.current.assets.map(
          ({ texture, iconData, ...a }) => ({
            ...a,
            hasTexture: !!texture,
            hasUploadedIcon: !!iconData,
          }),
        ),
        effect: projectRef.current.effect,
        screen: {
          ...(projectRef.current.screen ?? defaultScreen),
          image: undefined,
          hasImage: !!projectRef.current.screen?.image,
        },
      }),
    });
    register({
      name: "update_ui_assets",
      title: "Update UI assets",
      description:
        "Update existing assets by ID using the same editable design controls as the UI. Changes are saved locally and can be undone.",
      inputSchema: {
        type: "object",
        properties: {
          updates: {
            type: "array",
            minItems: 1,
            maxItems: 50,
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                changes: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    width: { type: "number", minimum: 24, maximum: 1024 },
                    height: { type: "number", minimum: 24, maximum: 1024 },
                    radius: { type: "number", minimum: 0, maximum: 512 },
                    fill: { type: "string", pattern: "^#[0-9a-fA-F]{6}$" },
                    fillEnd: { type: "string", pattern: "^#[0-9a-fA-F]{6}$" },
                    border: { type: "string", pattern: "^#[0-9a-fA-F]{6}$" },
                    borderWidth: { type: "number", minimum: 0, maximum: 12 },
                    borderPosition: {
                      type: "string",
                      enum: ["inside", "center", "outside"],
                    },
                    text: { type: "string" },
                    surface: {
                      type: "string",
                      enum: ["raised", "flat", "embossed", "engraved"],
                    },
                  },
                  additionalProperties: false,
                },
              },
              required: ["id", "changes"],
              additionalProperties: false,
            },
          },
        },
        required: ["updates"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: (input: unknown) => {
        const v = input as {
          updates?: { id: string; changes: Partial<Design> }[];
        };
        if (
          !v ||
          !Array.isArray(v.updates) ||
          !v.updates.length ||
          v.updates.length > 50
        )
          throw new Error("Provide 1–50 updates.");
        const allowed = [
          "name",
          "width",
          "height",
          "radius",
          "fill",
          "fillEnd",
          "border",
          "borderWidth",
          "borderPosition",
          "text",
          "surface",
        ];
        const changes = new Map<string, Design>();
        for (const u of v.updates) {
          const asset = projectRef.current.assets.find((a) => a.id === u.id);
          if (!asset) throw new Error("Unknown asset ID.");
          if (
            !u.changes ||
            Object.keys(u.changes).some((k) => !allowed.includes(k))
          )
            throw new Error("Unsupported property.");
          changes.set(u.id, designSchema.parse({ ...asset, ...u.changes }));
        }
        flushSync(() =>
          change(
            (p) => ({
              ...p,
              assets: p.assets.map((a) => changes.get(a.id) || a),
            }),
            false,
          ),
        );
        return { updated: [...changes.keys()] };
      },
    });
    return () => lifecycle.abort();
  }, [change]);
  function addAsset(kind: AssetKind) {
    if (assets.length >= 50) {
      toast.error("This project can contain up to 50 assets.");
      return;
    }
    const id = crypto.randomUUID();
    const defaults =
      kind === "panel"
        ? { width: 360, height: 240, text: "", icon: "" }
        : kind === "slot"
          ? { width: 100, height: 100, text: "", icon: "star" }
          : kind === "bar"
            ? { width: 280, height: 32, text: "", icon: "", radius: 16 }
            : { width: 288, height: 76, text: "PLAY GAME", icon: "play" };
    change(
      (p) => ({
        ...p,
        assets: [
          ...p.assets,
          {
            ...baseDesign,
            ...styleValues(d),
            ...defaults,
            id,
            name: kind === "bar" ? "Progress bar" : `New ${kind}`,
            kind,
            x: Math.max(0, Math.round((screen.width - defaults.width) / 2)),
            y: Math.max(0, Math.round((screen.height - defaults.height) / 2)),
          },
        ],
      }),
      false,
    );
    setSelected(id);
    if (mode !== "scene") setMode("asset");
    else setScreenInspector("asset");
  }
  function duplicate() {
    if (assets.length >= 50) {
      toast.error("This project can contain up to 50 assets.");
      return;
    }
    const id = crypto.randomUUID();
    change(
      (p) => ({
        ...p,
        assets: [
          ...p.assets,
          {
            ...d,
            id,
            name: `${d.name.slice(0, 70)} copy`,
            ...fitScreenAsset(d, screen, (d.x || 0) + 20, (d.y || 0) + 20),
          },
        ],
      }),
      false,
    );
    setSelected(id);
  }
  function remove() {
    if (assets.length === 1) {
      toast.info("Keep at least one asset in the project.");
      return;
    }
    change(
      (p) => ({ ...p, assets: p.assets.filter((a) => a.id !== d.id) }),
      false,
    );
    setSelected(assets.find((a) => a.id !== d.id)!.id);
    toast("Asset removed", { action: { label: "Undo", onClick: undo } });
  }
  function saveFile() {
    download(
      new Blob([JSON.stringify(project, null, 2)], {
        type: "application/json",
      }),
      `${slug(project.name)}.uim.json`,
    );
    toast.success("Editable project file downloaded");
  }
  async function importProject(file: File | undefined) {
    if (!file) return;
    try {
      if (file.size > 24000000)
        throw new Error("Project must be smaller than 24 MB.");
      const parsed = parseProject(JSON.parse(await file.text()));
      change(() => parsed, false);
      setSelected(parsed.assets[0].id);
      toast.success("Project opened. Undo restores your previous project.");
    } catch (e) {
      toast.error(
        e instanceof Error && e.message.includes("24 MB")
          ? e.message
          : "This is not a valid UIM project file. Your current project is unchanged.",
      );
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }
  async function importImage(file: File | undefined) {
    if (!file || !imageTarget.current) return;
    const target = imageTarget.current;
    try {
      if (
        !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
        file.size > 2500000
      )
        throw new Error("Choose a PNG, JPEG, or WebP under 2.5 MB.");
      const bitmap = await createImageBitmap(file);
      if (bitmap.width > 4096 || bitmap.height > 4096) {
        bitmap.close();
        throw new Error("Image dimensions must be 4096 px or smaller.");
      }
      bitmap.close();
      const data = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result as string);
        r.onerror = reject;
        r.readAsDataURL(file);
      });
      change(
        (p) => ({
          ...p,
          ...(target.field === "screen"
            ? {
                screen: {
                  ...(p.screen ?? defaultScreen),
                  image: data,
                  background: "image" as const,
                },
              }
            : {
                assets: p.assets.map((a) =>
                  a.id === target.id ? { ...a, [target.field]: data } : a,
                ),
              }),
        }),
        false,
      );
      toast.success("Image added");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not open that image");
    } finally {
      if (imageRef.current) imageRef.current.value = "";
    }
  }
  function saveStyle() {
    const name = styleName.trim();
    if (!name) return;
    if (project.styles.length >= 30) {
      toast.error("You can save up to 30 custom styles.");
      return;
    }
    if ([...presets, ...project.styles].some((p) => p.name === name)) {
      toast.error("Choose a unique style name.");
      return;
    }
    change(
      (p) => ({
        ...p,
        styles: [
          ...p.styles,
          { name, label: "Your saved style", values: styleValues(d) },
        ],
        assets: p.assets.map((a) =>
          a.id === d.id ? { ...a, themeId: name } : a,
        ),
      }),
      false,
    );
    setStyleOpen(false);
    toast.success("Style saved");
  }
  function updateStyle() {
    const values = styleValues(d);
    change(
      (p) => ({
        ...p,
        styles: p.styles.map((s) =>
          s.name === d.themeId ? { ...s, values } : s,
        ),
        assets: p.assets.map((a) =>
          a.themeId === d.themeId ? { ...a, ...values } : a,
        ),
      }),
      false,
    );
    toast.success("Linked assets updated");
  }
  async function runExport() {
    setBusy(true);
    try {
      await document.fonts.ready;
      const s = exportSettings;
      if (s.scope === "png") {
        const design = s.content
          ? d
          : { ...d, text: "", icon: "", iconData: "" };
        await loadImages(design);
        download(
          await canvasBlob(
            renderDesign(
              design,
              state,
              s.scale,
              s.content && design.includeText,
            ),
          ),
          `${slug(d.name)}-${state}@${s.scale}x.png`,
        );
      } else {
        download(
          await exportAssets(
            s.scope === "kit" ? assets : [d],
            s.scale,
            true,
            state,
            s.content,
            s.scope === "kit" ? screen : undefined,
          ),
          `${slug(s.scope === "kit" ? project.name : d.name)}.zip`,
        );
      }
      toast.success("Export downloaded");
      setExportOpen(false);
    } catch (e) {
      toast.error(
        e instanceof Error
          ? e.message
          : "Export failed. Try a smaller resolution.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function exportScreen() {
    setBusy(true);
    try {
      const canvas = await renderScreen(screen, assets);
      download(
        await canvasBlob(canvas),
        `${slug(screen.name)}-${screen.width}x${screen.height}.png`,
      );
      toast.success("Screen PNG exported");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Screen export failed",
      );
    } finally {
      setBusy(false);
    }
  }
  const exportProps = {
    design: d,
    settings: exportSettings,
    onChange: (v: Partial<ExportSettings>) =>
      setExportSettings((s) => ({ ...s, ...v })),
    busy,
    onExport: runExport,
    guides,
    onGuides: setGuides,
    onSlice: (slice: number) => patch({ slice }),
  };
  const allStyles = [...presets, ...project.styles];
  return (
    <main className="studio">
      <Toaster theme="dark" position="bottom-center" />
      <input
        ref={fileRef}
        hidden
        type="file"
        accept=".json"
        onChange={(e) => importProject(e.target.files?.[0])}
      />
      <input
        ref={imageRef}
        hidden
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={(e) => importImage(e.target.files?.[0])}
      />
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark">
            <Layers2 size={21} />
          </span>
          <strong>
            UIM<span>STUDIO</span>
          </strong>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="project-name">
              {project.name}
              <ChevronDown size={14} />
              <span className="project-tag">PERSONAL</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
              onSelect={() => {
                setProjectName(project.name);
                setRenameOpen(true);
              }}
            >
              Rename project
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={saveFile}>
              <Save size={15} /> Save project file
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => fileRef.current?.click()}>
              <FolderOpen size={15} /> Open project file
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <div className="menu-note">
              Projects are saved on this device.
              <br />
              Download a file to back up or move them.
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="header-actions">
          <span className="save-status">
            {saveStatus.startsWith("Saved") ? (
              <Check size={14} />
            ) : saveStatus.includes("fail") ? (
              <AlertCircle size={14} />
            ) : null}
            {saveStatus}
          </span>
          <button
            className="primary-button"
            onClick={() => {
              if (mode === "effects") {
                toast.info("Use Export animation ZIP in the effect settings.");
              } else if (mode === "scene") {
                void exportScreen();
              } else setExportOpen(true);
            }}
            disabled={!ready || busy}
          >
            <Download size={16} />{" "}
            {mode === "scene"
              ? busy
                ? "Exporting…"
                : "Export screen"
              : "Export assets"}
          </button>
        </div>
      </header>
      <div className="editor-shell">
        <aside className="asset-sidebar">
          <div className="sidebar-heading">
            <h2>
              Assets <span className="count">{assets.length}</span>
            </h2>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="icon-button"
                  aria-label="Add asset"
                  disabled={!ready}
                >
                  <Plus size={18} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {(["button", "panel", "slot", "bar"] as AssetKind[]).map(
                  (kind) => (
                    <DropdownMenuItem
                      key={kind}
                      onSelect={() => addAsset(kind)}
                    >
                      Add {kind === "bar" ? "progress bar" : kind}
                    </DropdownMenuItem>
                  ),
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="asset-list">
            {assets.map((a) => (
              <button
                key={a.id}
                className={`asset-row ${d.id === a.id && (mode !== "scene" || screenInspector === "asset") ? "selected" : ""}`}
                onClick={() => {
                  setSelected(a.id);
                  if (mode === "effects") setMode("asset");
                  if (mode === "scene") setScreenInspector("asset");
                }}
              >
                {a.kind === "button" ? (
                  <MousePointer2 size={17} />
                ) : a.kind === "panel" ? (
                  <PanelTop size={17} />
                ) : (
                  <Square size={17} />
                )}
                <span title={a.name}>{a.name}</span>
                <span className="asset-extension">PNG</span>
              </button>
            ))}
          </div>
          <div className="sidebar-section-title">
            <Palette size={15} />
            <h2>Style library</h2>
            <button
              className="icon-button"
              aria-label="Save current style"
              onClick={() => {
                setStyleName("");
                setStyleOpen(true);
              }}
            >
              <BookmarkPlus size={16} />
            </button>
          </div>
          <p className="sidebar-description">
            A starting point. Make it yours.
          </p>
          <div className="preset-grid">
            {allStyles.map((p) => (
              <button
                key={p.name}
                className={`preset-card ${d.themeId === p.name ? "active" : ""}`}
                onClick={() => {
                  patch({ ...p.values, themeId: p.name });
                  if (mode !== "scene") setMode("asset");
                }}
              >
                <div className="preset-art">
                  <AssetCanvas
                    design={{
                      ...baseDesign,
                      ...p.values,
                      width: 180,
                      height: 64,
                      text: "Aa",
                      icon: "",
                      fontSize: 24,
                    }}
                  />
                </div>
                <strong>{p.name}</strong>
                <small>{p.label}</small>
              </button>
            ))}
          </div>
          {project.styles.some((s) => s.name === d.themeId) && (
            <button
              className="secondary-button full mt-3"
              onClick={updateStyle}
            >
              Update linked style
            </button>
          )}
          <div className="sidebar-bottom">
            <Box size={18} />
            <div>
              <strong>Made for your game</strong>
              <span>Transparent, reusable assets</span>
            </div>
          </div>
        </aside>
        <div className="mode-bar">
          <Tabs value={mode} onValueChange={setMode}>
            <TabsList>
              <TabsTrigger value="asset">
                <PenTool size={14} /> Designer
              </TabsTrigger>
              <TabsTrigger value="scene">
                <LayoutTemplate size={14} /> Screen builder
              </TabsTrigger>
              <TabsTrigger value="effects">
                <Film size={14} /> Effects
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="toolbar-buttons">
            <button
              className="icon-button"
              aria-label="Undo"
              title="Undo (⌘Z)"
              disabled={!history.past.length}
              onClick={undo}
            >
              <Undo2 size={16} />
            </button>
            <button
              className="icon-button"
              aria-label="Redo"
              title="Redo (⌘⇧Z)"
              disabled={!history.future.length}
              onClick={redo}
            >
              <Redo2 size={16} />
            </button>
          </div>
        </div>
        {mode === "effects" ? (
          <EffectWorkspace
            effect={project.effect}
            onChange={(v) =>
              change((p) => ({ ...p, effect: { ...p.effect, ...v } }))
            }
          />
        ) : (
          <>
            <section className="workspace">
              <div className="workspace-toolbar">
                <div className="breadcrumbs">
                  {mode === "scene" ? "Screen" : "Assets"} <span>/</span>
                  <strong>{mode === "scene" ? screen.name : d.name}</strong>
                </div>
                <div className="toolbar-buttons">
                  <button
                    className="icon-button"
                    aria-label="Duplicate asset"
                    onClick={duplicate}
                    disabled={mode === "scene" && screenInspector !== "asset"}
                  >
                    <Copy size={16} />
                  </button>
                  <button
                    className="icon-button"
                    aria-label="Delete asset"
                    disabled={
                      assets.length === 1 ||
                      (mode === "scene" && screenInspector !== "asset")
                    }
                    onClick={remove}
                  >
                    <Trash2 size={15} />
                  </button>
                  <span className="toolbar-divider" />
                  <Choice
                    label="Canvas zoom"
                    value={mode === "scene" ? screenZoom : zoom}
                    options={[
                      ...(mode === "scene"
                        ? [{ value: "fit", label: "Fit" }]
                        : []),
                      ...["50", "75", "100", "150", "200"].map((v) => ({
                        value: v,
                        label: `${v}%`,
                      })),
                    ]}
                    onChange={mode === "scene" ? setScreenZoom : setZoom}
                  />
                </div>
              </div>
              <div className={`design-stage ${background}`}>
                <div className="canvas-label">
                  <span className="small-label">
                    {mode === "scene" ? screen.name.toUpperCase() : "CANVAS"}
                  </span>
                  <span>
                    {mode === "scene"
                      ? `${screen.width} × ${screen.height}`
                      : `${d.width} × ${d.height}`}{" "}
                    px
                  </span>
                </div>
                {mode === "scene" ? (
                  <ScenePreview
                    assets={assets}
                    screen={screen}
                    zoom={screenZoom}
                    selected={screenInspector === "asset" ? d.id : undefined}
                    onSelect={(id) => {
                      if (id) setSelected(id);
                      setScreenInspector(id ? "asset" : "screen");
                    }}
                    onMove={(id, x, y) =>
                      change((p) => ({
                        ...p,
                        assets: p.assets.map((a) =>
                          a.id === id ? { ...a, x, y } : a,
                        ),
                      }))
                    }
                  />
                ) : (
                  <div
                    className="main-asset"
                    style={{
                      width: `min(${((d.width + padding(d) * 2) * Number(zoom)) / 100}px, 92%)`,
                    }}
                  >
                    <div className="selection-label">{d.name}</div>
                    <AssetCanvas design={d} state={state} />
                    <div
                      className="selection-box"
                      style={{
                        left: `${(padding(d) / (d.width + padding(d) * 2)) * 100}%`,
                        right: `${(padding(d) / (d.width + padding(d) * 2)) * 100}%`,
                        top: `${(padding(d) / (d.height + padding(d) * 2 + d.depth)) * 100}%`,
                        bottom: `${((padding(d) + d.depth) / (d.height + padding(d) * 2 + d.depth)) * 100}%`,
                      }}
                    >
                      <i />
                      <i />
                      <i />
                      <i />
                      {guides && (
                        <div
                          className="slice-guides"
                          style={{
                            inset: `${(Math.min(d.slice, d.height / 2 - 1) / d.height) * 100}% ${(Math.min(d.slice, d.width / 2 - 1) / d.width) * 100}%`,
                          }}
                        />
                      )}
                    </div>
                  </div>
                )}
                <div className="canvas-controls">
                  {mode !== "scene" && (
                    <div className="background-options">
                      {["dark", "light", "checker"].map((b) => (
                        <button
                          key={b}
                          className={`${b} ${background === b ? "chosen" : ""}`}
                          aria-label={`${b} canvas background`}
                          onClick={() => setBackground(b)}
                        />
                      ))}
                    </div>
                  )}
                  {mode !== "scene" && <span className="toolbar-divider" />}
                  <span>
                    {mode === "scene"
                      ? "Drag to arrange · Click empty space for screen settings"
                      : "Preview background"}
                  </span>
                </div>
              </div>
              {mode !== "scene" && (
                <div className="states-section">
                  <div className="states-heading">
                    <div>
                      <h2>
                        {d.kind === "button"
                          ? "Button states"
                          : "Interaction previews"}
                      </h2>
                      <span>One design. Every interaction.</span>
                    </div>
                    <span className="subtle-badge">4 variants</span>
                  </div>
                  <div className="state-grid">
                    {states.map((s) => (
                      <button
                        key={s}
                        className={`state-card ${state === s ? "active" : ""}`}
                        onClick={() => {
                          setState(s);
                          setMode("asset");
                        }}
                      >
                        <div className="state-art">
                          <AssetCanvas design={d} state={s} />
                        </div>
                        <div className="state-name">
                          <span>
                            {s === "normal"
                              ? "Default"
                              : s[0].toUpperCase() + s.slice(1)}
                          </span>
                          {state === s ? (
                            <Check size={13} />
                          ) : (
                            <span className="state-dot" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <footer className="workspace-footer">
                <span>
                  <MousePointer2 size={13} />
                  {mode === "scene"
                    ? "Arrange your game screen"
                    : "Live asset preview"}
                </span>
                <span>
                  {mode === "scene"
                    ? `${screen.width} × ${screen.height} · PNG`
                    : "PNG · Transparent background"}
                </span>
              </footer>
            </section>
            <aside className="inspector">
              <div className="inspector-heading">
                <SlidersHorizontal size={16} />
                <h2>{mode === "scene" ? "Screen properties" : "Properties"}</h2>
              </div>
              <Tabs
                value={mode === "scene" ? screenInspector : inspector}
                onValueChange={
                  mode === "scene" ? setScreenInspector : setInspector
                }
              >
                <TabsList className="inspector-tabs">
                  {mode === "scene" ? (
                    <>
                      <TabsTrigger value="screen">Screen</TabsTrigger>
                      <TabsTrigger value="asset">Asset</TabsTrigger>
                    </>
                  ) : (
                    <>
                      <TabsTrigger value="design">Design</TabsTrigger>
                      <TabsTrigger value="export">Export</TabsTrigger>
                    </>
                  )}
                </TabsList>
              </Tabs>
              <div className="inspector-scroll">
                {mode === "scene" && screenInspector === "screen" ? (
                  <ScreenInspector
                    screen={screen}
                    onChange={patchScreen}
                    onExport={exportScreen}
                    busy={busy}
                    onImage={() => {
                      imageTarget.current = { id: "", field: "screen" };
                      imageRef.current?.click();
                    }}
                  />
                ) : mode === "scene" || inspector === "design" ? (
                  <>
                    {mode === "scene" && (
                      <section className="property-section">
                        <h3>Position on screen</h3>
                        <div className="two-fields mt-4">
                          <NumberField
                            label="Asset X"
                            displayLabel="X"
                            value={d.x ?? 0}
                            max={4096}
                            onChange={(x) => patch({ x })}
                          />
                          <NumberField
                            label="Asset Y"
                            displayLabel="Y"
                            value={d.y ?? 0}
                            max={4096}
                            onChange={(y) => patch({ y })}
                          />
                        </div>
                        <button
                          className="secondary-button full mt-3"
                          onClick={() =>
                            patch(
                              fitScreenAsset(
                                d,
                                screen,
                                (screen.width - d.width) / 2,
                                (screen.height - d.height) / 2,
                              ),
                            )
                          }
                        >
                          Center on screen
                        </button>
                      </section>
                    )}
                    <DesignInspector
                      design={d}
                      patch={patch}
                      onImage={(field) => {
                        imageTarget.current = { id: d.id, field };
                        imageRef.current?.click();
                      }}
                    />
                  </>
                ) : (
                  <ExportOptions {...exportProps} />
                )}
              </div>
            </aside>
          </>
        )}
      </div>
      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent className="studio-dialog">
          <DialogHeader>
            <DialogTitle>Export your assets</DialogTitle>
            <DialogDescription>
              Transparent images, ready for your game.
            </DialogDescription>
          </DialogHeader>
          <ExportOptions {...exportProps} />
        </DialogContent>
      </Dialog>
      <Dialog open={styleOpen} onOpenChange={setStyleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save a reusable style</DialogTitle>
            <DialogDescription>
              Reuse these colors, borders, and lighting across your assets.
            </DialogDescription>
          </DialogHeader>
          <input
            className="text-input"
            aria-label="Style name"
            placeholder="e.g. Forest adventure"
            maxLength={40}
            value={styleName}
            onChange={(e) => setStyleName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveStyle();
            }}
          />
          <button
            className="primary-button"
            disabled={!styleName.trim()}
            onClick={saveStyle}
          >
            Save style
          </button>
        </DialogContent>
      </Dialog>
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename project</DialogTitle>
            <DialogDescription>Give your game UI kit a name.</DialogDescription>
          </DialogHeader>
          <input
            className="text-input"
            aria-label="Project name"
            maxLength={80}
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
          />
          <button
            className="primary-button"
            disabled={!projectName.trim()}
            onClick={() => {
              change((p) => ({ ...p, name: projectName.trim() }), false);
              setRenameOpen(false);
            }}
          >
            Save name
          </button>
        </DialogContent>
      </Dialog>
    </main>
  );
}
