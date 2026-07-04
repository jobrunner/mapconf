# mapconf — Map Projection Configurator

An interactive web tool for exploring [D3](https://d3js.org/) geographic map
projections. Pick a projection, adjust its parameters, and watch a world map
re-render live — alongside the equivalent D3 code snippet.

## What it does

- Renders a world map as SVG for a selectable projection.
- Lets you tune the projection interactively:
  - **central meridian & parallel** (`center`)
  - **rotation** as Euler angles λ / φ / γ (`rotate`)
  - **translation**, **scale**, and **viewport** size
  - projection-specific parameters such as **parallel** (for cylindrical
    equal-area)
- Overlays that make distortion visible: a graticule (10° grid), a set of
  distortion-indicator circles, and a marker at the projected center.
- **Pan & zoom directly on the map** — drag to translate, scroll to zoom.
- Shows a **live D3 code snippet** for the current configuration.

Each projection only exposes the controls (and code methods) it actually
supports, and switching projection **auto-fits** the map to the viewport so
every projection starts at a sensible size.

### Projections

Projections are pulled from three libraries and listed in a single registry
(`src/components/MapConfigurator/projections.ts`):

- [`d3-geo`](https://github.com/d3/d3-geo) — Mercator, Orthographic, Albers,
  the conic family, and more
- [`d3-geo-projection`](https://github.com/d3/d3-geo-projection) — extended
  projections such as Cylindrical Equal-Area, Baker, Airy
- [`d3-composite-projections`](https://github.com/rveciana/d3-composite-projections)
  — composite projections such as Conic Conformal France

## Tech stack

Vue 3 (`<script setup>`) · Vuetify 3 · TypeScript · D3 · Vite.

## Getting started

Requires Node.js and npm.

```bash
npm install
npm run dev        # dev server with hot reload at http://localhost:3000
```

### Scripts

| Command              | Description                                     |
| -------------------- | ----------------------------------------------- |
| `npm run dev`        | Start the Vite dev server (port 3000)           |
| `npm run build`      | Type-check (`vue-tsc`) and build for production |
| `npm run preview`    | Preview the production build                    |
| `npm run type-check` | Run the TypeScript/Vue type check only          |

## Project layout

```
src/
├── App.vue                              # holds the config + limits, wires the two panels
└── components/MapConfigurator/
    ├── MapConfigurator.vue              # the SVG map; pan/zoom; redraws on config change
    ├── MapSettings.vue                  # the control panel (sliders + number inputs)
    ├── MapCode.vue                      # the live D3 code snippet
    ├── projections.ts                   # projection registry + operation resolution
    ├── interfaces.ts                    # config / limits types
    └── circle-centers.ts                # centers of the distortion circles
```

The map geometry (world countries) is fetched at runtime as GeoJSON, so an
internet connection is required on load.

### Adding a projection

Append a descriptor to `projectionDescriptors` in `projections.ts` with the id
(the D3 factory is resolved by convention as `geo<Id>`) and its source library
(`d3geo`, `d3gp`, or `d3cp`). If the projection needs parameters beyond the
standard center/scale/rotate/translate — or does *not* support some of them —
declare that under `ops` (set an operation to `null` to disable it). The
control panel and code snippet update automatically from this descriptor.

## License

[MIT](http://opensource.org/licenses/MIT)
