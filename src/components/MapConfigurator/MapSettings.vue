<template>
  <v-card>
    <v-card-text>
      Abbildung auf die Ebene.
    </v-card-text>

    <v-card-subtitle>
      Projektion
    </v-card-subtitle>
    <v-card-text>
      <v-select
        label="Projektion"
        :items="projectionDescriptors"
        item-title="id"
        item-value="id"
        v-model="config.projection"
        density="compact"
        variant="outlined"
      ></v-select>
    </v-card-text>

    <v-card-subtitle>
      Zentraler Meridian und Breitenkreis
    </v-card-subtitle>

    <v-card-text>
      <v-slider
        v-model="config.centerLon"
        :min="limits.minCenterLon"
        :max="limits.maxCenterLon"
        :step="limits.stepCenterLon"
        value="0"
        label="Länge [°]"
        hide-details
        thumb-label
      >
        <template v-slot:append>
          <v-number-input
            v-model="config.centerLon"
            :min="limits.minCenterLon"
            :max="limits.maxCenterLon"
            :step="limits.stepCenterLon"
            :reverse="false"
            controlVariant="stacked"
            label=""
            :hideInput="false"
            :inset="false"
            variant="outlined"
            density="compact"
            class="number-input"
            hide-details
          ></v-number-input>
        </template>
      </v-slider>

      <v-slider
        v-model="config.centerLat"
        :min="limits.minCenterLat"
        :max="limits.maxCenterLat"
        :step="limits.stepCenterLat"
        label="Breite [°]"
        hide-details
      >
        <template v-slot:append>
          <v-number-input
            v-model="config.centerLat"
            :min="limits.minCenterLat"
            :max="limits.maxCenterLat"
            :step="limits.stepCenterLat"
            :reverse="false"
            controlVariant="stacked"
            label=""
            :hideInput="false"
            :inset="false"
            variant="outlined"
            density="compact"
            class="number-input"
            hide-details
          ></v-number-input>
        </template>
      </v-slider>
    </v-card-text>


    <v-card-subtitle>
      Parallel
    </v-card-subtitle>
    <v-card-text>
      <v-slider
        v-model="config.parallel"
        :min="-90"
        :max="90"
        :step="1"
        value="0"
        label="Parallel [°]"
        hide-details
      >
        <template v-slot:append>
          <v-number-input
            v-model="config.parallel"
            :min="-90"
            :max="90"
            :step="1"
            :reverse="false"
            controlVariant="stacked"
            label=""
            :hideInput="false"
            :inset="false"
            variant="outlined"
            density="compact"
            class="number-input"
            hide-details
        ></v-number-input>
        </template>
      </v-slider>
    </v-card-text>



    <!-- {{{ rotation component -->
    <v-card-subtitle>
      Rotation
    </v-card-subtitle>

    <v-card-subtitle>
      <small class="pull-right">Siehe auch <a href="https://de.wikipedia.org/wiki/Eulersche_Winkel">Euler'sche Winkel</a></small>
    </v-card-subtitle>

    <v-card-text>
      <v-slider
        v-model="config.rotateLambda"
        :min="limits.minRotateLambda"
        :max="limits.maxRotateLambda"
        :step="limits.stepRotateLambda"
        value="0"
        label="Lambda, &lambda; [°]"
        hide-details
      >
        <template v-slot:append>
          <v-number-input
            v-model="config.rotateLambda"
            :min="limits.minRotateLambda"
            :max="limits.maxRotateLambda"
            :step="limits.stepRotateLambda"
            :reverse="false"
            controlVariant="stacked"
            label=""
            :hideInput="false"
            :inset="false"
            variant="outlined"
            density="compact"
            class="number-input"
            hide-details
        ></v-number-input>
        </template>
      </v-slider>

      <v-slider
        v-model="config.rotatePhi"
        :min="limits.minRotatePhi"
        :max="limits.maxRotatePhi"
        :step="limits.stepRotatePhi"
        label="Phi, &phi; [°]"
        hide-details
      >
        <template v-slot:append>
          <v-number-input
            v-model="config.rotatePhi"
            :min="limits.minRotatePhi"
            :max="limits.maxRotatePhi"
            :step="limits.stepRotatePhi"
            :reverse="false"
            controlVariant="stacked"
            label=""
            :hideInput="false"
            :inset="false"
            variant="outlined"
            density="compact"
            class="number-input"
            hide-details
          ></v-number-input>
        </template>
      </v-slider>

      <v-slider
        v-model="config.rotateGamma"
        :min="limits.minRotateGamma"
        :max="limits.maxRotateGamma"
        :step="limits.stepRotateGamma"
        label="Gamma, &gamma; [°]"
        hide-details
      >
        <template v-slot:append>
          <v-number-input
            v-model="config.rotateGamma"
            :min="limits.minRotateGamma"
            :max="limits.maxRotateGamma"
            :step="limits.stepRotateGamma"
            :reverse="false"
            controlVariant="stacked"
            label=""
            :hideInput="false"
            :inset="false"
            variant="outlined"
            density="compact"
            class="number-input"
            hide-details
          ></v-number-input>
        </template>
      </v-slider>
    </v-card-text>
    <!-- rotation component }}} -->

  </v-card>

  <v-card>
    <v-card-text>
    Verschiebung, Skalierung<br/>und Ausschnitt der projezierten Ebene.
    </v-card-text>

    <v-card-subtitle>
      <strong>Translation</strong><br/>
      <small>Verschiebung innerhalb des View-Ports.</small>
    </v-card-subtitle>

    <v-card-text>
      <v-slider
        v-model="config.translateX"
        :min="limits.minTranslationX"
        :max="limits.maxTranslationX"
        :step="limits.stepTranslationX"
        label="X-Richtung [px]"
        hide-details
        >
        <template v-slot:append>
          <v-number-input
            v-model="config.translateX"
            :min="limits.minTranslationX"
            :max="limits.maxTranslationX"
            :step="limits.stepTranslationX"
            :reverse="false"
            controlVariant="stacked"
            label=""
            :hideInput="false"
            :inset="false"
            variant="outlined"
            density="compact"
            class="number-input"
            hide-details
          ></v-number-input>
        </template>
      </v-slider>

      <v-slider
        v-model="config.translateY"
        :min="limits.minTranslationY"
        :max="limits.maxTranslationY"
        :step="limits.stepTranslationY"
        label="Y-Richtung [px]"
        hide-details
      >
        <template v-slot:append>
          <v-number-input
            v-model="config.translateY"
            :min="limits.minTranslationY"
            :max="limits.maxTranslationY"
            :step="limits.stepTranslationY"
            :reverse="false"
            controlVariant="stacked"
            label=""
            :hideInput="false"
            :inset="false"
            variant="outlined"
            density="compact"
            class="number-input"
            hide-details
          ></v-number-input>
        </template>
      </v-slider>

      <v-slider
        v-model="config.scale"
        :min="limits.minScale"
        :max="limits.maxScale"
        :step="limits.stepScale"
        label="Skalierung"
        hide-details
      >
        <template v-slot:append>
          <v-number-input
            v-model="config.scale"
            :min="limits.minScale"
            :max="limits.maxScale"
            :step="limits.stepScale"
            :reverse="false"
            controlVariant="stacked"
            label=""
            :hideInput="false"
            :inset="false"
            variant="outlined"
            density="compact"
            class="number-input"
            hide-details
          ></v-number-input>
        </template>
      </v-slider>
    </v-card-text>

    <v-card-subtitle>
      <strong>Viewport</strong><br/>
      <small>
        Legt die Außmaße des finalen Ausschnittes fest.
      </small>
    </v-card-subtitle>

    <v-card-text>
      <v-slider
        v-model="config.viewWidth"
        :min="limits.minViewWidth"
        :max="limits.maxViewWidth"
        :step="limits.stepViewWidth"
        label="Breite [px]"
        hide-details
      >
        <template v-slot:append>
          <v-number-input
            v-model="config.viewWidth"
            :min="limits.minViewWidth"
            :max="limits.maxViewWidth"
            :step="limits.stepViewWidth"
            :reverse="false"
            controlVariant="stacked"
            label=""
            :hideInput="false"
            :inset="false"
            variant="outlined"
            density="compact"
            class="number-input"
            hide-details
          ></v-number-input>
        </template>
      </v-slider>

      <v-slider
        v-model="config.viewHeight"
        :min="limits.minViewHeight"
        :max="limits.maxViewHeight"
        :step="limits.stepViewHeight"
        label="Höhe [px]"
        hide-details
      >
        <template v-slot:append>
          <v-number-input
            v-model="config.viewHeight"
            :min="limits.minViewHeight"
            :max="limits.maxViewHeight"
            :step="limits.stepViewHeight"
            :reverse="false"
            controlVariant="stacked"
            label=""
            :hideInput="false"
            :inset="false"
            variant="outlined"
            density="compact"
            class="number-input"
            hide-details
          ></v-number-input>
        </template>
      </v-slider>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
  import { reactive, watch } from 'vue';
  import { projectionDescriptors } from './projections';
  import { VNumberInput } from 'vuetify/labs/VNumberInput'
  import type { ConfigurationLimitsInterface } from './interfaces';

  const props = defineProps({
    config: { type: Object, required: true },
    limits: { type: Object, required: true },
  });

  const emit = defineEmits<{
    (e: 'update:config', value: object): void;
  }>();

  const config = reactive(props.config);
  const limits: ConfigurationLimitsInterface = reactive(props.limits as ConfigurationLimitsInterface);

  watch(() => props.config, (newValue) => {
    config.value = newValue;
  });

  watch(config, (newValue) => emit('update:config', newValue));
</script>

<style lang="css">
  .v-slider__label {
    min-width: 65px;
  }
</style>
<style lang="css" scoped>
.number-input {
  width: 100px;
}
</style>
