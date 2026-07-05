<template>
  <div class="map-configurator">
    <svg
      :width="config.viewWidth"
      :height="config.viewHeight"
      @wheel.prevent="onWheel"
      @mousedown="onMouseDown"
      @mousemove="onMouseMove"
      @mouseup="onMouseUp"
    >
      <g class="map">
        <path v-for="country in countries"
          :key="country.id ?? country.name"
          :d="country.path"
          :class="{ selected: country.id === selectedKey || country.name === selectedKey }"
          @click="onCountryClick(country)"
        >
          <title>{{ country.name }}</title>
        </path>
      </g>
      <path class="borders" :d="bordersPath" />
      <g class="circles">
        <path v-for="(circle) in circles"
          :d="circle?.path"
        ></path>
      </g>
      <g>
        <path :d="graticuleOutlinePath" fill="none" stroke-width="1.5" class="graticule-outline"/>
        <path :d="graticulePaths" fill="none" stroke-width="0.5" class="graticules"/>
      </g>
      <circle
        v-if="projectedCenter"
        class="projection-center"
        r="4"
        :cx="projectedCenter[0]"
        :cy="projectedCenter[1]"
      >
      </circle>
      <g class="cities" v-if="showCities">
        <template v-for="(city, index) in cityPoints" :key="index">
          <circle v-if="city.xy"
            class="city"
            r="3"
            :cx="city.xy[0]"
            :cy="city.xy[1]"
            @click.stop="onCityClick(city)"
          >
            <title>{{ city.name }}, {{ city.country }}</title>
          </circle>
        </template>
      </g>
    </svg>

    <div class="overlay-br">
      <div v-if="selectedCountry" class="info-box">
        <div class="info-row"><span class="info-label">Land:</span> {{ selectedCountry }}</div>
        <div v-if="selectedCity" class="info-row"><span class="info-label">Stadt:</span> {{ selectedCity }}</div>
      </div>
      <map-code :config="config"></map-code>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, watch, onMounted } from 'vue';
  import * as d3 from 'd3';
  import type { GeoPath } from "d3";
  import type { Feature, FeatureCollection } from "geojson";
  import { feature, mesh } from 'topojson-client';
  import type { Topology } from 'topojson-specification';
  import rawTopology from 'world-atlas/countries-110m.json';
  import MapCode from '@/components/MapConfigurator/MapCode.vue';
  import { makeProjection }  from './projections';
  import { circleCenters } from './circle-centers';
  import { cities, type City } from './cities';
  import type { ConfigurationInterface, ConfigurationLimitsInterface } from './interfaces';

  // Country geometry comes from world-atlas (Natural Earth, public domain) as
  // TopoJSON. feature() decodes the filled country polygons; mesh() derives the
  // interior borders as a single shared-arc path so each border is drawn once.
  const topology = rawTopology as unknown as Topology;
  // topojson-client and topojson-specification disagree on the generic
  // properties parameter; cast at this decode boundary rather than fight it.
  const countriesObj = topology.objects.countries as never;
  const world = feature(topology as never, countriesObj) as unknown as FeatureCollection;
  const bordersGeo = mesh(topology as never, countriesObj, (a, b) => a !== b);

  type CountryShape = { path: string; name: string; id: string | number | undefined };
  type CityPoint = { name: string; country: string; xy: [number, number] | null };

  // refactor this after it's clear how to build the calculation with
  // more or less specific projection parameters, method calls, defaults and limits
  const calcMap = (config: ConfigurationInterface): void => {
    const projection = makeProjection(config);

    // geoPath() ist eine generator function die geographische Koordinaten (lat, lon, wie sie z.B. in  GeoJSON
    // vorliegen) in einen SVG-Pfad umwandelt.
    // projection() wandelt diesen SVG Pfad auf die Pixel-Bildebene ab, je nach verwendeter
    // Projektionsvorschrift `projection`.
    const geoPathGenerator: GeoPath<any, d3.GeoPermissibleObjects> = d3
      .geoPath()
      .projection(projection);

    // Jedes feature im FeatureCollection wird in einen SVG-Pfad umgewandelt.
    // Name und id werden für Klick-Interaktion und Highlight mitgeführt.
    countries.value = world.features.map((feat: Feature) => ({
      path: geoPathGenerator(feat) || '',
      name: (feat.properties as { name?: string })?.name ?? '',
      id: feat.id,
    }));

    // Binnengrenzen als eine gemeinsame Linie (shared arcs) -> jede Grenze nur einmal.
    bordersPath.value = geoPathGenerator(bordersGeo as unknown as d3.GeoPermissibleObjects) || '';

    // d3.geoCircle() ist eine generator Funktion, die die sphärischen Koordinaten
    // von Kreisen erzeugt. Hier mit einem Radius 10° und einer Auflösung von 1,
    // damit der Kreis glatt erscheint
    const geoCircleGenerator: d3.GeoCircleGenerator = d3
      .geoCircle()
      .radius(10)
      .precision(1);

    // In circles sind 16 Kreismittelpunkte definiert, um die Verzerrungen der
    // Projektion anschaulich zu machen.
    // Es werden die SVG Pfade für jeden Kreis festgelegt
    // und die Generator-Funktion darauf angewendet:
    circles.value = circleCenters.map((center: [number, number]) => {
      geoCircleGenerator.center(center);
      return { path: geoPathGenerator(geoCircleGenerator()) as string };
    });

    // geoGraticule() ist eine Generator-Funktion,
    // die ein Standard-Gitternetz aus Längengraden (Meridianen, longitude) und Breitengraden (latitude) Pmit 10° Abstand beginnend bei 0°
    // und ) und Breiten und Längengrade (10°)
    const graticuleGenerator = d3
      .geoGraticule()
      .step([10, 10]);
    graticulePaths.value = geoPathGenerator(graticuleGenerator()) as string;
    graticuleOutlinePath.value = geoPathGenerator(graticuleGenerator.outline()) as string;

    // projectedCenter zeichnet ganz stumpf einen Kreis an den Koordinaten des
    // zentralen Meridian und Breitenkreises. Die Umrechnung von Koordinaten in die Bildebene
    // geschieht hier direkt mit der definierten Projektionsvorschrift.
    projectedCenter.value = projection([config.centerLon, config.centerLat]);

    // Städte auf dieselbe Projektion abbilden. null = außerhalb des Clip-Bereichs
    // (z.B. bei Composite-Projektionen) und wird beim Rendern ausgeblendet.
    cityPoints.value = cities.map((city: City) => ({
      name: city.name,
      country: city.country,
      xy: projection(city.coords) as [number, number] | null,
    }));
  }

  const projectedCenter = ref<[number, number] | null>(null)
  const countries = ref<CountryShape[]>([]);
  const bordersPath = ref<string>("");
  const circles = ref<{ path: string }[]>([]);
  const graticulePaths = ref<string>("");
  const graticuleOutlinePath = ref<string>("");
  const cityPoints = ref<CityPoint[]>([]);

  // Selection state, surfaced in the info box above the code panel.
  const selectedCountry = ref<string | null>(null);
  const selectedCity = ref<string | null>(null);
  const selectedKey = ref<string | number | null>(null);

  // Cities are an optional layer. There is no UI for it yet — toggle it from the
  // browser console via `mapconf.showCities = true` (reactive getter/setter).
  const showCities = ref(false);
  if (typeof window !== 'undefined') {
    const w = window as unknown as { mapconf?: Record<string, unknown> };
    w.mapconf = w.mapconf ?? {};
    Object.defineProperty(w.mapconf, 'showCities', {
      configurable: true,
      get: () => showCities.value,
      set: (value: unknown) => { showCities.value = Boolean(value); },
    });
  }

  const onCountryClick = (country: CountryShape) => {
    selectedKey.value = country.id ?? country.name;
    selectedCountry.value = country.name;
    selectedCity.value = null;
  };

  const onCityClick = (city: CityPoint) => {
    selectedCity.value = city.name;
    selectedCountry.value = city.country;
    selectedKey.value = city.country;
  };

  const props = defineProps({
    config: {type: Object, required: true},
    limits: { type: Object }
  });

  const emit = defineEmits<{
    (e: 'update:config', value: object): void;
  }>();

  const config = reactive(props.config);
  const limits: ConfigurationLimitsInterface = reactive({
    ...props?.limits as ConfigurationLimitsInterface ?? {}
  });

  watch(() => props.config, (newValue) => {
    config.value = newValue;
  });

  // When the projection changes, auto-fit it to the viewport. Every projection
  // has its own scale semantics (composite projections in particular expect
  // much larger scale values), so a single global default would leave most of
  // them tiny or clipped. We only derive scale/translate here; the resulting
  // config mutation drives the redraw below. Runs on change only, so the
  // curated initial view is preserved on first load.
  watch(() => config.projection, () => {
    const projection = makeProjection(config as ConfigurationInterface);
    const pad = 10;
    projection.fitExtent(
      [[pad, pad], [config.viewWidth - pad, config.viewHeight - pad]],
      world,
    );
    config.scale = Math.round(projection.scale());
    const [tx, ty] = projection.translate();
    config.translateX = Math.round(tx);
    config.translateY = Math.round(ty);
  });

  watch(config, (newValue) => {
    emit('update:config', newValue)
    calcMap(newValue as ConfigurationInterface);
  });

  // zoom
  const onWheel = (event: WheelEvent) => {
    const delta = event.deltaY > 0 ? 0.9 : 1.1;
    if (Math.ceil(config.scale * delta) < limits.minScale || config.scale * delta > limits.maxScale) {
      return;
    }
    config.scale = Math.ceil(config.scale * delta);
  };

  // {{{ translation X/Y with the mouse
  let isRotating = false;
  let lastMousePosition: [number, number] | null = null;

  const onMouseDown = (event: MouseEvent) => {
    isRotating = true;
    lastMousePosition = [event.clientX, event.clientY];
  };

  const onMouseMove = (event: MouseEvent) => {
    if (isRotating && lastMousePosition) {
      const deltaX = event.clientX - lastMousePosition[0];
      const deltaY = event.clientY - lastMousePosition[1];

      if (Math.ceil(config.translateX + deltaX) < limits.minTranslationX || Math.ceil(config.translateX + deltaX) > limits.maxTranslationX) {
        return;
      }
      if (Math.ceil(config.translateY + deltaY) < limits.minTranslationY || Math.ceil(config.translateY + deltaY) > limits.maxTranslationY) {
        return;
      }
      config.translateX = Math.ceil(config.translateX + deltaX);
      config.translateY = Math.ceil(config.translateY + deltaY);
      lastMousePosition = [event.clientX, event.clientY];
    }
  };

  const onMouseUp = () => {
    isRotating = false;
    lastMousePosition = null;
  };
  // }}}

  onMounted(() => {
    console.info('[mapconf] Städte einblenden: mapconf.showCities = true (bzw. false zum Ausblenden)');
    calcMap(config as ConfigurationInterface);
  });
</script>

<style lang="css" scoped>
  .map-configurator {
    position: relative;
  }

  svg {
    border: 1px dashed #666;
    border-radius: 0.5em;
  }

  /* Overlay stacked in the bottom-right corner: info box above the code box.
     The container ignores pointer events so it never blocks map interaction;
     its children re-enable them. */
  .overlay-br {
    position: absolute;
    bottom: 40px;
    right: 0;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 8px;
    pointer-events: none;
  }
  .overlay-br > * {
    pointer-events: auto;
  }
  .info-box {
    background: #fff;
    color: #222;
    border: 1px solid gray;
    border-radius: 4px;
    padding: 5px 8px;
    margin: 0 5px;
    font-size: 0.85rem;
  }
  .info-label {
    font-weight: bold;
  }

  /* Colour palette: Okabe–Ito, chosen to stay distinguishable under red-green
     colour-vision deficiency (no red/green pairing). */
  .map path {
    fill: #56B4E9;          /* sky blue land */
    fill-opacity: 0.5;
    stroke: none;
    cursor: pointer;
  }
  .map path:hover {
    fill-opacity: 0.7;
  }
  .map path.selected {
    fill: #F0E442;          /* yellow highlight */
    fill-opacity: 0.6;
    stroke: #000;
    stroke-width: 1.5;
  }

  .borders {
    fill: none;
    stroke: #0072B2;        /* blue country borders, drawn once via mesh */
    stroke-width: 0.6;
    pointer-events: none;
  }

  .projection-center {
    fill: #D55E00;          /* vermillion */
  }

  .graticule-outline {
    stroke: #E69F00;        /* orange sphere outline */
  }
  .graticules {
    stroke: #999;           /* neutral grid */
  }

  .circles path {
    fill: none;
    stroke: #666;
  }

  .cities .city {
    fill: #CC79A7;          /* reddish purple */
    stroke: #000;
    stroke-width: 0.5;
    cursor: pointer;
  }
</style>
