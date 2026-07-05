# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

An interactive web tool for exploring D3 geographic map projections. The user picks a
projection and adjusts its parameters (center, rotation, scale, translation, viewport)
via a control panel; a live SVG world map re-renders on every change and a code snippet
shows the equivalent D3 projection call. Countries are clickable, and an optional cities
layer can be toggled from the console.

## Commands

```bash
npm run dev          # Vite dev server at http://localhost:3000
npm run build        # type-check (vue-tsc) + production build
npm run type-check   # vue-tsc --build --force (standalone type check)
npm run preview      # preview the production build
```

There is no test runner and no linter script configured.

## Architecture

The whole app lives under `src/components/MapConfigurator/`. `App.vue` owns the single
source of truth: a `config` ref (current projection parameters) and a static `limits`
object (slider min/max/step bounds). Both are passed down to two sibling components with
`v-model:config` two-way binding:

- **`MapSettings.vue`** — the left-drawer control panel (Vuetify sliders + number inputs).
  Mutates `config`; emits `update:config`.
- **`MapConfigurator.vue`** — the SVG map. Watches `config` and recomputes all SVG paths on
  any change. Also handles direct canvas interaction: mouse-drag → `translateX/Y`, wheel →
  `scale` (both clamped against `limits`), and click-to-select on countries/cities.

Data flow is: `App` state → both children → user edits either the panel or the canvas →
`update:config` bubbles back up → `config` mutates → `MapConfigurator` redraws.

`App.vue` also renders the footer copyright: the owner is read from `package.json`'s
`author` and injected at build time as `__APP_AUTHOR__` via a Vite `define` (see
`vite.config.mts`; declared in `globals.d.ts`), so `package.json` is not bundled into the
client.

### The projection engine (`projections.ts`)

This is the core abstraction and the file to understand first. `makeProjection(config)`
builds a configured D3 projection by:

1. Looking up a `ProjectionDescriptor` by `config.projection` id in `projectionDescriptors`.
2. Resolving which of three D3 libraries provides it via the `lib` field: `d3geo`
   (`d3-geo`), `d3gp` (`d3-geo-projection`), or `d3cp` (`d3-composite-projections`). The D3
   factory is found by convention as `geo<Id>` (e.g. id `Mercator` → `geoMercator`).
3. Merging `standardOperations` (center/scale/rotate/translate, applied to every projection)
   with the descriptor's projection-specific `ops` (e.g. `parallel`, `lobes`, `alpha`). Each
   operation maps `config` fields to positional arguments, falling back to per-param
   `default` values. Setting an op to `null` in a descriptor omits it from the call chain.

`resolveOperations(id)` computes that merged, non-`null` operation list and is the **single
source of truth** for what a projection supports. Three consumers derive from it:
- `makeProjection` — applies the operations to build the projection.
- `getSupportedConfigKeys(id)` — the set of `config` fields a projection uses; `MapSettings.vue`
  disables controls for parameters the current projection doesn't support.
- `buildProjectionCode(config)` — the live `d3.geo…()` snippet in `MapCode.vue`, listing only
  supported methods.

So the descriptor drives the projection, the enabled controls, and the code snippet in lockstep.

**To add a projection:** append a `ProjectionDescriptor` to `projectionDescriptors` with the
correct `lib`. If it needs extra parameters beyond the standard four, declare them under
`ops` (and surface a matching control in `MapSettings.vue` + field in `ConfigurationInterface`);
if it does *not* support some standard operation (composite projections lack `center`/`rotate`),
set that op to `null`. Controls and code snippet update automatically. The long commented block
at the bottom of `projections.ts` lists candidate projections and their special parameters.

On projection change, `MapConfigurator.vue` auto-fits via `projection.fitExtent(...)` and
writes the derived `scale`/`translate` back into `config`, so each projection (which have very
different scale semantics — composite ones especially) starts sensibly sized. This runs on
change only; the curated initial view is preserved on first load.

### Map rendering & data (`MapConfigurator.vue`)

Country geometry is bundled from **`world-atlas`** (Natural Earth, public domain) as TopoJSON
and decoded with **`topojson-client`** — no runtime network fetch (works offline). `calcMap()`
uses `d3.geoPath()` to render, as separate SVG layers:
- **country fills** — `feature(topo, objects.countries)`, one interactive `<path>` per country
  (carries `name`/`id` for click + highlight);
- **borders** — `mesh(...)` as one shared-arc path, drawn once, `pointer-events: none`;
- 16 **distortion circles** (`circle-centers.ts`), a **graticule** grid + sphere outline, the
  **projected-center** marker, and an optional **cities** layer.

Interaction state (`selectedCountry`, `selectedCity`) is shown in an info box stacked above the
`MapCode` panel (bottom-right overlay). Clicking a country sets the country; clicking a city
sets both city and its country.

**Cities** come from `cities.ts` (generated from Natural Earth populated places; do not hand-edit).
The layer is off by default and has no UI yet — toggle it from the browser console via
`mapconf.showCities = true` / `false` (a reactive getter/setter on `window`).

Colours use the **Okabe–Ito** palette (no red/green pairing) so the map stays legible under
red-green colour-vision deficiency.

### Types

`interfaces.ts` defines `ConfigurationInterface` (the live parameter object; has an index
signature so arbitrary projection params can be attached) and `ConfigurationLimitsInterface`
(slider bounds). Both are flagged in-code as needing refactoring to better match the D3
projection APIs — expect churn here.

## Conventions

- Vue 3 `<script setup lang="ts">` throughout; Vuetify 3 for all UI.
- Components auto-import via `unplugin-vue-components` (see `components.d.ts`); Vuetify's
  `VNumberInput` is still a labs component and is imported explicitly.
- `@/` path alias → `src/`.
- Inline comments and UI strings are in German.
