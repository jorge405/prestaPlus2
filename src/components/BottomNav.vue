<template>
  <nav class="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-4 py-3 flex justify-around items-center z-40">
    <router-link
      v-for="item in items"
      :key="item.label"
      :to="item.to"
      class="flex flex-col items-center gap-1 text-xs"
      :class="isActive(item.to) ? 'text-brand-600' : 'text-slate-400'"
    >
      <span class="text-xl">{{ item.icon }}</span>
      <span class="font-medium">{{ item.label }}</span>
    </router-link>
  </nav>
</template>
<script setup>
import { useRoute } from 'vue-router';
import { computed } from 'vue';
const props = defineProps({ rol: String });
const route = useRoute();
const isActive = (to) => route.path.startsWith(to);

const items = computed(() =>
  props.rol === 'CLIENTE'
    ? [
        { to: '/app/dashboard', icon: '🏠', label: 'Inicio' },
        { to: '/app/historial', icon: '🕘', label: 'Historial' },
        { to: '/app/garantias', icon: '💎', label: 'Garantías' },
        { to: '/app/perfil', icon: '👤', label: 'Perfil' },
      ]
    : [
        { to: '/app/admin',  icon: '📊', label: 'Panel' },
        { to: '/app/cobros', icon: '💰', label: 'Cobros' },
        { to: '/app/reportes', icon: '📈', label: 'Reportes' },
        { to: '/app/nuevo-prestamo', icon: '➕', label: 'Nuevo' },
      ]
);
</script>