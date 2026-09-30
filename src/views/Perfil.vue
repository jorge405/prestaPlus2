<template>
  <div v-if="u" class="space-y-4">
    <!-- Cabecera -->
    <AppCard>
      <div class="flex items-center gap-4">
        <div class="w-16 h-16 rounded-2xl bg-brand-gradient flex items-center justify-center text-white text-2xl font-extrabold">
          {{ iniciales }}
        </div>
        <div class="flex-1">
          <p class="font-extrabold text-lg text-slate-800">{{ u.nombre }}</p>
          <p class="text-xs text-slate-500">CI {{ u.ci }}</p>
          <span class="text-[10px] px-2 py-0.5 rounded-full font-semibold mt-1 inline-block"
            :class="u.verificado ? 'bg-brand-100 text-brand-700' : 'bg-amber-100 text-amber-700'">
            {{ u.verificado ? '✅ Verificado' : '⏳ Pendiente' }}
          </span>
        </div>
      </div>
    </AppCard>

    <!-- Datos personales -->
    <AppCard>
      <p class="text-xs font-semibold text-slate-400 mb-3">DATOS PERSONALES</p>
      <DatoFila icon="📧" label="Correo" :value="u.correo" />
      <DatoFila icon="📱" label="Teléfono" :value="u.telefono || '—'" />
      <DatoFila icon="🪪" label="Carnet" :value="u.ci" />
      <DatoFila icon="📅" label="Registro" :value="fecha(u.createdAt)" />
      <DatoFila icon="🎫" label="Código vinculación" :value="codigoVinculo" />
    </AppCard>

    <!-- Resumen financiero -->
    <AppCard>
      <p class="text-xs font-semibold text-slate-400 mb-3">RESUMEN FINANCIERO</p>
      <div class="grid grid-cols-2 gap-3">
        <div class="bg-brand-50 rounded-2xl p-3">
          <p class="text-[11px] text-brand-700">Total prestado</p>
          <p class="font-extrabold text-brand-800">Bs. {{ stats.totalPrestado.toFixed(2) }}</p>
        </div>
        <div class="bg-slate-50 rounded-2xl p-3">
          <p class="text-[11px] text-slate-600">Total pagado</p>
          <p class="font-extrabold text-slate-800">Bs. {{ stats.totalPagado.toFixed(2) }}</p>
        </div>
        <div class="bg-amber-50 rounded-2xl p-3">
          <p class="text-[11px] text-amber-700">Saldo pendiente</p>
          <p class="font-extrabold text-amber-800">Bs. {{ stats.saldoPendiente.toFixed(2) }}</p>
        </div>
        <div class="bg-slate-50 rounded-2xl p-3">
          <p class="text-[11px] text-slate-600">Préstamos</p>
          <p class="font-extrabold text-slate-800">{{ stats.totalPrestamos }}</p>
        </div>
      </div>
    </AppCard>

    <!-- Mis préstamos -->
    <AppCard>
      <p class="text-xs font-semibold text-slate-400 mb-3">MIS PRÉSTAMOS</p>
      <div v-if="lista.length" class="space-y-2">
        <div v-for="p in lista" :key="p.id" @click="$router.push(`/app/prestamo/${p.id}`)"
             class="border border-slate-100 rounded-2xl p-3 cursor-pointer hover:bg-brand-50/40">
          <div class="flex justify-between items-center">
            <div>
              <p class="text-xs text-slate-400">{{ p.codigoVinculo }}</p>
              <p class="font-semibold text-slate-800">Bs. {{ p.monto }}</p>
              <p class="text-[11px] text-slate-500">{{ p.plazoMeses }} meses · {{ p.interesMensual }}%</p>
            </div>
            <span class="text-[11px] px-2 py-1 rounded-full font-semibold"
              :class="p.estado === 'PAGADO' ? 'bg-brand-100 text-brand-700' : 'bg-amber-100 text-amber-700'">
              {{ p.estado }}
            </span>
          </div>
        </div>
      </div>
      <p v-else class="text-xs text-slate-400">Sin préstamos aún.</p>
    </AppCard>

    <!-- Garantías -->
    <AppCard>
      <p class="text-xs font-semibold text-slate-400 mb-3">MIS GARANTÍAS</p>
      <div v-if="garantias.length" class="space-y-2">
        <div v-for="(g, i) in garantias" :key="i" class="flex justify-between border-b border-slate-50 pb-2">
          <div>
            <p class="font-semibold text-sm text-slate-800">{{ g.descripcion }}</p>
            <p class="text-[11px] text-slate-500">{{ g.tipo }}</p>
          </div>
          <p class="font-bold text-brand-700 text-sm">Bs. {{ g.valorAvaluo }}</p>
        </div>
      </div>
      <p v-else class="text-xs text-slate-400">Sin garantías.</p>
    </AppCard>

    <!-- Acciones -->
    <AppCard>
      <AppButton variant="ghost" @click="logout">Cerrar sesión</AppButton>
    </AppCard>
  </div>
</template>

<script setup>
import { computed, h, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import AppCard from '../components/AppCard.vue';
import AppButton from '../components/AppButton.vue';
import { useAuthStore } from '../stores/auth';
import { usePrestamosStore } from '../stores/prestamos';

const auth = useAuthStore();
const store = usePrestamosStore();
const router = useRouter();

onMounted(() => store.cargar());

const u = computed(() => auth.user);
const lista = computed(() => store.lista);

const iniciales = computed(() => {
  const n = u.value?.nombre || '';
  return n.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase();
});

const codigoVinculo = computed(() => lista.value[0]?.codigoVinculo || '—');

const garantias = computed(() =>
  lista.value.flatMap(p => (p.garantias || []).map(g => ({ ...g, codigo: p.codigoVinculo })))
);

const stats = computed(() => {
  const totalPrestado = lista.value.reduce((a, p) => a + Number(p.monto), 0);
  const totalPagado = lista.value.reduce((a, p) =>
    a + p.cuotas.filter(c => c.estado === 'PAGADA').reduce((s, c) => s + c.monto, 0), 0);
  const saldoPendiente = lista.value.reduce((a, p) =>
    a + p.cuotas.filter(c => c.estado !== 'PAGADA').reduce((s, c) => s + c.monto, 0), 0);
  return {
    totalPrestado,
    totalPagado,
    saldoPendiente,
    totalPrestamos: lista.value.length,
  };
});

const fecha = (iso) => iso ? new Date(iso).toLocaleDateString('es-BO') : '—';

// Componente inline para fila de dato
const DatoFila = (props) => h('div', { class: 'flex justify-between py-2 border-b border-slate-50 last:border-0' }, [
  h('span', { class: 'text-xs text-slate-500' }, `${props.icon} ${props.label}`),
  h('span', { class: 'text-xs font-semibold text-slate-800 text-right max-w-[60%] truncate' }, props.value || '—'),
]);
DatoFila.props = ['icon', 'label', 'value'];

const logout = () => {
  auth.logout();
  router.push('/login');
};
</script>