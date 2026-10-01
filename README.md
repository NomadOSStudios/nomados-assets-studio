# UIM Studio

A personal, browser-based game UI asset designer. Create buttons, panels, slots, progress bars, and animated effects, then export transparent assets for Unity.

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
- Editable dimensions, individual corner radii, gradients, borders, embossed/engraved/raised surfaces, shadows, and glows.
- Numeric controls support sliders, exact typing, and wheel adjustment while hovering over the value. Scroll up to increase and down to decrease; hold Shift for ten times the step.
- Border color, thickness, and Inside / Center / Outside placement. Outside borders receive extra PNG padding when needed; existing projects keep their inside borders.
- Six starting styles, saved custom styles, and explicit updates to assets linked to a saved style.
- Default, hover, pressed, and disabled state previews.
- Text, system fonts, built-in icons, uploaded icons, and image textures.
- Undo/redo, asset creation/duplication/removal, and a draggable screen builder.
- Custom screen dimensions (64–4096 px), common resolution presets, orientation swap, fit/zoom, and precise asset coordinates.
- Solid, gradient, transparent, or uploaded image backgrounds, saved with the project.
- Whole-screen PNG export at the exact chosen resolution, without editor guides.
- Device-local autosave in IndexedDB and portable `.uim.json` files, including imported image data.
- Transparent PNGs at 1×, 2×, and 4×. ZIP packs include button states, a manifest, and a Unity sprite importer.
- Confetti, sparkles, and seamless floating backgrounds, with deterministic playback and PNG frame or sprite-sheet exports.
- Optional browser WebMCP tools to read the project and update existing assets.

## Saving

Use the project menu beside the logo to save or open a project file. Browser saves belong to the current browser and site origin. They do not sync between devices or browser profiles. Download a project file for backups or transfers. If storage is unavailable, the editor keeps the current work in memory and displays a save error.

## Build a screen

Open **Screen builder**, then use the **Screen** tab in the right inspector to name the screen, set its width and height, choose a resolution preset, or change the background. Background images support fill/crop, fit inside, and stretch.

Click an asset to drag it or edit its **Asset** properties, including X/Y coordinates and **Center on screen**. Click empty space to return to screen settings. Arrow keys move a selected asset by 1 pixel; Shift+Arrow moves it by 10 pixels. Resizing preserves existing asset positions. **Fit** shows the whole screen; percentage zoom enables scrolling for larger screens.

**Export screen** saves a flattened PNG at the chosen dimensions, with no handles or guides. Individual asset export remains available in **Designer**. Existing project files automatically receive the original 960 × 640 screen defaults.

## Unity

1. Export a ZIP pack and extract it beneath your Unity project's `Assets` folder.
2. Keep `UIMAssetImporter.cs` in an `Editor` folder.
3. Select `uim-manifest.json`, then choose **Tools → UIM Studio → Apply sprite settings**.
4. Assign the sprites to UI Images. Use **Sliced** for resizable backgrounds and **Sprite Swap** for button states.

The importer preserves transparent effect padding and applies sprite borders. Export without text and icons for stretchable backgrounds. Baked textures, gradients, and lighting may change appearance when stretched; use the screen preview and check your actual target size in Unity.

Pixels per unit is 100 times the export scale, so a 2× or 4× pack keeps the same size and border thickness on screen as 1×.

### Screen prefab

A kit export carries the Screen builder layout in the manifest: the screen's name and size, and every placed asset's name, kind, file, position and size at 1×, in draw order (panels first). In Unity, select `uim-manifest.json` and choose **Tools → UIM Studio → Build screen prefab**: a prefab named after the screen appears beside the manifest, one Image per asset at its exact position and size, sliced where borders exist, with a Button and Sprite Swap states where the asset had states. Re-export under the same file names and existing prefabs keep their sprites.

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
