<template>
  <button
    :class="[
      'w-full py-3.5 rounded-2xl font-semibold transition-all active:scale-[0.98] shadow-sm',
      variant === 'primary' ? 'bg-brand-600 hover:bg-brand-700 text-white shadow-card'
      : variant === 'soft'   ? 'bg-brand-50 hover:bg-brand-100 text-brand-700'
      : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200',
      disabled && 'opacity-50 pointer-events-none',
    ]"
    :disabled="disabled"
    v-bind="$attrs"
  >
    <slot />
  </button>
</template>
<script setup>
defineProps({ variant: { type: String, default: 'primary' }, disabled: Boolean });
</script>