<script setup lang="ts">
import storeConfig from "@/stores/config";
import { storeToRefs } from "pinia";

const props = withDefaults(
  defineProps<{ slug: string; size?: number; rounded?: number }>(),
  { size: 40, rounded: 0 }
);
const configStore = storeConfig();
const { config } = storeToRefs(configStore);
</script>

<template>
  <v-avatar :size="size" :rounded="rounded">
    <v-img
      :src="`/assets/platforms/${
        config.PLATFORMS_VERSIONS?.[props.slug]?.toLowerCase() ??
        props.slug.toLowerCase()
      }.ico`"
      ><template #error
        ><v-img src="/assets/platforms/default.ico"></v-img></template
    ></v-img>
  </v-avatar>
</template>
