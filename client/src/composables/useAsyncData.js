import { onMounted, ref } from "vue";

export function useAsyncData(loader) {
  const data = ref(null);
  const loading = ref(true);
  const error = ref("");

  async function load() {
    loading.value = true;
    error.value = "";

    try {
      data.value = await loader();
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Unknown error";
    } finally {
      loading.value = false;
    }
  }

  onMounted(load);

  return { data, loading, error, reload: load };
}
