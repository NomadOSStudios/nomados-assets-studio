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
  RectangleHorizontal,
  Pencil,
  FilePlus2,
  X,
  Tag,
  AppWindow,
  Type,
  Pilcrow,
  AlignHorizontalJustifyStart,
  AlignHorizontalJustifyCenter,
  AlignHorizontalJustifyEnd,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  AlignHorizontalDistributeCenter,
  AlignVerticalDistributeCenter,
  BringToFront,
  SendToBack,
  ToggleRight,
  SquareCheck,
  Columns3,
  MessageSquare,
  Frame,
  CircleDot,
  Coins,
  BatteryMedium,
  Eye,
  EyeOff,
  Lock,
  LockOpen,
  Image,
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
import { EffectWorkspace, type EffectFormat } from "./effect-workspace";
import { ScenePreview, type Rect } from "./scene-preview";
import { ScreenInspector } from "./screen-inspector";
import {
  fitScreenAsset,
  resizeAboutCenter,
  renderScreen,
  screenAssets,
  newScreenId,
  type ScreenSettings,
  type ViewSettings,
} from "@/lib/screen";
import {
  type Design,
  type AssetKind,
  type ButtonState,
  baseDesign,
  presets,
  states,
  padding,
  depthOf,
  isShapeless,
  isButtonLike,
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
} from "@/lib/project";
import { exportAssets, exportEffect } from "@/lib/exports";
import { ensureFonts, readFontFile } from "@/lib/fonts";

type History = { past: Project[]; present: Project; future: Project[] };
const kindIcons = {
  button: MousePointer2,
  iconbutton: CircleDot,
  panel: PanelTop,
  window: AppWindow,
  frame: Frame,
  bubble: MessageSquare,
  slot: Square,
  bar: RectangleHorizontal,
  healthbar: BatteryMedium,
  slider: SlidersHorizontal,
  toggle: ToggleRight,
  checkbox: SquareCheck,
  tabs: Columns3,
  badge: Tag,
  counter: Coins,
  icon: Image,
  title: Type,
  paragraph: Pilcrow,
} as const;
const kindLabels: Record<AssetKind, string> = {
  button: "Button",
  iconbutton: "Icon button",
  panel: "Panel",
  window: "Window",
  frame: "Frame",
  bubble: "Bubble",
  slot: "Slot",
  bar: "Bar",
  healthbar: "Health bar",
  slider: "Slider",
  toggle: "Toggle",
  checkbox: "Checkbox",
  tabs: "Tabs",
  badge: "Badge",
  counter: "Counter",
  icon: "Icon",
  title: "Title",
  paragraph: "Paragraph",
};
const kindOrder: AssetKind[] = [
  "button",
  "iconbutton",
  "panel",
  "window",
  "frame",
  "bubble",
  "slot",
  "bar",
  "healthbar",
  "slider",
  "toggle",
  "checkbox",
  "tabs",
  "badge",
  "counter",
  "icon",
  "title",
  "paragraph",
];
const kindDefaults: Record<AssetKind, Partial<Design>> = {
  button: { width: 288, height: 76, text: "PLAY GAME", icon: "play" },
  iconbutton: {
    width: 72,
    height: 72,
    radius: 36,
    text: "",
    icon: "pack:settings-gear",
    iconSize: 44,
  },
  panel: { width: 360, height: 240, text: "", icon: "" },
  window: {
    width: 440,
    height: 300,
    text: "Settings",
    icon: "",
    radius: 14,
    fontSize: 18,
  },
  frame: {
    width: 320,
    height: 220,
    radius: 14,
    text: "",
    icon: "",
    borderWidth: 4,
    surface: "flat",
    depth: 0,
  },
  bubble: {
    width: 260,
    height: 90,
    radius: 16,
    text: "Hey there!",
    icon: "",
    fontSize: 18,
    tail: "bottom",
  },
  slot: { width: 100, height: 100, text: "", icon: "star" },
  bar: { width: 280, height: 32, text: "", icon: "", radius: 16 },
  healthbar: {
    width: 300,
    height: 28,
    radius: 8,
    text: "",
    icon: "",
    progress: 70,
    segments: 10,
  },
  slider: {
    width: 260,
    height: 14,
    radius: 7,
    text: "",
    icon: "",
    progress: 60,
    slice: 0,
  },
  toggle: { width: 72, height: 36, radius: 18, text: "", icon: "", on: true, slice: 0 },
  checkbox: { width: 44, height: 44, radius: 10, text: "", icon: "", on: true, slice: 0 },
  tabs: {
    width: 360,
    height: 48,
    radius: 12,
    text: "Items | Skills | Map",
    icon: "",
    fontSize: 16,
    activeTab: 0,
  },
  badge: { width: 96, height: 36, text: "NEW", icon: "", radius: 18, fontSize: 14 },
  counter: {
    width: 150,
    height: 44,
    radius: 22,
    text: "1,250",
    icon: "pack:coin-gold",
    iconSize: 30,
    fontSize: 18,
  },
  icon: {
    width: 96,
    height: 96,
    text: "",
    icon: "pack:coin-gold",
    includeText: false,
    slice: 0,
  },
  title: {
    width: 420,
    height: 64,
    text: "LEVEL COMPLETE",
    icon: "",
    fontSize: 44,
    bold: true,
    textAlign: "center",
    textColor: "#ffffff",
    textOutline: 2,
    textOutlineColor: "#1f2937",
    textShadow: true,
    includeText: true,
    slice: 0,
  },
  paragraph: {
    width: 380,
    height: 120,
    text: "Collect all three keys to open the vault. Watch for traps and keep an eye on the timer.",
    icon: "",
    fontSize: 18,
    bold: false,
    textAlign: "left",
    lineHeight: 1.4,
    textColor: "#e5e7eb",
    textOutline: 0,
    textShadow: false,
    includeText: true,
    slice: 0,
  },
};
const alignments = [
  ["left", "Align left", AlignHorizontalJustifyStart],
  ["centerX", "Center horizontally", AlignHorizontalJustifyCenter],
  ["right", "Align right", AlignHorizontalJustifyEnd],
  ["top", "Align top", AlignVerticalJustifyStart],
  ["centerY", "Center vertically", AlignVerticalJustifyCenter],
  ["bottom", "Align bottom", AlignVerticalJustifyEnd],
] as const;
type Alignment = (typeof alignments)[number][0] | "center";
export default function Studio() {
  const [history, setHistory] = useState<History>({
    past: [],
    present: initialProject,
    future: [],
  });
  const project = history.present,
    assets = project.assets;
  const screen =
    project.screens.find((s) => s.id === project.activeScreen) ??
    project.screens[0];
  const placed = screenAssets(assets, screen);
  const [selected, setSelected] = useState("play-button"),
    [selection, setSelection] = useState<string[]>(["play-button"]),
    [state, setState] = useState<ButtonState>("normal"),
    [zoom, setZoom] = useState("100"),
    [background, setBackground] = useState("dark"),
    [mode, setMode] = useState("asset"),
    [inspector, setInspector] = useState("design"),
    [screenInspector, setScreenInspector] = useState("screen"),
    [screenZoom, setScreenZoom] = useState("fit");
  const [ready, setReady] = useState(false),
    [dirty, setDirty] = useState(false),
    [saveStatus, setSaveStatus] = useState("Opening project…"),
    [fontTick, setFontTick] = useState(0);
  const [exportOpen, setExportOpen] = useState(false),
    [busy, setBusy] = useState(false),
    [exportSettings, setExportSettings] = useState<ExportSettings>({
      scope: "png",
      scale: 1,
      content: true,
    }),
    [guides, setGuides] = useState(false);
  const [effectFormat, setEffectFormat] = useState<EffectFormat>("sheet"),
    [effectProgress, setEffectProgress] = useState<number | null>(null);
  const [styleOpen, setStyleOpen] = useState(false),
    [styleName, setStyleName] = useState(""),
    [renameOpen, setRenameOpen] = useState(false),
    [projectName, setProjectName] = useState(""),
    [dropTarget, setDropTarget] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null),
    imageRef = useRef<HTMLInputElement>(null),
    fontRef = useRef<HTMLInputElement>(null),
    imageTarget = useRef<{
      id: string;
      field: "texture" | "iconData" | "screen";
    } | null>(null),
    lastEdit = useRef(0),
    saveRevision = useRef(0),
    clipboard = useRef<Design[]>([]),
    dragRow = useRef<string | null>(null),
    projectRef = useRef(project);
  useEffect(() => {
    projectRef.current = project;
  }, [project]);
  const d = assets.find((a) => a.id === selected) || assets[0];
  const placement = screen.placements[d.id];
  const selectedPlaced = placed.filter((a) => selection.includes(a.id));
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
  // Saved but not undoable: switching screens, view settings.
  const changeQuiet = useCallback((fn: (p: Project) => Project) => {
    setDirty(true);
    setHistory((h) => ({ ...h, present: fn(h.present) }));
  }, []);
  const select = useCallback((ids: string[], primary: string | null) => {
    setSelection(ids);
    if (primary) setSelected(primary);
    else if (ids.length) setSelected(ids[ids.length - 1]);
    setScreenInspector(ids.length ? "asset" : "screen");
  }, []);
  const patchAsset = (id: string, v: Partial<Design>) =>
    change((p) => ({
      ...p,
      assets: p.assets.map((a) => (a.id === id ? { ...a, ...v } : a)),
    }));
  const patch = (v: Partial<Design>) =>
    change((p) => {
      const a = p.assets.find((x) => x.id === d.id);
      if (!a) return p;
      const next = { ...a, ...v };
      const resized = next.width !== a.width || next.height !== a.height;
      return {
        ...p,
        assets: p.assets.map((x) => (x.id === d.id ? next : x)),
        // Width and height changes keep the asset centred on every screen.
        screens: resized
          ? p.screens.map((s) => {
              const pl = s.placements[a.id];
              if (!pl) return s;
              const pos = resizeAboutCenter({ ...a, ...pl }, s, next.width, next.height);
              return { ...s, placements: { ...s.placements, [a.id]: pos } };
            })
          : p.screens,
      };
    });
  const patchScreen = (update: Partial<ScreenSettings>) =>
    change((p) => ({
      ...p,
      screens: p.screens.map((s) =>
        s.id === p.activeScreen ? { ...s, ...update } : s,
      ),
    }));
  const patchView = (update: Partial<ViewSettings>) =>
    changeQuiet((p) => ({ ...p, view: { ...p.view, ...update } }));
  const place = (moves: { id: string; x: number; y: number }[], group = true) =>
    change(
      (p) => ({
        ...p,
        screens: p.screens.map((s) =>
          s.id === p.activeScreen
            ? {
                ...s,
                placements: {
                  ...s.placements,
                  ...Object.fromEntries(
                    moves.map((m) => [m.id, { x: m.x, y: m.y }]),
                  ),
                },
              }
            : s,
        ),
      }),
      group,
    );
  // Handle drags change the design size; other screens keep the asset centred.
  const resizeOnScreen = (id: string, rect: Rect) =>
    change((p) => {
      const a = p.assets.find((x) => x.id === id);
      if (!a) return p;
      const sized = { ...a, width: rect.width, height: rect.height };
      return {
        ...p,
        assets: p.assets.map((x) => (x.id === id ? sized : x)),
        screens: p.screens.map((s) => {
          const pl = s.placements[id];
          if (!pl) return s;
          const pos =
            s.id === p.activeScreen
              ? fitScreenAsset(sized, s, rect.x, rect.y)
              : resizeAboutCenter({ ...a, ...pl }, s, rect.width, rect.height);
          return { ...s, placements: { ...s.placements, [id]: pos } };
        }),
      };
    });
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
          setSelection([p.assets[0].id]);
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
  // Project fonts become usable on the canvas once registered with the document.
  useEffect(() => {
    let active = true;
    if (!project.fonts.length) return;
    ensureFonts(project.fonts).then(() => {
      if (active) setFontTick((t) => t + 1);
    });
    return () => {
      active = false;
    };
  }, [project.fonts]);
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
      if (e.shiftKey) redo();
      else undo();
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
        "Read the current UI asset designs, screens, and animation settings. Image bytes are omitted.",
      inputSchema: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      execute: () => {
        const p = projectRef.current;
        return {
          name: p.name,
          assets: p.assets.map(({ texture, iconData, ...a }) => ({
            ...a,
            hasTexture: !!texture,
            hasUploadedIcon: !!iconData,
          })),
          effect: p.effect,
          activeScreen: p.activeScreen,
          screens: p.screens.map(({ image, ...s }) => ({
            ...s,
            hasImage: !!image,
          })),
        };
      },
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
                    width: { type: "number", minimum: 8, maximum: 1024 },
                    height: { type: "number", minimum: 8, maximum: 1024 },
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
                      enum: [
                        "raised",
                        "flat",
                        "embossed",
                        "engraved",
                        "glossy",
                        "bevel",
                        "soft",
                      ],
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
    const defaults = { ...baseDesign, ...kindDefaults[kind] };
    const x = Math.max(0, Math.round((screen.width - defaults.width) / 2)),
      y = Math.max(0, Math.round((screen.height - defaults.height) / 2));
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
            name: `New ${kindLabels[kind].toLowerCase()}`,
            kind,
            locked: false,
            hidden: false,
            x,
            y,
          },
        ],
        screens: p.screens.map((s) =>
          s.id === p.activeScreen
            ? { ...s, placements: { ...s.placements, [id]: { x, y } } }
            : s,
        ),
      }),
      false,
    );
    select([id], id);
    if (mode !== "scene") setMode("asset");
  }
  // Copies of the given assets, placed on the active screen; returns old → new ids.
  function duplicate(
    ids: string[] = selection,
    offset = 20,
  ): Record<string, string> | null {
    const sources = assets.filter((a) => ids.includes(a.id));
    if (!sources.length) return null;
    if (assets.length + sources.length > 50) {
      toast.error("This project can contain up to 50 assets.");
      return null;
    }
    const map: Record<string, string> = {};
    const copies = sources.map((src) => {
      const id = crypto.randomUUID();
      map[src.id] = id;
      return { ...src, id, name: `${src.name.slice(0, 70)} copy`, locked: false };
    });
    change(
      (p) => ({
        ...p,
        assets: [...p.assets, ...copies],
        screens: p.screens.map((s) => {
          if (s.id !== p.activeScreen) return s;
          const placements = { ...s.placements };
          for (const src of sources) {
            const pl = s.placements[src.id];
            if (pl)
              placements[map[src.id]] = fitScreenAsset(
                src,
                s,
                pl.x + offset,
                pl.y + offset,
              );
          }
          return { ...s, placements };
        }),
      }),
      false,
    );
    const newIds = sources.map((s) => map[s.id]);
    select(newIds, map[selected] ?? newIds[0]);
    return map;
  }
  function remove(ids: string[] = selection) {
    const targets = assets.filter((a) => ids.includes(a.id)).map((a) => a.id);
    if (!targets.length) return;
    if (assets.length - targets.length < 1) {
      toast.info("Keep at least one asset in the project.");
      return;
    }
    change(
      (p) => ({
        ...p,
        assets: p.assets.filter((a) => !targets.includes(a.id)),
        screens: p.screens.map((s) => ({
          ...s,
          placements: Object.fromEntries(
            Object.entries(s.placements).filter(([id]) => !targets.includes(id)),
          ),
        })),
      }),
      false,
    );
    if (mode === "scene") select([], null);
    else {
      const remaining = assets.find((a) => !targets.includes(a.id))!;
      select([remaining.id], remaining.id);
    }
    toast(
      targets.length > 1 ? `${targets.length} assets removed` : "Asset removed",
      { action: { label: "Undo", onClick: undo } },
    );
  }
  function copySelection() {
    const items = assets.filter((a) => selection.includes(a.id));
    if (!items.length) return;
    clipboard.current = items.map((a) => ({
      ...a,
      ...(screen.placements[a.id] ?? {}),
    }));
    toast(`Copied ${items.length} asset${items.length > 1 ? "s" : ""}`);
  }
  function paste() {
    const items = clipboard.current;
    if (!items.length) return;
    if (assets.length + items.length > 50) {
      toast.error("This project can contain up to 50 assets.");
      return;
    }
    const ids: string[] = [];
    const copies = items.map((src) => {
      const id = crypto.randomUUID();
      ids.push(id);
      return { ...src, id, locked: false };
    });
    change(
      (p) => ({
        ...p,
        assets: [...p.assets, ...copies],
        screens: p.screens.map((s) =>
          s.id !== p.activeScreen
            ? s
            : {
                ...s,
                placements: {
                  ...s.placements,
                  ...Object.fromEntries(
                    copies.map((c) => [
                      c.id,
                      fitScreenAsset(c, s, (c.x ?? 0) + 20, (c.y ?? 0) + 20),
                    ]),
                  ),
                },
              },
        ),
      }),
      false,
    );
    select(ids, ids[ids.length - 1]);
  }
  // Aligns the selection to the screen, or to the selection's own bounds
  // when several assets are selected.
  function align(where: Alignment) {
    const targets = selectedPlaced.filter((a) => !a.locked);
    if (!targets.length) return;
    const multi = targets.length > 1 && where !== "center";
    const bounds = multi
      ? {
          left: Math.min(...targets.map((a) => a.x ?? 0)),
          top: Math.min(...targets.map((a) => a.y ?? 0)),
          right: Math.max(...targets.map((a) => (a.x ?? 0) + a.width)),
          bottom: Math.max(...targets.map((a) => (a.y ?? 0) + a.height)),
        }
      : { left: 0, top: 0, right: screen.width, bottom: screen.height };
    const cx = (bounds.left + bounds.right) / 2,
      cy = (bounds.top + bounds.bottom) / 2;
    place(
      targets.map((a) => {
        const x =
          where === "left"
            ? bounds.left
            : where === "centerX" || where === "center"
              ? cx - a.width / 2
              : where === "right"
                ? bounds.right - a.width
                : (a.x ?? 0);
        const y =
          where === "top"
            ? bounds.top
            : where === "centerY" || where === "center"
              ? cy - a.height / 2
              : where === "bottom"
                ? bounds.bottom - a.height
                : (a.y ?? 0);
        return { id: a.id, ...fitScreenAsset(a, screen, x, y) };
      }),
      false,
    );
  }
  // Even gaps between three or more selected assets along one axis.
  function distribute(axis: "x" | "y") {
    const size = (a: Design) => (axis === "x" ? a.width : a.height),
      pos = (a: Design) => (axis === "x" ? (a.x ?? 0) : (a.y ?? 0));
    const targets = selectedPlaced
      .filter((a) => !a.locked)
      .sort((a, b) => pos(a) - pos(b));
    if (targets.length < 3) return;
    const first = targets[0],
      last = targets[targets.length - 1],
      span = pos(last) + size(last) - pos(first),
      total = targets.reduce((sum, a) => sum + size(a), 0),
      gap = (span - total) / (targets.length - 1);
    let cursor = pos(first);
    place(
      targets.map((a) => {
        const v = Math.round(cursor);
        cursor += size(a) + gap;
        return {
          id: a.id,
          x: axis === "x" ? v : (a.x ?? 0),
          y: axis === "y" ? v : (a.y ?? 0),
        };
      }),
      false,
    );
  }
  // Swaps the asset with its neighbour in the list, which is the draw order.
  function reorder(direction: -1 | 1) {
    change((p) => {
      const i = p.assets.findIndex((a) => a.id === d.id),
        j = i + direction;
      if (i < 0 || j < 0 || j >= p.assets.length) return p;
      const next = [...p.assets];
      [next[i], next[j]] = [next[j], next[i]];
      return { ...p, assets: next };
    }, false);
  }
  function reorderTo(fromId: string, toId: string) {
    if (fromId === toId) return;
    change((p) => {
      const from = p.assets.findIndex((a) => a.id === fromId),
        to = p.assets.findIndex((a) => a.id === toId);
      if (from < 0 || to < 0) return p;
      const next = [...p.assets];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return { ...p, assets: next };
    }, false);
  }
  function placeOnScreen(id: string) {
    const a = assets.find((x) => x.id === id);
    if (!a) return;
    place(
      [
        {
          id,
          ...fitScreenAsset(
            a,
            screen,
            (screen.width - a.width) / 2,
            (screen.height - a.height) / 2,
          ),
        },
      ],
      false,
    );
  }
  function removeFromScreen(id: string) {
    change(
      (p) => ({
        ...p,
        screens: p.screens.map((s) => {
          if (s.id !== p.activeScreen) return s;
          const placements = { ...s.placements };
          delete placements[id];
          return { ...s, placements };
        }),
      }),
      false,
    );
    select([], null);
  }
  function switchScreen(id: string) {
    changeQuiet((p) => ({ ...p, activeScreen: id }));
    select([], null);
  }
  function addScreen() {
    if (project.screens.length >= 20) {
      toast.error("A project can hold up to 20 screens.");
      return;
    }
    const id = newScreenId(project.screens);
    change(
      (p) => ({
        ...p,
        screens: [
          ...p.screens,
          { ...screen, id, name: `Screen ${p.screens.length + 1}`, placements: {} },
        ],
        activeScreen: id,
      }),
      false,
    );
    select([], null);
  }
  function duplicateScreen() {
    if (project.screens.length >= 20) {
      toast.error("A project can hold up to 20 screens.");
      return;
    }
    const id = newScreenId(project.screens);
    change(
      (p) => ({
        ...p,
        screens: [
          ...p.screens,
          {
            ...screen,
            id,
            name: `${screen.name.slice(0, 70)} copy`,
            placements: { ...screen.placements },
          },
        ],
        activeScreen: id,
      }),
      false,
    );
    select([], null);
  }
  function deleteScreen() {
    if (project.screens.length < 2) return;
    change((p) => {
      const rest = p.screens.filter((s) => s.id !== p.activeScreen);
      return { ...p, screens: rest, activeScreen: rest[0].id };
    }, false);
    select([], null);
    toast("Screen removed", { action: { label: "Undo", onClick: undo } });
  }
  function newProject() {
    change(() => initialProject, false);
    select([initialProject.assets[0].id], initialProject.assets[0].id);
    setMode("asset");
    setInspector("design");
    toast("Started a new project", {
      action: { label: "Undo", onClick: undo },
    });
  }
  function removeStyle(name: string) {
    change(
      (p) => ({
        ...p,
        styles: p.styles.filter((s) => s.name !== name),
        assets: p.assets.map((a) =>
          a.themeId === name ? { ...a, themeId: undefined } : a,
        ),
      }),
      false,
    );
    toast("Saved style removed", {
      action: { label: "Undo", onClick: undo },
    });
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
      select([parsed.assets[0].id], parsed.assets[0].id);
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
                screens: p.screens.map((s) =>
                  s.id === p.activeScreen
                    ? { ...s, image: data, background: "image" as const }
                    : s,
                ),
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
  async function importFont(file: File | undefined) {
    if (!file) return;
    try {
      if (project.fonts.length >= 12)
        throw new Error("A project can hold up to 12 fonts.");
      const font = await readFontFile(file);
      let name = font.name,
        n = 2;
      while (project.fonts.some((f) => f.name === name)) name = `${font.name} ${n++}`;
      const entry = { ...font, name };
      await ensureFonts([entry]);
      change(
        (p) => ({
          ...p,
          fonts: [...p.fonts, entry],
          assets: p.assets.map((a) => (a.id === d.id ? { ...a, font: name } : a)),
        }),
        false,
      );
      toast.success(`Font "${name}" added to the project`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not add that font");
    } finally {
      if (fontRef.current) fontRef.current.value = "";
    }
  }
  function removeFont(name: string) {
    change(
      (p) => ({
        ...p,
        fonts: p.fonts.filter((f) => f.name !== name),
        assets: p.assets.map((a) =>
          a.font === name ? { ...a, font: "Arial" } : a,
        ),
      }),
      false,
    );
    toast("Font removed", { action: { label: "Undo", onClick: undo } });
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
  const screensForExport = () =>
    project.screens.map((s) => ({ settings: s, assets: screenAssets(assets, s) }));
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
            s.scope === "kit" ? screensForExport() : [],
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
  async function exportScreen(all = false) {
    setBusy(true);
    try {
      for (const s of all ? project.screens : [screen]) {
        const canvas = await renderScreen(s, screenAssets(assets, s));
        download(
          await canvasBlob(canvas),
          `${slug(s.name)}-${s.width}x${s.height}.png`,
        );
      }
      toast.success(all ? "All screens exported" : "Screen PNG exported");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Screen export failed",
      );
    } finally {
      setBusy(false);
    }
  }
  async function runEffectExport() {
    setEffectProgress(0);
    try {
      const zip = await exportEffect(
        project.effect,
        effectFormat,
        setEffectProgress,
      );
      download(zip, `${project.effect.type}-${effectFormat}.zip`);
      toast.success("Animation exported");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Animation export failed",
      );
    } finally {
      setEffectProgress(null);
    }
  }
  function clickRow(a: Design, shift: boolean) {
    if (mode === "effects") setMode("asset");
    if (shift && mode !== "effects") {
      const next = selection.includes(a.id)
        ? selection.filter((id) => id !== a.id)
        : [...selection, a.id];
      select(next, next.includes(a.id) ? a.id : (next[next.length - 1] ?? null));
      return;
    }
    select([a.id], a.id);
    if (mode === "scene" && !screen.placements[a.id] && !a.hidden)
      placeOnScreen(a.id);
  }
  // Editing shortcuts. Re-subscribed each render so handlers never go stale.
  useEffect(() => {
    function key(e: KeyboardEvent) {
      const target = e.target instanceof HTMLElement ? e.target : null;
      if (
        target &&
        (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) ||
          target.isContentEditable)
      )
        return;
      if (
        document.querySelector(
          '[data-state="open"]:is([role="dialog"], [role="menu"], [role="listbox"])',
        )
      )
        return;
      if (mode === "effects") return;
      const meta = e.metaKey || e.ctrlKey,
        k = e.key.toLowerCase(),
        scene = mode === "scene";
      if (meta && k === "a" && scene) {
        e.preventDefault();
        const ids = placed.filter((a) => !a.locked).map((a) => a.id);
        select(ids, ids[ids.length - 1] ?? null);
        return;
      }
      if (meta && k === "c") {
        e.preventDefault();
        copySelection();
        return;
      }
      if (meta && k === "v") {
        e.preventDefault();
        paste();
        return;
      }
      if (meta && k === "d") {
        if (scene && screenInspector !== "asset") return;
        e.preventDefault();
        duplicate();
        return;
      }
      if (!scene || screenInspector !== "asset") return;
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        remove();
      } else if (e.key === "Escape") select([], null);
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  });
  const exportProps = {
    design: d,
    state,
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
  const sceneSelecting = mode === "scene" && screenInspector === "asset";
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
      <input
        ref={fontRef}
        hidden
        type="file"
        accept=".ttf,.otf,.woff,.woff2"
        onChange={(e) => importFont(e.target.files?.[0])}
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
              <Pencil size={15} /> Rename project
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={saveFile}>
              <Save size={15} /> Save project file
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => fileRef.current?.click()}>
              <FolderOpen size={15} /> Open project file
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={newProject}>
              <FilePlus2 size={15} /> New project
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
              if (mode === "effects") void runEffectExport();
              else if (mode === "scene") void exportScreen();
              else setExportOpen(true);
            }}
            disabled={!ready || busy || effectProgress !== null}
          >
            <Download size={16} />{" "}
            {mode === "effects"
              ? effectProgress === null
                ? "Export animation"
                : `Exporting ${effectProgress}%`
              : mode === "scene"
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
                  title="Add asset"
                  disabled={!ready}
                >
                  <Plus size={18} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="add-menu">
                {kindOrder.map((kind) => {
                  const Icon = kindIcons[kind];
                  return (
                    <DropdownMenuItem key={kind} onSelect={() => addAsset(kind)}>
                      <Icon size={15} /> {kindLabels[kind]}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="asset-list">
            {assets.map((a) => {
              const Icon = kindIcons[a.kind];
              const active =
                selection.includes(a.id) &&
                mode !== "effects" &&
                (mode !== "scene" || screenInspector === "asset");
              const onScreen = !!screen.placements[a.id];
              return (
                <div
                  key={a.id}
                  role="button"
                  tabIndex={0}
                  className={`asset-row ${active ? "selected" : ""} ${a.hidden ? "is-hidden" : ""} ${mode === "scene" && !onScreen ? "unplaced" : ""} ${dropTarget === a.id ? "drop-target" : ""}`}
                  title={
                    mode === "scene" && !onScreen
                      ? `${a.name} · not on ${screen.name} · click to place`
                      : `${a.name} · ${a.width} × ${a.height} px · drag to reorder`
                  }
                  aria-current={active ? "true" : undefined}
                  draggable
                  onDragStart={(e) => {
                    dragRow.current = a.id;
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (dropTarget !== a.id) setDropTarget(a.id);
                  }}
                  onDragLeave={() =>
                    setDropTarget((t) => (t === a.id ? null : t))
                  }
                  onDrop={(e) => {
                    e.preventDefault();
                    if (dragRow.current) reorderTo(dragRow.current, a.id);
                    dragRow.current = null;
                    setDropTarget(null);
                  }}
                  onDragEnd={() => {
                    dragRow.current = null;
                    setDropTarget(null);
                  }}
                  onClick={(e) => clickRow(a, e.shiftKey)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      clickRow(a, e.shiftKey);
                    }
                  }}
                >
                  <Icon size={17} />
                  <span className="asset-name">{a.name}</span>
                  <span className="row-tools">
                    <button
                      className="icon-button mini"
                      title={a.hidden ? "Show on screens" : "Hide on screens"}
                      aria-label={`${a.hidden ? "Show" : "Hide"} ${a.name}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        patchAsset(a.id, { hidden: !a.hidden });
                      }}
                    >
                      {a.hidden ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                    <button
                      className="icon-button mini"
                      title={a.locked ? "Unlock position" : "Lock position"}
                      aria-label={`${a.locked ? "Unlock" : "Lock"} ${a.name}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        patchAsset(a.id, { locked: !a.locked });
                      }}
                    >
                      {a.locked ? <Lock size={13} /> : <LockOpen size={13} />}
                    </button>
                  </span>
                  <span className="asset-kind">{kindLabels[a.kind]}</span>
                </div>
              );
            })}
          </div>
          <div className="sidebar-section-title">
            <Palette size={15} />
            <h2>Style library</h2>
            <button
              className="icon-button"
              aria-label="Save current style"
              title="Save the selected asset's look as a style"
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
            {allStyles.map((p) => {
              const custom = project.styles.some((s) => s.name === p.name);
              return (
                <div key={p.name} className="preset-slot">
                  <button
                    className={`preset-card ${d.themeId === p.name && mode !== "effects" ? "active" : ""}`}
                    title={`Apply ${p.name} to ${d.name}`}
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
                  {custom && (
                    <button
                      className="icon-button preset-remove"
                      aria-label={`Delete style ${p.name}`}
                      title="Delete saved style"
                      onClick={() => removeStyle(p.name)}
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
              );
            })}
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
            format={effectFormat}
            onFormat={setEffectFormat}
            progress={effectProgress}
            onExport={runEffectExport}
          />
        ) : (
          <>
            <section className="workspace">
              <div className="workspace-toolbar">
                <div className="breadcrumbs">
                  {mode === "scene" ? "Screen" : "Assets"} <span>/</span>
                  <strong>
                    {mode === "scene"
                      ? screen.name
                      : d.name}
                  </strong>
                  {sceneSelecting && selection.length > 1 && (
                    <span className="subtle-badge">{selection.length} selected</span>
                  )}
                </div>
                <div className="toolbar-buttons">
                  <button
                    className="icon-button"
                    aria-label="Duplicate"
                    title="Duplicate (⌘D)"
                    onClick={() => duplicate()}
                    disabled={mode === "scene" && !sceneSelecting}
                  >
                    <Copy size={16} />
                  </button>
                  <button
                    className="icon-button"
                    aria-label="Delete"
                    title={mode === "scene" ? "Delete (⌫)" : "Delete asset"}
                    disabled={
                      assets.length === 1 || (mode === "scene" && !sceneSelecting)
                    }
                    onClick={() => remove()}
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
                    assets={placed}
                    screen={screen}
                    selection={sceneSelecting ? selection : []}
                    primary={sceneSelecting ? d.id : undefined}
                    zoom={screenZoom}
                    view={project.view}
                    revision={fontTick}
                    onSelect={select}
                    onMove={(moves) => place(moves)}
                    onResize={resizeOnScreen}
                    onDuplicate={(ids) => duplicate(ids, 0)}
                  />
                ) : (
                  <div
                    className={`main-asset ${d.pixelSize >= 2 ? "pixel-grid" : ""}`}
                    style={{
                      width: `min(${((d.width + padding(d) * 2) * Number(zoom)) / 100}px, 92%)`,
                    }}
                  >
                    <div className="selection-label">{d.name}</div>
                    <AssetCanvas key={fontTick} design={d} state={state} />
                    <div
                      className="selection-box"
                      style={{
                        left: `${(padding(d) / (d.width + padding(d) * 2)) * 100}%`,
                        right: `${(padding(d) / (d.width + padding(d) * 2)) * 100}%`,
                        top: `${(padding(d) / (d.height + padding(d) * 2 + depthOf(d))) * 100}%`,
                        bottom: `${((padding(d) + depthOf(d)) / (d.height + padding(d) * 2 + depthOf(d))) * 100}%`,
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
                          title={`${b[0].toUpperCase() + b.slice(1)} background (preview only)`}
                          onClick={() => setBackground(b)}
                        />
                      ))}
                    </div>
                  )}
                  {mode !== "scene" && <span className="toolbar-divider" />}
                  <span>
                    {mode === "scene"
                      ? "Drag to arrange · handles resize (⇧ keeps ratio, ⌥ from centre) · ⇧-click or drag empty space to multi-select · ⌥-drag duplicates · ⌘-drag skips snapping · ⌫ deletes"
                      : "Preview background"}
                  </span>
                </div>
              </div>
              {mode !== "scene" && !isShapeless(d) && (
                <div className="states-section">
                  <div className="states-heading">
                    <div>
                      <h2>
                        {isButtonLike(d) ? "Button states" : "Interaction previews"}
                      </h2>
                      <span>
                        {isButtonLike(d)
                          ? "Pick a state to preview, export, or give custom colors."
                          : "One design. Every interaction."}
                      </span>
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
                          <AssetCanvas key={fontTick} design={d} state={s} />
                        </div>
                        <div className="state-name">
                          <span>
                            {s === "normal"
                              ? "Default"
                              : s[0].toUpperCase() + s.slice(1)}
                            {s !== "normal" && d.stateStyles?.[s] ? " ·" : ""}
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
                    ? `${placed.length} of ${assets.length} assets on this screen`
                    : "Live asset preview"}
                </span>
                <span>
                  {mode === "scene"
                    ? `${screen.width} × ${screen.height} · PNG`
                    : `Exports ${d.width + padding(d) * 2} × ${d.height + padding(d) * 2 + depthOf(d)} px at 1× · transparent PNG`}
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
                    screens={project.screens}
                    onSelectScreen={switchScreen}
                    onAddScreen={addScreen}
                    onDuplicateScreen={duplicateScreen}
                    onDeleteScreen={deleteScreen}
                    onChange={patchScreen}
                    onExport={() => exportScreen()}
                    onExportAll={() => exportScreen(true)}
                    busy={busy}
                    view={project.view}
                    onView={patchView}
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
                        {!placement ? (
                          <>
                            <p className="help-text">
                              {d.hidden
                                ? `${d.name} is hidden. Show it in the asset list to place it.`
                                : `${d.name} is not on ${screen.name} yet.`}
                            </p>
                            <button
                              className="secondary-button full"
                              disabled={d.hidden}
                              onClick={() => placeOnScreen(d.id)}
                            >
                              Place on this screen
                            </button>
                          </>
                        ) : (
                          <>
                            {selection.length > 1 && (
                              <p className="help-text">
                                {selection.length} assets selected. Alignment
                                and spacing apply to the whole selection.
                              </p>
                            )}
                            <div className="two-fields mt-4">
                              <NumberField
                                label="Asset X"
                                displayLabel="X"
                                value={placement.x}
                                max={4096}
                                onChange={(x) =>
                                  place([{ id: d.id, x, y: placement.y }])
                                }
                              />
                              <NumberField
                                label="Asset Y"
                                displayLabel="Y"
                                value={placement.y}
                                max={4096}
                                onChange={(y) =>
                                  place([{ id: d.id, x: placement.x, y }])
                                }
                              />
                            </div>
                            <div className="field-label mt-4">
                              {selection.length > 1
                                ? "Align selection"
                                : "Align to screen"}
                            </div>
                            <div className="align-row">
                              {alignments.map(([where, label, Icon]) => (
                                <button
                                  key={where}
                                  className="icon-button"
                                  title={label}
                                  aria-label={label}
                                  onClick={() => align(where)}
                                >
                                  <Icon size={16} />
                                </button>
                              ))}
                            </div>
                            {selection.length >= 3 && (
                              <div className="two-fields mt-3">
                                <button
                                  className="secondary-button"
                                  title="Even horizontal gaps"
                                  onClick={() => distribute("x")}
                                >
                                  <AlignHorizontalDistributeCenter size={15} />{" "}
                                  Space across
                                </button>
                                <button
                                  className="secondary-button"
                                  title="Even vertical gaps"
                                  onClick={() => distribute("y")}
                                >
                                  <AlignVerticalDistributeCenter size={15} />{" "}
                                  Space down
                                </button>
                              </div>
                            )}
                            <button
                              className="secondary-button full mt-3"
                              onClick={() => align("center")}
                            >
                              Center on screen
                            </button>
                            <div className="field-label mt-4">Stacking order</div>
                            <div className="two-fields">
                              <button
                                className="secondary-button"
                                title="Send backward"
                                disabled={assets[0]?.id === d.id}
                                onClick={() => reorder(-1)}
                              >
                                <SendToBack size={15} /> Backward
                              </button>
                              <button
                                className="secondary-button"
                                title="Bring forward"
                                disabled={assets[assets.length - 1]?.id === d.id}
                                onClick={() => reorder(1)}
                              >
                                <BringToFront size={15} /> Forward
                              </button>
                            </div>
                            <div className="inline-actions">
                              <button
                                className="text-button"
                                onClick={() => removeFromScreen(d.id)}
                              >
                                <X size={14} /> Remove from this screen
                              </button>
                            </div>
                            <p className="help-text">
                              Panels and windows sit behind other assets; titles
                              and paragraphs sit on top. Drag rows in the asset
                              list to reorder.
                            </p>
                          </>
                        )}
                      </section>
                    )}
                    <DesignInspector
                      design={d}
                      patch={patch}
                      state={state}
                      fonts={project.fonts}
                      onFontUpload={() => fontRef.current?.click()}
                      onFontRemove={removeFont}
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
