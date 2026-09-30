<template>
  <div class="space-y-4">
    <AppCard>
      <p class="text-xs text-slate-500">TOTAL PAGADO</p>
      <h2 class="text-3xl font-extrabold text-brand-700">
        Bs. {{ totalPagado.toFixed(2) }}
      </h2>
      <p class="text-xs text-slate-500 mt-1">{{ totalPagos }} pagos registrados</p>
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

    <div v-for="p in filtrados" :key="p.id">
      <AppCard>
        <div class="flex justify-between items-center mb-3">
          <div>
            <p class="text-xs text-slate-400">{{ p.codigoVinculo }}</p>
            <p class="font-bold text-slate-800">Bs. {{ p.monto }}</p>
            <p class="text-xs text-slate-500">Inicio {{ formatoFecha(p.fechaInicio) }}</p>
          </div>
          <span class="text-xs px-3 py-1 rounded-full font-semibold"
            :class="p.estado === 'PAGADO' ? 'bg-brand-100 text-brand-700' : 'bg-amber-100 text-amber-700'">
            {{ p.estado }}
          </span>
        </div>

        <p class="text-xs font-semibold text-slate-600 mb-2">Pagos realizados</p>
        <div v-if="p.pagos.length" class="space-y-1">
          <div v-for="(pg, i) in p.pagos" :key="i"
               class="flex justify-between text-xs border-b border-slate-50 pb-1">
            <span class="text-slate-500">Cuota {{ pg.cuota }} · {{ pg.metodo }}</span>
            <span class="text-slate-600">{{ formatoFecha(pg.fecha) }}</span>
            <span class="font-semibold text-brand-700">Bs. {{ pg.monto }}</span>
          </div>
        </div>
        <p v-else class="text-xs text-slate-400">Sin pagos aún.</p>
      </AppCard>
    </div>

    <AppCard v-if="!filtrados.length">
      <p class="text-slate-500 text-sm">Sin historial en este filtro.</p>
    </AppCard>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import AppCard from '../components/AppCard.vue';
import { usePrestamosStore } from '../stores/prestamos';

const store = usePrestamosStore();
const filtro = ref('TODOS');
onMounted(() => store.cargar());

const filtros = [
  { value: 'TODOS', label: 'Todos' },
  { value: 'ACTIVO', label: 'Activos' },
  { value: 'PAGADO', label: 'Pagados' },
];

const lista = computed(() => store.historial);
const filtrados = computed(() =>
  filtro.value === 'TODOS' ? lista.value : lista.value.filter(p => p.estado === filtro.value)
);

const totalPagado = computed(() => lista.value.reduce((a, p) => a + p.totalPagado, 0));
const totalPagos = computed(() => lista.value.reduce((a, p) => a + p.pagos.length, 0));

const formatoFecha = (iso) =>
  iso ? new Date(iso).toLocaleDateString('es-BO') : '—';
</script>