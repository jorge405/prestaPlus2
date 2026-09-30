<template>
  <AppCard>
    <h3 class="font-bold text-lg mb-1">Verifica tu identidad</h3>
    <p class="text-sm text-slate-500 mb-4">
      Sube foto de tu carnet (frente y reverso) y una selfie.
      <br><b>Sin backend</b>: las imágenes se guardan localmente solo como demo.
    </p>

    <div class="space-y-3">
      <div>
        <label class="text-sm font-medium">Carnet · Frente</label>
        <input type="file" accept="image/*" @change="onFile('frente', $event)" class="mt-1 w-full text-sm" />
      </div>
      <div>
        <label class="text-sm font-medium">Carnet · Reverso</label>
        <input type="file" accept="image/*" @change="onFile('reverso', $event)" class="mt-1 w-full text-sm" />
      </div>
      <div>
        <label class="text-sm font-medium">Selfie</label>
        <input type="file" accept="image/*" capture="user" @change="onFile('selfie', $event)" class="mt-1 w-full text-sm" />
      </div>
    </div>

    <div v-if="preview" class="grid grid-cols-3 gap-2 mt-4">
      <img v-if="preview.frente" :src="preview.frente" class="rounded-xl object-cover h-20 w-full" />
      <img v-if="preview.reverso" :src="preview.reverso" class="rounded-xl object-cover h-20 w-full" />
      <img v-if="preview.selfie" :src="preview.selfie" class="rounded-xl object-cover h-20 w-full" />
    </div>

    <div class="mt-5">
      <AppButton @click="guardar">Guardar verificación</AppButton>
    </div>

    <p v-if="ok" class="text-brand-600 text-sm mt-3">{{ ok }}</p>
  </AppCard>
</template>
<script setup>
import { reactive, ref } from 'vue';
import AppCard from '../components/AppCard.vue';
import AppButton from '../components/AppButton.vue';
import { useAuthStore } from '../stores/auth';
import { storage } from '../services/storage';

const auth = useAuthStore();
const preview = reactive({ frente: null, reverso: null, selfie: null });
const ok = ref('');

const onFile = (key, e) => {
  const file = e.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => { preview[key] = ev.target.result; };
  reader.readAsDataURL(file);
};

const guardar = () => {
  storage.actualizarUsuario(auth.user.id, {
    fotoCarnetFrente: preview.frente,
    fotoCarnetReverso: preview.reverso,
    selfie: preview.selfie,
    verificado: true,
  });
  auth.user = storage.sesion();
  ok.value = '✅ Verificación guardada correctamente';
};
</script>