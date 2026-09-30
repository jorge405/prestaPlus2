<template>
  <div v-if="open" class="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4" @click.self="$emit('close')">
    <div class="bg-white rounded-3xl w-full max-w-sm p-6">
      <h3 class="font-bold text-lg mb-1">Registrar pago</h3>
      <p class="text-xs text-slate-500 mb-4">
        Cuota {{ cuota?.numero }} · Bs. {{ cuota?.monto }}
      </p>

      <p class="text-sm font-medium text-slate-700 mb-2">Método de pago</p>
      <div class="grid grid-cols-2 gap-3">
        <button
          @click="metodo = 'QR'"
          :class="['rounded-2xl p-4 border-2 transition', metodo === 'QR' ? 'border-brand-500 bg-brand-50' : 'border-slate-200']"
        >
          <p class="text-2xl">📱</p>
          <p class="font-semibold text-sm mt-1">QR</p>
        </button>
        <button
          @click="metodo = 'EFECTIVO'"
          :class="['rounded-2xl p-4 border-2 transition', metodo === 'EFECTIVO' ? 'border-brand-500 bg-brand-50' : 'border-slate-200']"
        >
          <p class="text-2xl">💵</p>
          <p class="font-semibold text-sm mt-1">Efectivo</p>
        </button>
      </div>

      <div class="mt-5 space-y-2">
        <AppButton :disabled="!metodo" @click="$emit('confirm', metodo)">Continuar</AppButton>
        <AppButton variant="ghost" @click="$emit('close')">Cancelar</AppButton>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, watch } from 'vue';
import AppButton from './AppButton.vue';

const props = defineProps({ open: Boolean, cuota: Object });
defineEmits(['close', 'confirm']);
const metodo = ref(null);
watch(() => props.open, () => { metodo.value = null; });
</script>