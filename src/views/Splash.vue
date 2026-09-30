<template>
  <div class="min-h-screen bg-brand-gradient flex flex-col items-center justify-center text-white px-8">
    <div class="text-6xl mb-4">💰</div>
    <h1 class="text-3xl font-extrabold">Presta+</h1>
    <p class="text-brand-50 mt-2 mb-16">Tu dinero, seguro y simple</p>

    <div class="w-full max-w-sm space-y-3">
      <AppButton @click="$router.push('/login')">Iniciar sesión</AppButton>
      <AppButton variant="soft" @click="$router.push('/registro')">Crear cuenta</AppButton>
    </div>

    <p class="absolute bottom-6 text-xs text-brand-50/80">
      ¿Tienes un código? Regístrate con él y vincula tu préstamo.
    </p>
  </div>
</template>
<script setup>
import AppButton from '../components/AppButton.vue';
</script>