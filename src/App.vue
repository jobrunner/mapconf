<template>
  <v-app>
    <v-app-bar app color="#cf3000">
      <v-toolbar-title>Map Configurator</v-toolbar-title>
    </v-app-bar>
    <v-main>
      <div class="app-layout">
        <aside class="left-column">
          <v-navigation-drawer app permanent width="400">
            <map-settings
              v-model:config="config"
              :limits="limits"
            ></map-settings>
          </v-navigation-drawer>
        </aside>
        <div class="right-column">
          <div class="content">
            <map-configurator
              v-model:config="config"
              :limits="limits"
            ></map-configurator>
          </div>
          <v-footer app>
            <p>Footer-Inhalt</p>
          </v-footer>
        </div>
      </div>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
  import { ref, reactive } from 'vue';
  import MapSettings from "@/components/MapConfigurator/MapSettings.vue"
  import MapConfigurator from '@/components/MapConfigurator/MapConfigurator.vue';
  import type { ConfigurationInterface, ConfigurationLimitsInterface } from '@/components/MapConfigurator/interfaces';

  // @todo ConfigurationInterface and ConfigurationLimitsInterface must be refactored along the
  //       requirements of the d3 geo projection and d3 geo composition projections packages...


  const config = ref<ConfigurationInterface>({
    projection: 'AzimuthalEqualArea',
    // in projections definiert
    centerLat: 49,
    centerLon: 13,
    rotateLambda: 0,
    rotatePhi: 0,
    rotateGamma: 0,
    translateX: 480,
    translateY: 250,
    scale: 120,
    viewWidth: 960,
    viewHeight: 500,
    parallel: 0
  });

  const limits: ConfigurationLimitsInterface = {
    minCenterLat: -180,
    maxCenterLat: 180,
    stepCenterLat: 1,

    minCenterLon: -90,
    maxCenterLon: 90,
    stepCenterLon: 1,

    minRotateLambda: -180,
    maxRotateLambda: 180,
    stepRotateLambda: 1,

    minRotatePhi: -180,
    maxRotatePhi: 180,
    stepRotatePhi: 1,

    minRotateGamma: -180,
    maxRotateGamma: 180,
    stepRotateGamma: 1,

    minTranslationX: -3000,
    maxTranslationX: 3000,
    stepTranslationX: 1,

    minTranslationY: -3000,
    maxTranslationY: 3000,
    stepTranslationY: 1,

    minScale: 1,
    maxScale: 6000,
    stepScale: 1,

    minViewWidth: 1,
    maxViewWidth: 1200,
    stepViewWidth: 1,

    minViewHeight: 1,
    maxViewHeight: 1200,
    stepViewHeight: 1
  }
</script>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: row;
  height: 100%;
}

.left-column {
  flex-shrink: 0;
}

.right-column {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  min-width: 300px;
  overflow-x: auto;
}

.content {
  flex-grow: 1;
  padding: 16px;
  overflow-y: auto;
}

v-footer {
  flex-shrink: 0;
  padding: 8px;
  text-align: center;
  background-color: #f5f5f5;
}
</style>
