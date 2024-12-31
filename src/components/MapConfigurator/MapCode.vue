<template>
  <pre class="d3-code" style="position: absolute; bottom: 40px; right: 0;border: 1px solid gray;padding:5px;margin:5px;border-radius: 4px;"
  >const projection = d3.get{{ config.projection }}()
  .scale({{ config.scale }})
  .translate([{{ config.translateX }},{{ config.translateY }}])
  .center([{{ config.centerLon }}, {{config.centerLat}}])
  .rotate([{{ config.rotateLambda }}, {{ config.rotatePhi }}, {{ config.rotateGamma }}]);</pre>
</template>

<script setup lang="ts">
  // @todo: Refactor for configured operations
  import { reactive } from 'vue';

  const props = defineProps({
    config: { type: Object, required: true }
  });
  const config = reactive(props.config);
</script>
