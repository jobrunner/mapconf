<template>
  <pre class="d3-code" style="position: absolute; bottom: 40px; right: 0;border: 1px solid gray;padding:5px;margin:5px;border-radius: 4px;">{{ code }}</pre>
</template>

<script setup lang="ts">
  import { computed, reactive } from 'vue';
  import { buildProjectionCode } from './projections';
  import type { ConfigurationInterface } from './interfaces';

  const props = defineProps({
    config: { type: Object, required: true }
  });
  const config = reactive(props.config);

  // Only the methods the selected projection supports are shown; the operation
  // list is derived from the projection descriptor in projections.ts.
  const code = computed(() => buildProjectionCode(config as ConfigurationInterface));
</script>
