<template>
  <div class="space-y-4">
    <AppCard>
      <p class="text-xs text-slate-500">TOTAL A COBRAR</p>
      <h2 class="text-3xl font-extrabold text-brand-700">Bs. {{ totalCobrar.toFixed(2) }}</h2>
      <p class="text-xs text-slate-500 mt-1">{{ pendientes.length }} cuotas pendientes</p>
    </AppCard>

    <div class="flex gap-2 overflow-x-auto pb-1">
      <button
        v-for="f in filtros"
        :key="f.value"
        @click="filtro = f.value"
        :class="['px-4 py-2 rounded-2xl text-sm font-semibold whitespace-nowrap',
                 filtro === f.value ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 border border-slate-200']"
      >
        {{ f.label }}
      </button>
    </div>

    <AppCard v-for="p in filtrados" :key="p.id">
      <div class="flex justify-between items-center">
        <div class="flex-1 cursor-pointer" @click="$router.push(`/app/cobro/${p.id}`)">
          <p class="text-xs text-slate-400">{{ p.codigoVinculo }}</p>
          <p class="font-bold text-slate-800">{{ nombreCliente(p.clienteId) }}</p>
          <p class="text-xs text-slate-500">
            {{ p.cuotas.filter(c => c.estado !== 'PAGADA').length }} cuotas pendientes ·
            Bs. {{ totalPendiente(p).toFixed(2) }}
          </p>
        </div>

        <div class="flex flex-col items-end gap-2">
          <span class="text-xs px-3 py-1 rounded-full font-semibold" :class="estadoColor(p)">
            {{ estadoEtiqueta(p) }}
          </span>
          <button
            v-if="p.clienteId"
            @click.stop="verCliente(p.clienteId)"
            class="text-xs bg-brand-50 text-brand-700 font-semibold px-3 py-1 rounded-2xl"
          >
            👤 Datos
          </button>
        </div>
      </div>
    </AppCard>

    <AppCard v-if="!filtrados.length">
      <p class="text-slate-500 text-sm">Sin cobros en este filtro.</p>
    </AppCard>

    <!-- Modal datos del cliente -->
    <div v-if="verClienteOpen && datosCliente"
         class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto"
         @click.self="verClienteOpen = false">
      <div class="bg-white rounded-3xl w-full max-w-sm p-5 my-4">
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
              {{ datosCliente.usuario.correo }}
            </span>
          </div>
          <div class="flex justify-between border-b border-slate-50 py-1.5">
            <span class="text-slate-500">📱 Teléfono</span>
            <span class="font-semibold text-slate-800">{{ datosCliente.usuario.telefono || '—' }}</span>
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

        <div class="mt-4">
          <AppButton variant="ghost" @click="verClienteOpen = false">Cerrar</AppButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import AppCard from '../components/AppCard.vue';
import AppButton from '../components/AppButton.vue';
import { usePrestamosStore } from '../stores/prestamos';
import { storage } from '../services/storage';

const store = usePrestamosStore();
const filtro = ref('TODOS');
onMounted(() => store.cargar());

const filtros = [
  { value: 'TODOS', label: 'Todos' },
  { value: 'HOY', label: 'Vencen hoy' },
  { value: 'MORA', label: 'En mora' },
  { value: 'ACTIVO', label: 'Activos' },
];

const lista = computed(() => store.lista);

const pendientes = computed(() =>
  lista.value.flatMap(p => p.cuotas.filter(c => c.estado !== 'PAGADA').map(c => ({ p, c })))
);

const totalCobrar = computed(() =>
  pendientes.value.reduce((a, x) => a + x.c.monto, 0)
);

const filtrados = computed(() => {
  if (filtro.value === 'HOY') {
    const hoy = new Date().toDateString();
    return lista.value.filter(p =>
      p.cuotas.some(c => c.estado !== 'PAGADA' && new Date(c.fechaVencimiento).toDateString() === hoy)
    );
  }
  if (filtro.value === 'MORA') {
    return lista.value.filter(p =>
      p.cuotas.some(c => c.estado !== 'PAGADA' && new Date(c.fechaVencimiento) < new Date())
    );
  }
  if (filtro.value === 'ACTIVO') return lista.value.filter(p => p.estado === 'ACTIVO');
  return lista.value;
});

const totalPendiente = (p) =>
  p.cuotas.filter(c => c.estado !== 'PAGADA').reduce((a, c) => a + c.monto, 0);

const nombreCliente = (id) => storage.usuarioPorId(id)?.nombre || 'Sin cliente';

const enMora = (p) =>
  p.cuotas.some(c => c.estado !== 'PAGADA' && new Date(c.fechaVencimiento) < new Date());

const estadoEtiqueta = (p) => {
  if (!p.clienteId) return 'SIN ASIGNAR';
  if (p.estado === 'PAGADO') return 'PAGADO';
  if (enMora(p)) return 'EN MORA';
  return 'ACTIVO';
};

const estadoColor = (p) => {
  if (!p.clienteId) return 'bg-slate-100 text-slate-600';
  if (p.estado === 'PAGADO') return 'bg-brand-100 text-brand-700';
  if (enMora(p)) return 'bg-red-100 text-red-700';
  return 'bg-amber-100 text-amber-700';
};

// --- Modal datos del cliente
const verClienteOpen = ref(false);
const datosCliente = ref(null);

const iniciales = computed(() => {
  const n = datosCliente.value?.usuario?.nombre || '?';
  return n.split(' ').slice(0, 2).map(x => x[0]).join('').toUpperCase();
});

const verCliente = (clienteId) => {
  datosCliente.value = storage.datosCliente(clienteId);
  verClienteOpen.value = true;
};

const formatoFecha = (iso) => iso ? new Date(iso).toLocaleDateString('es-BO') : '—';
</script>