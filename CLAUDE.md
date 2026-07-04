# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

An interactive web tool for exploring D3 geographic map projections. The user picks a
projection and adjusts its parameters (center, rotation, scale, translation, viewport)
via a control panel; a live SVG world map re-renders on every change and a code snippet
shows the equivalent D3 projection call.

Note: `README.md` is the unmodified Vuetify scaffolding README and describes features that
are **not** in this project (Pinia, Vue Router, vite-plugin-vue-layouts). Ignore it as a
source of truth about the actual codebase.

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
  `scale` (both clamped against `limits`).

Data flow is: `App` state → both children → user edits either the panel or the canvas →
`update:config` bubbles back up → `config` mutates → `MapConfigurator` redraws.

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

**To add a projection:** append a `ProjectionDescriptor` to `projectionDescriptors` with the
correct `lib`. If it needs extra parameters beyond the standard four, declare them under
`ops` (and surface a matching control in `MapSettings.vue` + field in `ConfigurationInterface`).
The long commented block at the bottom of `projections.ts` lists candidate projections and
their special parameters.

`MapConfigurator.vue`'s `calcMap()` uses the resulting projection with `d3.geoPath()` to
render four SVG layers: country outlines (GeoJSON fetched at runtime from a remote GitHub
URL), 16 distortion-indicator circles (`circle-centers.ts`), a graticule grid, and a
projected-center marker.

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
