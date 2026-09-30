<template>
  <!-- =========================================================
       MÓVIL (< 640px): vista completa tipo pantalla
       TABLET/LAPTOP (>= 640px): modal centrado con overlay
       ========================================================= -->
  <div
    v-if="open"
    :class="[
      'fixed inset-0 z-50 bg-black/60',
      'flex justify-center',
      esMovil ? 'items-stretch p-0' : 'items-center p-4'
    ]"
    @click.self="esMovil ? null : $emit('close')"
  >
    <div
      :class="[
        'bg-white flex flex-col',
        esMovil
          ? 'w-full h-full rounded-none'
          : 'w-full max-w-md rounded-3xl max-h-[90vh]'
      ]"
    >
      <!-- ========== MÓVIL: header tipo view ========== -->
      <header
        v-if="esMovil"
        class="flex items-center gap-3 px-4 py-3 border-b border-slate-100 bg-white sticky top-0 z-10"
      >
        <button
          @click="$emit('close')"
          class="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600"
        >
          ←
        </button>
        <div class="flex-1">
          <p class="font-bold text-slate-800 leading-tight">Pagar con QR</p>
          <p class="text-[11px] text-slate-500">Cuota {{ cuotaNumero || '' }}</p>
        </div>
      </header>

      <!-- ========== DESKTOP: header normal ========== -->
      <header v-else class="px-6 pt-6 pb-3 text-center">
        <h3 class="font-bold text-lg">Pagar con QR</h3>
        <p class="text-xs text-slate-500 mt-1">
          Escanea desde tu app bancaria y sube el comprobante
        </p>
      </header>

      <!-- ========== CONTENIDO (scrollable) ========== -->
      <div class="flex-1 overflow-y-auto px-5 sm:px-6 pb-4">
        <!-- QR -->
        <div class="flex justify-center mt-4 mb-3">
          <div class="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
            <canvas
              ref="canvas"
              class="block w-full h-auto"
              :style="{ maxWidth: qrSize + 'px' }"
            ></canvas>
          </div>
        </div>

        <!-- Monto -->
        <div class="bg-brand-50 rounded-2xl p-3 mb-3 text-center">
          <p class="text-[11px] text-brand-700">Monto a pagar</p>
          <p class="font-extrabold text-2xl text-brand-800">Bs. {{ monto }}</p>
        </div>

        <p class="text-[10px] text-slate-400 break-all text-center mb-4 px-2">
          {{ payload }}
        </p>

        <!-- Comprobante -->
        <div class="text-left">
          <label class="text-xs font-semibold text-slate-700 block mb-1">
            Comprobante de pago
          </label>
          <input
            type="file"
            accept="image/*"
            @change="onFile"
            class="w-full text-xs border border-slate-200 rounded-2xl p-2
                   file:mr-2 file:py-1 file:px-3 file:rounded-xl file:border-0
                   file:bg-brand-50 file:text-brand-700 file:text-xs file:font-semibold"
          />
          <img
            v-if="comprobante"
            :src="comprobante"
            class="mt-2 rounded-2xl max-h-40 w-full object-contain border border-slate-200 bg-slate-50"
          />
        </div>

        <p class="text-[11px] text-amber-600 mt-3 text-center">
          Tu pago quedará <b>en observación</b> hasta que el prestamista lo verifique.
        </p>
      </div>

      <!-- ========== FOOTER FIJO con botones ========== -->
      <footer
        :class="[
          'border-t border-slate-100 bg-white px-5 sm:px-6 py-4 space-y-2',
          esMovil ? 'pb-[max(16px,env(safe-area-inset-bottom))]' : ''
        ]"
      >
        <AppButton :disabled="!comprobante" @click="confirmar">
          Enviar a verificación
        </AppButton>
        <AppButton variant="ghost" @click="$emit('close')">
          {{ esMovil ? 'Cancelar' : 'Cerrar' }}
        </AppButton>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import QRCode from 'qrcode';
import AppButton from './AppButton.vue';

const props = defineProps({
  open: Boolean,
  monto: [String, Number],
  prestamoId: String,
  cuotaId: String,
  cuotaNumero: [String, Number], // opcional, para mostrar en el header del móvil
});
const emit = defineEmits(['close', 'confirm']);

const canvas = ref(null);
const comprobante = ref(null);
const screenWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1024);

const esMovil = computed(() => screenWidth.value < 640);

const qrSize = computed(() => {
  // Móvil chico: 180-220 | Tablet/laptop: 240
  if (esMovil.value) return Math.min(220, screenWidth.value - 120);
  return 240;
});

const payload = computed(() =>
  `prestaplus://pay?p=${props.prestamoId}&c=${props.cuotaId}&m=${props.monto}`
);

const actualizarWidth = () => {
  screenWidth.value = window.innerWidth;
};

const generarQR = async () => {
  await nextTick();
  if (!canvas.value) return;
  try {
    await QRCode.toCanvas(canvas.value, payload.value, {
      width: qrSize.value,
      margin: 1,
      color: { dark: '#065f46', light: '#ffffff' },
    });
    // Fluido y siempre completo
    canvas.value.style.width = '100%';
    canvas.value.style.height = 'auto';
    canvas.value.style.maxWidth = qrSize.value + 'px';
  } catch (e) {
    console.error('Error generando QR:', e);
  }
};

onMounted(() => {
  window.addEventListener('resize', actualizarWidth);
  if (props.open) generarQR();
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', actualizarWidth);
});

watch(() => props.open, (v) => {
  if (v) {
    comprobante.value = null;
    generarQR();
  }
});

watch(payload, () => { if (props.open) generarQR(); });
watch(qrSize, () => { if (props.open) generarQR(); });

const onFile = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => { comprobante.value = ev.target.result; };
  reader.readAsDataURL(file);
};

const confirmar = () => {
  emit('confirm', { metodo: 'QR', comprobante: comprobante.value });
};
</script>