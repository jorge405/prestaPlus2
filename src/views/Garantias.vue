<template>
  <div class="space-y-4">
    <AppCard>
      <p class="text-xs text-slate-500">VALOR TOTAL EN GARANTÍAS</p>
      <h2 class="text-3xl font-extrabold text-brand-700">Bs. {{ total.toFixed(2) }}</h2>
      <p class="text-xs text-slate-500 mt-1">{{ items.length }} artículos</p>
    </AppCard>

    <AppCard v-for="(g, i) in items" :key="i">
      <div class="flex justify-between items-start">
        <div>
          <p class="text-xs text-slate-400">{{ etiquetaTipo(g.tipo) }}</p>
          <p class="font-bold text-slate-800">{{ g.descripcion }}</p>
          <p class="text-xs text-slate-500 mt-1">Préstamo {{ g.codigoVinculo }}</p>
          <p class="text-xs text-slate-500">Estado: {{ g.estado }}</p>
        </div>
        <div class="text-right">
          <p class="text-xs text-slate-400">Avalúo</p>
          <p class="font-extrabold text-brand-700 text-lg">Bs. {{ g.valorAvaluo }}</p>
        </div>
      </div>
    </AppCard>

    <AppCard v-if="!items.length">
      <p class="text-slate-500 text-sm">No tienes garantías registradas.</p>
    </AppCard>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import AppCard from '../components/AppCard.vue';
import { usePrestamosStore } from '../stores/prestamos';

const store = usePrestamosStore();
onMounted(() => store.cargar());

const items = computed(() =>
  store.lista.flatMap(p =>
    (p.garantias || []).map(g => ({
      ...g,
      estado: p.estado,
      codigoVinculo: p.codigoVinculo,
    }))
  )
);

const total = computed(() => items.value.reduce((a, g) => a + Number(g.valorAvaluo), 0));

const etiquetaTipo = (t) => ({
  JOYA: 'Joyería', ELECTRODOMESTICO: 'Electrodoméstico', VEHICULO: 'Vehículo',
  ELECTRONICA: 'Electrónica', HERRAMIENTA: 'Herramienta', MAQUINARIA: 'Maquinaria',
  INSTRUMENTO: 'Instrumento', COLECCION: 'Colección', PERSONAL: 'Personal', INMUEBLE: 'Inmueble',
}[t] || t);
</script>