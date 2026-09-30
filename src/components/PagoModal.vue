<template>
  <div v-if="open" class="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4" @click.self="$emit('close')">
    <div class="bg-white rounded-3xl w-full max-w-sm p-6">
      <h3 class="font-bold text-lg mb-1">Pagar cuota</h3>
      <p class="text-xs text-slate-500 mb-4">
        Cuota {{ cuota?.numero }} · Bs. {{ cuota?.monto }}
      </p>

      <div class="rounded-2xl p-4 border-2 border-brand-500 bg-brand-50 text-center mb-4">
        <p class="text-2xl">📱</p>
        <p class="font-semibold text-sm mt-1 text-brand-700">Pagar con QR</p>
        <p class="text-[11px] text-brand-600 mt-1">Escanea, paga y sube tu comprobante</p>
      </div>

      <div class="space-y-2">
        <AppButton @click="$emit('confirm', 'QR')">Continuar</AppButton>
        <AppButton variant="ghost" @click="$emit('close')">Cancelar</AppButton>
      </div>
    </div>
  </div>
</template>
<script setup>
import AppButton from './AppButton.vue';
defineProps({ open: Boolean, cuota: Object });
defineEmits(['close', 'confirm']);
</script>