<template>
  <div class="flex items-center justify-between border border-slate-100 rounded-2xl p-3">
    <div>
      <p class="font-semibold text-slate-800 text-sm">{{ title }}</p>
      <p class="text-xs text-slate-500">{{ subtitle }}</p>
    </div>
    <div class="flex gap-2">
      <button
        @click="$emit('export')"
        class="text-xs bg-brand-600 text-white px-3 py-1.5 rounded-xl font-semibold"
      >
        PDF
      </button>
    </div>
  </div>
</template>
<script setup>
defineProps(['title', 'subtitle']);
defineEmits(['export']);
</script>