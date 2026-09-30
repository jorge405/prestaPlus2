<template>
  <label class="block">
    <span v-if="label" class="text-sm font-medium text-slate-700 mb-1.5 block">{{ label }}</span>
    <input
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      @input="$emit('update:modelValue', $event.target.value)"
      class="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-100 outline-none transition-all placeholder:text-slate-400"
    />
  </label>
</template>
<script setup>
defineProps({
  modelValue: [String, Number],
  label: String,
  type: { type: String, default: 'text' },
  placeholder: String,
});
defineEmits(['update:modelValue']);
</script>