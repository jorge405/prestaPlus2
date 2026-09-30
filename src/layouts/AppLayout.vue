<template>
  <div class="min-h-screen bg-slate-50 pb-24">
    <header class="bg-brand-gradient text-white px-5 pt-8 pb-14 rounded-b-[2rem]">
      <div class="max-w-md mx-auto flex items-center justify-between">
        <div>
          <p class="text-brand-50 text-xs">Bienvenido</p>
          <h2 class="font-bold text-lg">{{ auth.user?.nombre }}</h2>
        </div>
        <button @click="logout" class="text-xs bg-white/20 px-3 py-1.5 rounded-full">
          Salir
        </button>
      </div>
    </header>
    <main class="max-w-md mx-auto px-5 -mt-10">
      <router-view />
    </main>
    <BottomNav :rol="auth.user?.rol" />
  </div>
</template>
<script setup>
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import BottomNav from '../components/bottomNav.vue';

const auth = useAuthStore();
const router = useRouter();
const logout = () => { auth.logout(); router.push('/login'); };
</script>