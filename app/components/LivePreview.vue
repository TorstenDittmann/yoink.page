<script setup lang="ts">
const props = defineProps<{
  id: string;
}>();

const previewUrl = computed(() => {
  return `/api/preview/${props.id}`;
});
</script>

<template>
  <div class="preview-container">
    <iframe
      :src="previewUrl"
      class="preview-iframe"
      sandbox="allow-scripts"
      title="Component Preview"
    />
  </div>
</template>

<style scoped>
.preview-container {
  width: 100%;
  height: 100%;
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.preview-iframe {
  width: 100%;
  height: 100%;
  border: none;
  flex: 1;
}
</style>
