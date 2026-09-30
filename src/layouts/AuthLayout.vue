<template>
  <div class="min-h-screen bg-brand-soft flex flex-col">
    <div class="bg-brand-gradient text-white pt-12 pb-20 px-6 rounded-b-[2.5rem] shadow-card">
      <div class="max-w-md mx-auto">
        <div class="text-4xl mb-2">💰</div>
        <h1 class="text-2xl font-extrabold">Presta+</h1>
        <p class="text-brand-50 text-sm mt-1">{{ subtitulo }}</p>
      </div>
    </div>
    <div class="flex-1 -mt-12 px-6 pb-8">
      <div class="max-w-md mx-auto">
        <slot />
      </div>
    </div>
  </div>
</template>
<script setup>
defineProps({ subtitulo: String });
</script>