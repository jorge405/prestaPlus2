<template>
  <div v-if="p" class="space-y-4">
    <button @click="$router.back()" class="text-sm text-brand-700 font-semibold">← Volver a cobros</button>

    <AppCard>
      <div class="flex justify-between items-start">
        <div class="flex-1">
          <p class="text-xs text-slate-400">{{ p.codigoVinculo }}</p>
          <h2 class="font-bold text-lg">{{ nombreCliente }}</h2>
          <p class="text-xs text-slate-500">CI {{ cliente?.ci || '—' }}</p>
        </div>
        <button
          @click="verCliente"
          class="bg-brand-50 text-brand-700 text-xs font-semibold px-3 py-2 rounded-2xl"
        >
          👤 Ver datos
        </button>
      </div>

      <div class="grid grid-cols-2 gap-3 mt-4 text-sm">
        <div><p class="text-slate-400 text-xs">Monto</p><p class="font-semibold">Bs. {{ p.monto }}</p></div>
        <div><p class="text-slate-400 text-xs">Total</p><p class="font-semibold">Bs. {{ p.totalPagar }}</p></div>
        <div><p class="text-slate-400 text-xs">Interés</p><p class="font-semibold">{{ p.interesMensual }}%</p></div>
        <div><p class="text-slate-400 text-xs">Plazo</p><p class="font-semibold">{{ p.plazoMeses }} meses</p></div>
      </div>
    </AppCard>

    <AppCard v-if="p.garantias?.length">
      <p class="text-xs text-slate-400 font-semibold mb-2">GARANTÍA DEJADA</p>
      <div v-for="(g, i) in p.garantias" :key="i" class="flex justify-between items-start">
        <div>
          <p class="font-semibold text-slate-800">{{ g.descripcion }}</p>
          <p class="text-xs text-slate-500">{{ etiquetaTipo(g.tipo) }}</p>
        </div>
        <p class="font-bold text-brand-700">Bs. {{ g.valorAvaluo }}</p>
      </div>
    </AppCard>

    <AppCard v-if="cuotasEnVerificacion.length">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-xl">🟡</div>
        <div class="flex-1">
          <p class="font-semibold text-slate-800 text-sm">
            {{ cuotasEnVerificacion.length }} comprobante(s) por verificar
          </p>
          <p class="text-xs text-slate-500">Revisa y aprueba o rechaza</p>
        </div>
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
            <p v-if="c.metodo" class="text-[10px] text-slate-400 mt-0.5">Método: {{ c.metodo }}</p>
            <p v-if="c.estado === 'EN_VERIFICACION'" class="text-[10px] text-amber-600 mt-0.5">
              ⏳ Pendiente de verificación
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
            Registrar pago
          </button>

          <button
            v-if="c.estado === 'EN_VERIFICACION'"
            @click="revisar(c)"
            class="text-xs bg-amber-100 text-amber-700 font-semibold mt-1 px-3 py-1 rounded-full"
          >
            Revisar comprobante
          </button>
        </div>
      </div>
    </AppCard>

    <!-- Modal datos del cliente -->
    <div v-if="verClienteOpen && datosCliente"
         class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto"
         @click.self="verClienteOpen = false">
      <div class="bg-white rounded-3xl w-full max-w-sm p-5 my-4 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-14 h-14 rounded-2xl bg-brand-gradient flex items-center justify-center text-white text-xl font-extrabold">
            {{ iniciales }}
          </div>
          <div class="flex-1">
            <p class="font-bold text-slate-800">{{ datosCliente.usuario.nombre }}</p>
            <p class="text-xs text-slate-500">CI {{ datosCliente.usuario.ci }}</p>
          </div>
        </div>

        <div class="space-y-2 text-sm">
          <div class="flex justify-between border-b border-slate-50 py-1.5">
            <span class="text-slate-500">📧 Correo</span>
            <span class="font-semibold text-slate-800 text-right max-w-[60%] truncate">
              {{ datosCliente.usuario.correo || '—' }}
            </span>
          </div>
          <div class="flex justify-between border-b border-slate-50 py-1.5">
            <span class="text-slate-500">📱 Teléfono</span>
            <span class="font-semibold text-slate-800">{{ datosCliente.usuario.telefono || '—' }}</span>
          </div>
          <div class="flex justify-between border-b border-slate-50 py-1.5">
            <span class="text-slate-500">🏠 Dirección</span>
            <span class="font-semibold text-slate-800 text-right max-w-[60%]">
              {{ datosCliente.usuario.direccion || '—' }}
            </span>
          </div>
          <div class="flex justify-between border-b border-slate-50 py-1.5">
            <span class="text-slate-500">📅 Registro</span>
            <span class="font-semibold text-slate-800">
              {{ formatoFecha(datosCliente.usuario.createdAt) }}
            </span>
          </div>
        </div>

        <p class="text-xs font-semibold text-slate-400 mt-4 mb-2">RESUMEN FINANCIERO</p>
        <div class="grid grid-cols-2 gap-2">
          <div class="bg-brand-50 rounded-2xl p-2 text-center">
            <p class="text-[10px] text-brand-700">Prestado</p>
            <p class="font-extrabold text-brand-800 text-sm">
              Bs. {{ datosCliente.totalPrestado.toFixed(2) }}
            </p>
          </div>
          <div class="bg-slate-50 rounded-2xl p-2 text-center">
            <p class="text-[10px] text-slate-600">Pagado</p>
            <p class="font-extrabold text-slate-800 text-sm">
              Bs. {{ datosCliente.totalPagado.toFixed(2) }}
            </p>
          </div>
          <div class="bg-amber-50 rounded-2xl p-2 text-center col-span-2">
            <p class="text-[10px] text-amber-700">Saldo pendiente</p>
            <p class="font-extrabold text-amber-800 text-sm">
              Bs. {{ datosCliente.saldoPendiente.toFixed(2) }}
            </p>
          </div>
        </div>

        <p class="text-xs font-semibold text-slate-400 mt-4 mb-2">GARANTÍAS EN PODER</p>
        <div v-if="datosCliente.garantias.length" class="space-y-1">
          <div v-for="(g, i) in datosCliente.garantias" :key="i"
               class="flex justify-between text-xs border-b border-slate-50 py-1">
            <div>
              <p class="font-semibold text-slate-800">{{ g.descripcion }}</p>
              <p class="text-slate-400">{{ etiquetaTipo(g.tipo) }} · {{ g.codigo }}</p>
            </div>
            <p class="font-bold text-brand-700">Bs. {{ g.valorAvaluo }}</p>
          </div>
        </div>
        <p v-else class="text-xs text-slate-400">Sin garantías registradas.</p>

        <div class="mt-4">
          <AppButton variant="ghost" @click="verClienteOpen = false">Cerrar</AppButton>
        </div>
      </div>
    </div>

    <!-- Modal QR (registrar pago del admin) -->
    <QrPagoModal
      :open="showQr"
      :monto="cuotaSel?.monto"
      :prestamo-id="p.id"
      :cuota-id="cuotaSel?.id"
      @close="showQr = false"
      @confirm="confirmarQR"
    />

    <!-- Modal verificar comprobante -->
    <div v-if="verificarOpen" class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div class="bg-white rounded-3xl w-full max-w-sm p-5 my-4 max-h-[90vh] overflow-y-auto">
        <p class="font-bold mb-1">Verificar comprobante</p>
        <p class="text-xs text-slate-500 mb-3">
          Cuota {{ cuotaVer?.numero }} · Bs. {{ cuotaVer?.monto }}
        </p>

        <div class="bg-slate-50 rounded-2xl p-2 mb-3">
          <p class="text-[11px] text-slate-500 mb-1">Método: <b>{{ cuotaVer?.metodo }}</b></p>
          <p v-if="cuotaVer?.enviadoEn" class="text-[11px] text-slate-500">
            Enviado: {{ formatoFecha(cuotaVer.enviadoEn) }}
          </p>
        </div>

        <img v-if="cuotaVer?.comprobante" :src="cuotaVer.comprobante"
             class="w-full rounded-2xl border border-slate-200 max-h-72 object-contain mb-3 bg-slate-50" />
        <p v-else class="text-xs text-slate-400 mb-3 text-center py-4">Sin imagen adjunta</p>

        <p v-if="cuotaVer?.notaCliente" class="text-xs text-slate-500 mb-3">
          <b>Nota del cliente:</b> {{ cuotaVer.notaCliente }}
        </p>

        <div class="grid grid-cols-2 gap-2">
          <AppButton variant="soft" @click="rechazar">Rechazar</AppButton>
          <AppButton @click="aprobar">Aprobar</AppButton>
        </div>
        <div class="mt-2">
          <AppButton variant="ghost" @click="verificarOpen = false">Cerrar</AppButton>
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
import { storage } from '../services/storage';

const route = useRoute();
const store = usePrestamosStore();
const p = ref(null);

onMounted(() => {
  store.cargar();
  p.value = store.lista.find(x => x.id === route.params.id);
});

const cliente = computed(() => storage.usuarioPorId(p.value?.clienteId));
const nombreCliente = computed(() => cliente.value?.nombre || 'Sin cliente asignado');
const iniciales = computed(() => {
  const n = cliente.value?.nombre || '?';
  return n.split(' ').slice(0, 2).map(x => x[0]).join('').toUpperCase();
});

const datosCliente = computed(() =>
  p.value?.clienteId ? storage.datosCliente(p.value.clienteId) : null
);

const etiquetaTipo = (t) => ({
  JOYA: 'Joyería', ELECTRODOMESTICO: 'Electrodoméstico', VEHICULO: 'Vehículo',
  ELECTRONICA: 'Electrónica', HERRAMIENTA: 'Herramienta', MAQUINARIA: 'Maquinaria',
  INSTRUMENTO: 'Instrumento', COLECCION: 'Colección', PERSONAL: 'Personal', INMUEBLE: 'Inmueble',
}[t] || t);

const formatoFecha = (iso) => iso ? new Date(iso).toLocaleDateString('es-BO') : '—';
const iconoEstado = (c) =>
  c.estado === 'PAGADA' ? '✅' :
  c.estado === 'EN_VERIFICACION' ? '🟡' : '⏳';

const cuotasEnVerificacion = computed(() =>
  (p.value?.cuotas || []).filter(c => c.estado === 'EN_VERIFICACION')
);

// --- Modal datos del cliente
const verClienteOpen = ref(false);
const verCliente = () => { verClienteOpen.value = true; };

// --- Registrar pago (admin, solo QR)
const showQr = ref(false);
const cuotaSel = ref(null);

const abrirPago = (c) => { cuotaSel.value = c; showQr.value = true; };

const confirmarQR = ({ comprobante }) => {
  const arr = storage.prestamos();
  const pr = arr.find(x => x.id === p.value.id);
  const cu = pr.cuotas.find(x => x.id === cuotaSel.value.id);
  cu.estado = 'PAGADA';
  cu.fechaPago = new Date().toISOString();
  cu.metodo = 'QR';
  cu.comprobante = comprobante;
  cu.verificadoEn = new Date().toISOString();
  if (pr.cuotas.every(x => x.estado === 'PAGADA')) pr.estado = 'PAGADO';
  storage.guardarPrestamos(arr);

  store.cargar();
  p.value = store.lista.find(x => x.id === route.params.id);
  showQr.value = false;
  cuotaSel.value = null;
};

// --- Verificar comprobantes subidos por el cliente
const verificarOpen = ref(false);
const cuotaVer = ref(null);

const revisar = (c) => { cuotaVer.value = c; verificarOpen.value = true; };

const aprobar = () => {
  store.verificarPago(p.value.id, cuotaVer.value.id, true);
  p.value = store.lista.find(x => x.id === route.params.id);
  verificarOpen.value = false;
  cuotaVer.value = null;
};

const rechazar = () => {
  store.verificarPago(p.value.id, cuotaVer.value.id, false);
  p.value = store.lista.find(x => x.id === route.params.id);
  verificarOpen.value = false;
  cuotaVer.value = null;
};
</script>