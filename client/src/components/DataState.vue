<script setup>
defineProps({
  loading: Boolean,
  error: {
    type: String,
    default: ""
  }
});
</script>

<template>
  <div v-if="loading" class="state-card">Loading 动次 data...</div>
  <div v-else-if="error" class="state-card error">{{ error }}</div>
  <slot v-else />
</template>
