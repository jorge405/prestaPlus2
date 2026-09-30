<template>
  <div class="space-y-4">
    <AppCard>
      <p class="text-xs text-slate-500">CARTERA TOTAL</p>
      <h2 class="text-3xl font-extrabold text-brand-700">Bs. {{ cartera.toFixed(2) }}</h2>
      <div class="grid grid-cols-3 gap-2 mt-4 text-center">
        <div class="bg-brand-50 rounded-2xl py-2">
          <p class="text-xs text-brand-700">Activos</p>
          <p class="font-bold text-brand-800">{{ activos }}</p>
        </div>
        <div class="bg-amber-50 rounded-2xl py-2">
          <p class="text-xs text-amber-700">En mora</p>
          <p class="font-bold text-amber-800">{{ enMora }}</p>
        </div>
        <div class="bg-slate-100 rounded-2xl py-2">
          <p class="text-xs text-slate-600">Pagados</p>
          <p class="font-bold text-slate-800">{{ pagados }}</p>
        </div>
      </div>
    </AppCard>

    <div class="grid grid-cols-2 gap-3">
      <router-link to="/app/nuevo-prestamo">
        <AppCard class="text-center">
          <p class="text-2xl">➕</p>
          <p class="font-semibold text-sm mt-1">Nuevo préstamo</p>
        </AppCard>
      </router-link>
      <router-link to="/app/reportes">
        <AppCard class="text-center">
          <p class="text-2xl">📈</p>
          <p class="font-semibold text-sm mt-1">Reportes</p>
        </AppCard>
      </router-link>
    </div>

    <!-- 🆕 Selector: Recientes / Pagados / Por mes -->
    <AppCard>
      <div class="flex items-center justify-between mb-3">
        <h3 class="font-bold text-slate-800">Préstamos</h3>
        <div class="flex gap-1">
          <button
            v-for="m in modos"
            :key="m.value"
            @click="modo = m.value"
            :class="['text-xs px-3 py-1.5 rounded-full font-semibold',
                     modo === m.value ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600']"
          >
            {{ m.label }}
          </button>
        </div>
      </div>

      <!-- Selector de mes cuando modo = POR_MES -->
      <div v-if="modo === 'POR_MES'" class="mb-3">
        <select v-model="mesSeleccionado"
          class="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm">
          <option v-for="m in mesesDisponibles" :key="m.value" :value="m.value">{{ m.label }}</option>
        </select>
      </div>

      <div class="space-y-2">
        <div v-for="p in prestamosFiltrados" :key="p.id"
             @click="$router.push(`/app/cobro/${p.id}`)"
             class="border border-slate-100 rounded-2xl p-3 cursor-pointer hover:bg-brand-50/40 transition">
          <div class="flex justify-between items-center">
            <div>
              <p class="text-xs text-slate-400">{{ p.codigoVinculo }}</p>
              <p class="font-semibold text-slate-800">Bs. {{ p.monto }} · {{ p.plazoMeses }}m</p>
              <p class="text-xs text-slate-500">Cliente: {{ nombreCliente(p.clienteId) }}</p>
              <p class="text-[10px] text-slate-400">Inicio: {{ formatoFecha(p.fechaInicio) }}</p>
            </div>
            <span class="text-xs px-3 py-1 rounded-full font-semibold"
              :class="p.estado === 'PAGADO' ? 'bg-brand-100 text-brand-700' : 'bg-amber-100 text-amber-700'">
              {{ p.estado }}
            </span>
          </div>
        </div>

        <p v-if="!prestamosFiltrados.length" class="text-slate-400 text-xs text-center py-4">
          Sin préstamos en este filtro.
        </p>
      </div>
    </AppCard>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import AppCard from '../components/AppCard.vue';
import { usePrestamosStore } from '../stores/prestamos';
import { storage } from '../services/storage';

const store = usePrestamosStore();
onMounted(() => store.cargar());

const modo = ref('RECIENTES');
const modos = [
  { value: 'RECIENTES', label: 'Recientes' },
  { value: 'PAGADOS', label: 'Pagados' },
  { value: 'POR_MES', label: 'Por mes' },
];

const lista = computed(() => store.lista);

const cartera = computed(() => lista.value.reduce((a, p) => a + Number(p.monto), 0));
const activos = computed(() => lista.value.filter(p => p.estado === 'ACTIVO').length);
const pagados = computed(() => lista.value.filter(p => p.estado === 'PAGADO').length);
const enMora = computed(() =>
  lista.value.filter(p => p.cuotas.some(c => c.estado !== 'PAGADA' && new Date(c.fechaVencimiento) < new Date())).length
);

const nombreCliente = (id) => storage.usuarioPorId(id)?.nombre || '—';
const formatoFecha = (iso) => iso ? new Date(iso).toLocaleDateString('es-BO') : '—';

// Meses disponibles (según préstamos del admin)
const mesesDisponibles = computed(() => {
  const set = new Set();
  lista.value.forEach(p => {
    const d = new Date(p.fechaInicio);
    set.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  });
  const arr = Array.from(set).sort().reverse();
  return arr.map(v => {
    const [y, m] = v.split('-');
    const nombre = new Date(y, m - 1, 1).toLocaleDateString('es-BO', { month: 'long', year: 'numeric' });
    return { value: v, label: nombre.charAt(0).toUpperCase() + nombre.slice(1) };
  });
});

const mesSeleccionado = ref('');
if (!mesSeleccionado.value && mesesDisponibles.value.length) {
  mesSeleccionado.value = mesesDisponibles.value[0].value;
}

const prestamosFiltrados = computed(() => {
  if (modo.value === 'PAGADOS') return lista.value.filter(p => p.estado === 'PAGADO');
  if (modo.value === 'POR_MES') {
    if (!mesSeleccionado.value) return [];
    return lista.value.filter(p => {
      const d = new Date(p.fechaInicio);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return key === mesSeleccionado.value;
    });
  }
  // RECIENTES: ordenados por fechaInicio desc, top 5
  return [...lista.value]
    .sort((a, b) => new Date(b.fechaInicio) - new Date(a.fechaInicio))
    .slice(0, 5);
});
</script>