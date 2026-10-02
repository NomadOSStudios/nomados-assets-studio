# UIM Studio

A personal, browser-based game UI asset designer. Create buttons, icon buttons, panels, windows, frames, speech bubbles, slots, progress and health bars, sliders, toggles, checkboxes, tab bars, badges, counters, icons, titles, paragraphs, and animated effects, then export transparent assets for Unity.

## Run locally

Requires Node.js 22.13 or later.

```sh
npm install
npm run dev
```

Open the exact local URL printed by the server (normally http://127.0.0.1:5173).

```sh
npx tsc --noEmit
npm run build
```

## Features

- Canvas-based editing and PNG export use the same renderer.
- Editable dimensions, individual corner radii, rounded or chamfered corners, linear or radial gradients with up to four extra colour stops, borders, shadow colour, and glow colour.
- Seven surfaces: flat, raised 3D block, glossy sheen, chiseled bevel, embossed, engraved, and soft neumorphic lighting, each with a highlight strength and a light angle.
- Textures with opacity, scale, and tiling, plus a grain overlay. A pixel-art mode renders at a chunky pixel size with no smoothing.
- Text outline, text shadow, uppercase, letter spacing, and uploaded project fonts (TTF, OTF, WOFF, WOFF2) saved inside the project file.
- Icons: nine tintable vector glyphs, a built-in library of 40 full-colour game icons (coins, gems, chests, potions, weapons and more) shipped in `public/icons`, and your own uploads. Any button, slot, badge or counter can carry one at its own size, and the **Icon** asset kind places one on a screen by itself.
- Per-state colour overrides for buttons: hover, pressed, and disabled can each use their own fill, border, and text colours.
- Kind-specific controls: fill amount and colour for bars, sliders, and segmented health bars; on/off for toggles and checkboxes; active tab for tab bars; tail direction for speech bubbles.
- Numeric controls support sliders, exact typing, and wheel adjustment while hovering over the value. Scroll up to increase and down to decrease; hold Shift for ten times the step.
- Border color, thickness, and Inside / Center / Outside placement. Outside borders receive extra PNG padding when needed; existing projects keep their inside borders.
- Eleven starting styles, saved custom styles, and explicit updates to assets linked to a saved style. Hover a saved style to delete it; linked assets keep their look.
- Default, hover, pressed, and disabled state previews.
- Text, system fonts, built-in icons, uploaded icons, and image textures.
- Folders: select assets and press ⌘G (or the folder button) to group them like Photoshop layers. A folder can be collapsed, renamed, selected as a whole, hidden, locked, moved, aligned, duplicated with everything inside, dragged to reorder, or ungrouped with ⌘⇧G. Folders become parent objects in the Unity prefab.
- Undo/redo, asset creation/duplication/removal, and a draggable screen builder. ⌘D duplicates, ⌘C and ⌘V copy and paste assets, and ⌘A selects everything on a screen. Assets can be locked, hidden, and reordered by dragging rows in the list.
- Several screens per project (menu, HUD, pause…) sharing one asset library, each with its own layout. Custom screen dimensions (64–4096 px), common resolution presets, orientation swap, fit/zoom, rulers, an optional grid with snap-to-grid, and precise asset coordinates.
- Solid, gradient, transparent, or uploaded image backgrounds, saved with the project.
- Whole-screen PNG export at the exact chosen resolution, without editor guides.
- Device-local autosave in IndexedDB and portable `.uim.json` files, including imported image data.
- Transparent PNGs at 1×, 2×, and 4×. ZIP packs include button states, a manifest, and a Unity sprite importer.
- Confetti, sparkles, and seamless floating backgrounds, with deterministic playback and PNG frame or sprite-sheet exports. The header export button follows the active workspace: assets, screen, or animation.
- Optional browser WebMCP tools to read the project and update existing assets.

## Saving

Use the project menu beside the logo to rename the project, save or open a project file, or start a new project. Starting a new project can be undone. Browser saves belong to the current browser and site origin. They do not sync between devices or browser profiles. Download a project file for backups or transfers. If storage is unavailable, the editor keeps the current work in memory and displays a save error.

## Build a screen

Open **Screen builder**, then use the **Screen** tab in the right inspector to manage screens, name the current one, set its width and height, choose a resolution preset, turn on rulers, the grid, and snap-to-grid, or change the background. Background images support fill/crop, fit inside, and stretch. Assets are shared between screens: clicking an asset in the list places it on the current screen, and **Remove from this screen** takes it off again without deleting it.

The dashed selection outline, its handles, and the name label can be hidden with the outline button under the canvas or the O key; the choice is remembered in this browser. Click an asset to drag it, drag its handles to resize it (Shift keeps the aspect ratio, Option resizes from the centre), or edit its **Asset** properties, including X/Y coordinates, six align buttons, **Center on screen**, and **Stacking order**. Shift-click or drag across empty space to select several assets; alignment then works within the selection and three or more can be spaced evenly. Dragging snaps to the screen edges and centre, to other assets, and to the grid when enabled, with dashed guides; hold Shift to lock the drag to one axis, Option to drag out duplicates, and ⌘ (Ctrl) to skip snapping. Click empty space or press Escape to return to screen settings. Arrow keys move a selected asset by 1 pixel; Shift+Arrow moves it by 10 pixels. Delete or Backspace removes the selected asset, with Undo offered in the toast. Resizing preserves existing asset positions. **Fit** shows the whole screen; percentage zoom enables scrolling for larger screens.

Changing an asset's width or height keeps it centred on its current spot. Panels and windows always draw behind other assets, and titles and paragraphs draw on top. Titles and paragraphs are text-only assets with alignment, line height, word wrapping, outline, and shadow. **Export screen** saves a flattened PNG of the current screen at the chosen dimensions, with no handles or guides, and **Export all screens** saves one per screen. The **Export** tab's stretch preview shows how an asset will look at another size with its protected 9-slice border. Individual asset export remains available in **Designer**. Existing project files automatically receive the original 960 × 640 screen defaults.

## Unity

1. Export a ZIP pack and extract it beneath your Unity project's `Assets` folder.
2. Keep `UIMAssetImporter.cs` in an `Editor` folder.
3. Select `uim-manifest.json`, then choose **Tools → UIM Studio → Apply sprite settings**.
4. Assign the sprites to UI Images. Use **Sliced** for resizable backgrounds and **Sprite Swap** for button states.

The importer preserves transparent effect padding and applies sprite borders. Export without text and icons for stretchable backgrounds. Baked textures, gradients, and lighting may change appearance when stretched; use the screen preview and check your actual target size in Unity.

Pixels per unit is 100 times the export scale, so a 2× or 4× pack keeps the same size and border thickness on screen as 1×.

Kit exports share one PNG between assets that look identical (copies of a cell, a row of stars), so a screen with twenty-eight placements may ship far fewer files. The dialog picks the button states to render (all four, the three a phone can show, or the default only) and whether Unity imports the textures compressed, and it remembers its settings on this device. With **Bake text into images** off, the images carry no words and every asset's text travels in the manifest instead: titles and paragraphs become text objects, and buttons, badges and the rest get a child text label, matched to a TextMeshPro font asset by family name when one exists. Icons stay baked either way. The ZIP is named after the project, the screen and the time.

### Screen prefabs

A kit export carries every screen's layout in the manifest: each screen's name and size, and every placed asset's name, kind, file, position and size at 1×, in draw order (panels first, text last). Titles and paragraphs also carry their text, font size, colour, alignment, and line height. In Unity, select `uim-manifest.json` and choose **Tools → UIM Studio → Build screen prefabs**: one prefab per screen appears beside the manifest, one Image per asset at its exact position and size, sliced where borders exist, with a Button and Sprite Swap states where the asset had states, and titles and paragraphs as editable text objects (TextMeshPro when the package is installed, otherwise UI Text). Re-export under the same file names and existing prefabs keep their sprites.

Presets include **Mobile tall · 1080 × 2228** for a full-height phone board.

Animation ZIPs contain timing metadata and import instructions. Import sheets as Multiple sprites and slice using the cell size in `animation.json`. Animation clips and game behaviors are configured in Unity; the app does not generate game logic or automatically connect UI controls.

## Validation completed

- TypeScript compilation and production build.
- Browser checks for PNG dimensions, alpha transparency, state differences, valid PNG decoding inside ZIPs, sprite border bounds, frame counts, deterministic effects, loop continuity, and invalid project rejection.
- WebMCP valid update and invalid asset-ID rejection with state read-back.
- Unity 6000.5.8f1: importer compiled, then applied and verified on a synthetic fixture (sprite type, alpha handling, mipmaps, dimensions, and 9-slice border).

The reusable browser verification component is in `tests/browser-verification.tsx`; it can be temporarily mounted on a local development route. It is not part of the normal app routes. Screen-specific rendering and migration checks are in `tests/screen-verification.tsx`. Border placement, PNG padding, and compatibility checks are in `tests/border-verification.tsx`.

## Project structure

- `components/studio-app.tsx`: editor state, project actions, save/load, and browser tools.
- `components/design-inspector.tsx`: appearance controls.
- `components/effect-workspace.tsx`: animation preview and controls.
- `components/screen-inspector.tsx`, `components/scene-preview.tsx`: screen settings and arrangement.
- `lib/screen.ts`: shared screen preview/export renderer and screen presets.
- `lib/studio.ts`: shared image renderer.
- `lib/project.ts`: project validation and IndexedDB persistence.
- `lib/effects.ts`: deterministic animation renderer.
- `lib/exports.ts`, `lib/zip.ts`: export packs and ZIP creation.
- `public/UIMAssetImporter.cs`: Unity Editor helper.

The app uses React, TypeScript, Vinext/Vite, Canvas 2D, and the supplied UI primitives. The app is maintained locally. No online deployment is needed or planned.
