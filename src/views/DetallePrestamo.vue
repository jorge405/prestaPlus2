<template>
  <div v-if="p" class="space-y-4">
    <AppCard>
      <p class="text-xs text-slate-400">{{ p.codigoVinculo }}</p>
      <h2 class="font-extrabold text-xl text-slate-800">Bs. {{ p.monto }}</h2>
      <div class="grid grid-cols-2 gap-3 mt-3 text-sm">
        <div><p class="text-slate-400 text-xs">Interés</p><p class="font-semibold">{{ p.interesMensual }}%</p></div>
        <div><p class="text-slate-400 text-xs">Plazo</p><p class="font-semibold">{{ p.plazoMeses }} meses</p></div>
        <div><p class="text-slate-400 text-xs">Total</p><p class="font-semibold">Bs. {{ p.totalPagar }}</p></div>
        <div><p class="text-slate-400 text-xs">Estado</p><p class="font-semibold text-brand-700">{{ p.estado }}</p></div>
      </div>
    </AppCard>

    <AppCard v-if="p.garantias?.length">
      <p class="text-xs text-slate-400 font-semibold">GARANTÍA</p>
      <div v-for="(g, i) in p.garantias" :key="i" class="mt-2">
        <p class="font-semibold text-slate-800">{{ g.descripcion }}</p>
        <p class="text-xs text-slate-500">{{ etiquetaTipo(g.tipo) }} · Avalúo Bs. {{ g.valorAvaluo }}</p>
      </div>
    </AppCard>

    <h3 class="font-bold text-slate-800 mt-2">Cuotas</h3>

    <AppCard v-for="c in p.cuotas" :key="c.id">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <span class="text-xl">{{ iconoEstado(c) }}</span>
          <div>
            <p class="font-semibold">Cuota {{ c.numero }}</p>
            <p class="text-xs text-slate-500">{{ formatoFecha(c.fechaVencimiento) }}</p>
            <p v-if="c.estado === 'EN_VERIFICACION'" class="text-[10px] text-amber-600 mt-0.5">
              ⏳ Esperando verificación del prestamista
            </p>
            <p v-else-if="c.metodo" class="text-[10px] text-slate-400 mt-0.5">
              Pagada con {{ c.metodo }}
            </p>
            <p v-if="c.motivoRechazo" class="text-[10px] text-red-500 mt-0.5">{{ c.motivoRechazo }}</p>
          </div>
        </div>
        <div class="text-right">
          <p class="font-bold text-slate-800">Bs. {{ c.monto }}</p>
          <button
            v-if="c.estado === 'PENDIENTE'"
            @click="abrirPago(c)"
            class="text-xs text-brand-600 font-semibold mt-1"
          >
            Pagar ahora
          </button>
          <button
            v-else-if="c.estado === 'EN_VERIFICACION'"
            @click="verComprobante(c)"
            class="text-xs text-amber-600 font-semibold mt-1"
          >
            Ver comprobante
          </button>
        </div>
      </div>
    </AppCard>

    <!-- Modal QR (directo) -->
    <QrPagoModal
      :open="showQr"
      :monto="cuotaSel?.monto"
      :prestamo-id="p.id"
      :cuota-id="cuotaSel?.id"
      @close="showQr = false"
      @confirm="confirmarQR"
    />

    <!-- Modal ver comprobante enviado -->
    <div
      v-if="verComprobanteOpen"
      class="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto"
      @click.self="verComprobanteOpen = false"
    >
      <div class="bg-white rounded-3xl w-full max-w-sm p-5 text-center my-4 max-h-[90vh] overflow-y-auto">
        <p class="font-bold mb-3">Comprobante enviado</p>
        <img v-if="comprobanteVer" :src="comprobanteVer"
             class="w-full rounded-2xl border border-slate-200 max-h-80 object-contain" />
        <p v-else class="text-xs text-slate-400">Sin imagen</p>
        <div class="mt-4">
          <AppButton variant="ghost" @click="verComprobanteOpen = false">Cerrar</AppButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import AppCard from '../components/AppCard.vue';
import AppButton from '../components/AppButton.vue';
import QrPagoModal from '../components/QRPagoModal.vue';
import { usePrestamosStore } from '../stores/prestamos';

const route = useRoute();
const store = usePrestamosStore();
const p = ref(null);

onMounted(() => {
  store.cargar();
  p.value = store.lista.find(x => x.id === route.params.id);
});

const etiquetaTipo = (t) => ({
  JOYA: 'Joyería', ELECTRODOMESTICO: 'Electrodoméstico', VEHICULO: 'Vehículo',
  ELECTRONICA: 'Electrónica', HERRAMIENTA: 'Herramienta', MAQUINARIA: 'Maquinaria',
  INSTRUMENTO: 'Instrumento', COLECCION: 'Colección', PERSONAL: 'Personal', INMUEBLE: 'Inmueble',
}[t] || t);

const formatoFecha = (iso) => new Date(iso).toLocaleDateString('es-BO');
const iconoEstado = (c) =>
  c.estado === 'PAGADA' ? '✅' :
  c.estado === 'EN_VERIFICACION' ? '🟡' : '⏳';

// --- Flujo de pago (solo QR)
const showQr = ref(false);
const cuotaSel = ref(null);

const abrirPago = (c) => {
  cuotaSel.value = c;
  showQr.value = true;
};

const confirmarQR = ({ metodo, comprobante }) => {
  store.subirComprobante(p.value.id, cuotaSel.value.id, { metodo, comprobante });
  p.value = store.lista.find(x => x.id === route.params.id);
  showQr.value = false;
  cuotaSel.value = null;
};

// --- Ver comprobante enviado
const verComprobanteOpen = ref(false);
const comprobanteVer = ref(null);
const verComprobante = (c) => {
  comprobanteVer.value = c.comprobante;
  verComprobanteOpen.value = true;
};
</script>