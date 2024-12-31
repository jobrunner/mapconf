<template>
  <svg
    :width="config.viewWidth"
    :height="config.viewHeight"
    @wheel.prevent="onWheel"
    @mousedown="onMouseDown"
    @mousemove="onMouseMove"
    @mouseup="onMouseUp"
  >
    <g class="map">
      <path v-for="(country, index) in countries"
        :key="index"
        :d="country.path"
      />
    </g>
    <g class="circles">
      <path v-for="(circle) in circles"
        :d="circle?.path"
      ></path>
    </g>
    <circle
      class="projection-center"
      r="4"
      :cx="projectedCenter[0]"
      :cy="projectedCenter[1]"
    >
    </circle>
    <g>
      <path :d="graticuleOutlinePath" fill="none" stroke="red" stroke-width="2" class="graticule-outline"/>
      <path :d="graticulePaths" fill="none" stroke="#ccc" stroke-width="0.5"  class="graticules"/>
    </g>
  </svg>
  <map-code
    :config="config"
  ></map-code>
</template>

<script setup lang="ts">
  import { ref, reactive, watch, onMounted } from 'vue';
  import * as d3 from 'd3';
  import type { GeoPath } from "d3";
  import type { GeoJSON, FeatureCollection } from "geojson";
  import MapCode from '@/components/MapConfigurator/MapCode.vue';
  import { makeProjection }  from './projections';
  import { circleCenters } from './circle-centers';
  import type { ConfigurationInterface, ConfigurationLimitsInterface } from './interfaces';

  const loadGeoJson = async () => {
    const geojson = await d3.json('https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson');
    return geojson;
  }

  // refactor this after it's clear how to build the calculation with
  // more or less specific projection parameters, method calls, defaults and limits
  const calcMap = async (config: ConfigurationInterface, geojson: GeoJSON): Promise<void> => {
    const projection = makeProjection(config);

    // geoPath() ist eine generator function die geographische Koordinaten (lat, lon, wie sie z.B. in  GeoJSON
    // vorliegen) in einen SVG-Pfad umwandelt.
    // projection() wandelt diesen SVG Pfad auf die Pixel-Bildebene ab, je nach verwendeter
    // Projektionsvorschrift `projection`.
    const geoPathGenerator: GeoPath<any, d3.GeoPermissibleObjects> = d3
      .geoPath()
      .projection(projection);

    // Jedes feature property im GeoJSON object wird in einen SVG-Pfad
    // der auf die Pixel-Ebene umgewandelt
    countries.value = (geojson as FeatureCollection).features.map((feature) => ({
      path: geoPathGenerator(feature) || '',
    }));

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
  }

  let geojson: any;

  const projectedCenter = ref<string[]>([])
  const countries = ref<{ path: string }[]>([]);
  const circles = ref<{ path: string }[]>([]);
  const graticulePaths = ref<string>("");
  const graticuleOutlinePath = ref<string>("");

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
    console.log('config changed. Must redraw map');
    config.value = newValue;
  });

  watch(config, (newValue) => {
    emit('update:config', newValue)
    calcMap(newValue as ConfigurationInterface, geojson);
  });

  // zoom
  const onWheel = (event: WheelEvent) => {
    const delta = event.deltaY > 0 ? 0.9 : 1.1;
    if (Math.ceil(config.scale * delta) < limits.minScale || config.scale * delta > limits.maxScale) {
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

  onMounted(async () => {
    geojson = await loadGeoJson()
    await calcMap(config as ConfigurationInterface, geojson);
  });
</script>

<style lang="css" scoped>
  svg {
    border: 1px dashed #666;
    border-radius: 0.5em;
  }
  .container-map {
    border: 1px dashed #666;
    border-radius: 0.5em;
    width: 500px;
    height: 500px;
  }

  .map path {
    fill: #87B687;
    stroke: #ccc;
    stroke-width: 0.5;
    fill-opacity: 0.75;
  }

  .projection-center {
    fill: red;
  }

  .graticule path {
    fill: none;
    /* stroke: #eee; */
    stroke: red;
    stroke-width: 2px;
  }

  .circles path {
    fill: none;
    stroke: #aaa;
  }
</style>
