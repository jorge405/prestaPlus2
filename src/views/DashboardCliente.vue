<template>
  <div class="space-y-4">
    <AppCard v-if="prestamoActivo">
      <p class="text-xs text-slate-500 font-medium">SALDO PENDIENTE</p>
      <h2 class="text-3xl font-extrabold text-brand-700 mt-1">
        Bs. {{ saldoPendiente.toFixed(2) }}
      </h2>
      <div class="w-full bg-slate-100 rounded-full h-2 mt-3">
        <div class="bg-brand-gradient h-2 rounded-full" :style="{ width: progreso + '%' }"></div>
      </div>
      <p class="text-xs text-slate-500 mt-2">
        Próxima cuota: <b>{{ formatoFecha(proximaCuota?.fechaVencimiento) }}</b>
        · Bs. {{ proximaCuota?.monto }}
      </p>

      <div class="mt-4 grid grid-cols-2 gap-3">
        <router-link to="/app/perfil">
          <AppButton variant="soft">👤 Mi perfil</AppButton>
        </router-link>
        <router-link to="/app/historial">
          <AppButton variant="soft">🕘 Historial</AppButton>
        </router-link>
      </div>

      <p class="text-[11px] text-slate-400 text-center mt-3">
        Entra a un préstamo para pagar cuotas o ver el detalle
      </p>
    </AppCard>

    <AppCard v-else>
      <p class="text-slate-500 text-sm">Aún no tienes préstamos vinculados.</p>
      <p class="text-xs text-slate-400 mt-1">Pide a tu prestamista un código e ingrésalo en tu registro.</p>
      <div class="mt-4">
        <router-link to="/app/perfil">
          <AppButton variant="soft">👤 Ver mi perfil</AppButton>
        </router-link>
      </div>
    </AppCard>

    <h3 class="font-bold text-slate-800 mt-6">Mis préstamos</h3>
    <div v-for="p in lista" :key="p.id" @click="$router.push(`/app/prestamo/${p.id}`)">
      <AppCard class="cursor-pointer">
        <div class="flex justify-between items-center">
          <div>
            <p class="text-xs text-slate-400">{{ p.codigoVinculo }}</p>
            <p class="font-bold text-slate-800">Bs. {{ p.monto }}</p>
            <p class="text-xs text-slate-500">{{ p.plazoMeses }} meses · {{ p.interesMensual }}%</p>
          </div>
          <span class="text-xs px-3 py-1 rounded-full font-semibold"
            :class="p.estado === 'PAGADO' ? 'bg-brand-100 text-brand-700' : 'bg-amber-100 text-amber-700'">
            {{ p.estado }}
          </span>
        </div>
      </AppCard>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import AppCard from '../components/AppCard.vue';
import AppButton from '../components/AppButton.vue';
import { usePrestamosStore } from '../stores/prestamos';

const store = usePrestamosStore();
onMounted(() => store.cargar());

const lista = computed(() => store.lista);
const prestamoActivo = computed(() => lista.value.find(p => p.estado === 'ACTIVO'));
const proximaCuota = computed(() => prestamoActivo.value?.cuotas.find(c => c.estado === 'PENDIENTE'));

const saldoPendiente = computed(() =>
  lista.value.reduce((acc, p) =>
    acc + p.cuotas.filter(c => c.estado !== 'PAGADA').reduce((a, c) => a + c.monto, 0), 0)
);

const progreso = computed(() => {
  const total = lista.value.reduce((a, p) => a + p.cuotas.length, 0);
  const pagadas = lista.value.reduce((a, p) => a + p.cuotas.filter(c => c.estado === 'PAGADA').length, 0);
  return total ? Math.round((pagadas / total) * 100) : 0;
});

const formatoFecha = (iso) =>
  iso ? new Date(iso).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
</script>