<template>
  <AuthLayout subtitulo="Ingresa a tu cuenta">
    <AppCard>
      <div class="space-y-4">
        <AppInput
          v-model="form.usuario"
          label="Correo o teléfono"
          placeholder="juan@demo.com o 71234567"
        />
        <AppInput v-model="form.password" type="password" label="Contraseña" placeholder="••••••••" />

        <p v-if="error" class="text-red-500 text-sm">{{ error }}</p>

        <AppButton @click="submit" :disabled="cargando">
          {{ cargando ? 'Ingresando...' : 'Iniciar sesión' }}
        </AppButton>

        <p class="text-center text-sm text-slate-500">
          ¿No tienes cuenta?
          <router-link to="/registro" class="text-brand-600 font-semibold">Regístrate</router-link>
        </p>
      </div>
    </AppCard>

    <div class="mt-6 p-4 bg-brand-50 rounded-2xl text-xs text-brand-800">
      <p class="font-semibold mb-1">Demo:</p>
      <p>Cliente: <b>juan@demo.com</b> o <b>71234567</b> / juan123</p>
      <p>Prestamista: <b>admin@presta.com</b> o <b>70000000</b> / admin123</p>
    </div>
  </AuthLayout>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import AuthLayout from '../layouts/AuthLayout.vue';
import AppCard from '../components/AppCard.vue';
import AppInput from '../components/AppInput.vue';
import AppButton from '../components/AppButton.vue';
import { useAuthStore } from '../stores/auth';

const form = reactive({ usuario: '', password: '' });
const error = ref('');
const cargando = ref(false);
const router = useRouter();
const auth = useAuthStore();

const submit = () => {
  error.value = ''; cargando.value = true;
  try {
    auth.login({ usuario: form.usuario, password: form.password });
    router.push(auth.isPrestamista ? '/app/admin' : '/app/dashboard');
  } catch (e) {
    error.value = e.message;
  } finally {
    cargando.value = false;
  }
};
</script>