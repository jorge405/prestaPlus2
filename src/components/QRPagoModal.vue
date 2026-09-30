<template>
  <div v-if="open" class="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4 overflow-y-auto">
    <div class="bg-white rounded-3xl w-full max-w-sm p-6 text-center my-4">
      <h3 class="font-bold text-lg mb-1">Pagar con QR</h3>
      <p class="text-xs text-slate-500 mb-4">Escanea desde tu app bancaria y sube el comprobante</p>

      <!-- QR generado por librería -->
      <div class="flex justify-center">
        <canvas ref="canvas" class="w-56 h-56 rounded-2xl border border-slate-200 bg-white"></canvas>
      </div>

      <div class="mt-4 bg-brand-50 rounded-2xl p-3">
        <p class="text-xs text-brand-700">Monto a pagar</p>
        <p class="font-extrabold text-2xl text-brand-800">Bs. {{ monto }}</p>
      </div>

      <p class="text-[10px] text-slate-400 mt-2 break-all">{{ payload }}</p>

      <!-- Subir comprobante -->
      <div class="mt-5 text-left">
        <label class="text-sm font-medium text-slate-700 block mb-1">Comprobante de pago</label>
        <input
          type="file"
          accept="image/*"
          @change="onFile"
          class="w-full text-xs border border-slate-200 rounded-2xl p-2"
        />
        <img v-if="comprobante" :src="comprobante" class="mt-3 rounded-2xl max-h-40 mx-auto border border-slate-200" />
      </div>

      <div class="mt-5 space-y-2">
        <AppButton :disabled="!comprobante" @click="confirmar">
          Enviar a verificación
        </AppButton>
        <AppButton variant="ghost" @click="$emit('close')">Cancelar</AppButton>
      </div>

      <p class="text-[11px] text-amber-600 mt-3">
        Tu pago quedará <b>en observación</b> hasta que el prestamista lo verifique.
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch, nextTick } from 'vue';
import QRCode from 'qrcode';
import AppButton from './AppButton.vue';

const props = defineProps({
  open: Boolean,
  monto: [String, Number],
  prestamoId: String,
  cuotaId: String,
});
const emit = defineEmits(['close', 'confirm']);

const canvas = ref(null);
const comprobante = ref(null);

const payload = computed(() =>
  `prestaplus://pay?p=${props.prestamoId}&c=${props.cuotaId}&m=${props.monto}`
);

const generarQR = async () => {
  await nextTick();
  if (!canvas.value) return;
  await QRCode.toCanvas(canvas.value, payload.value, {
    width: 240,
    margin: 1,
    color: { dark: '#065f46', light: '#ffffff' },
  });
};

onMounted(() => { if (props.open) generarQR(); });
watch(() => props.open, (v) => {
  if (v) { comprobante.value = null; generarQR(); }
});
watch(payload, () => { if (props.open) generarQR(); });

const onFile = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => { comprobante.value = ev.target.result; };
  reader.readAsDataURL(file);
};

const confirmar = () => {
  emit('confirm', {
    metodo: 'QR',
    comprobante: comprobante.value,
  });
};
</script>