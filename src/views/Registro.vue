<template>
  <AuthLayout subtitulo="Regístrate con el código que te dio tu prestamista">
    <AppCard>
      <!-- Paso 1: código -->
      <div v-if="!datos">
        <p class="text-sm font-semibold text-slate-700 mb-1">Paso 1 · Tu código</p>
        <p class="text-xs text-slate-500 mb-4">
          Ingresa el código que te entregó el prestamista al crear tu préstamo.
        </p>

        <AppInput v-model="codigo" label="Código de invitación" placeholder="INV-XXXXXX" />

        <p v-if="error" class="text-red-500 text-sm mt-3">{{ error }}</p>

        <div class="mt-4">
          <AppButton @click="validar">Continuar</AppButton>
        </div>
      </div>

      <!-- Paso 2: confirmar datos + crear contraseña -->
      <div v-else>
        <p class="text-sm font-semibold text-slate-700 mb-1">Paso 2 · Confirma tus datos</p>
        <p class="text-xs text-slate-500 mb-4">
          Hemos cargado tus datos. Solo elige cómo iniciar sesión y crea una contraseña.
        </p>

        <!-- Datos readonly -->
        <div class="space-y-3 mb-4">
          <AppInput v-model="datos.nombre" label="Nombre completo" />
          <div class="grid grid-cols-2 gap-3">
            <AppInput v-model="datos.ci" label="CI" />
            <AppInput v-model="datos.telefono" label="Teléfono" />
          </div>
          <AppInput v-model="datos.direccion" label="Dirección" />
          <AppInput v-model="datos.correo" label="Correo (opcional)" type="email" />
        </div>

        <!-- Elegir usuario -->
        <p class="text-xs font-semibold text-slate-400 mb-2">¿CON QUÉ QUIERES INICIAR SESIÓN?</p>
        <div class="grid grid-cols-2 gap-2 mb-3">
          <button
            type="button"
            @click="usuarioTipo = 'TELEFONO'"
            :class="['rounded-2xl p-3 border-2 transition text-sm font-semibold',
                     usuarioTipo === 'TELEFONO' ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600']"
          >
            📱 Teléfono
          </button>
          <button
            type="button"
            @click="usuarioTipo = 'CORREO'"
            :disabled="!datos.correo"
            :class="['rounded-2xl p-3 border-2 transition text-sm font-semibold',
                     usuarioTipo === 'CORREO' ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600',
                     !datos.correo && 'opacity-40 pointer-events-none']"
          >
            📧 Correo
          </button>
        </div>

        <p class="text-xs text-slate-500 mb-3">
          Tu usuario será: <b class="text-slate-800">{{ usuarioElegido }}</b>
        </p>

        <AppInput v-model="password" label="Contraseña" type="password" placeholder="Mínimo 6 caracteres" />
        <AppInput v-model="password2" label="Repetir contraseña" type="password" />

        <p v-if="error" class="text-red-500 text-sm mt-3">{{ error }}</p>
        <p v-if="ok" class="text-brand-600 text-sm mt-3">{{ ok }}</p>

        <div class="mt-4 space-y-2">
          <AppButton @click="crear" :disabled="!puedeCrear">
            {{ cargando ? 'Creando...' : 'Crear cuenta' }}
          </AppButton>
          <AppButton variant="ghost" @click="volver">Cambiar código</AppButton>
        </div>
      </div>

      <p class="text-center text-sm text-slate-500 mt-4">
        ¿Ya tienes cuenta?
        <router-link to="/login" class="text-brand-600 font-semibold">Ingresa</router-link>
      </p>
    </AppCard>
  </AuthLayout>
</template>

<script setup>
import { computed, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import AuthLayout from '../layouts/AuthLayout.vue';
import AppCard from '../components/AppCard.vue';
import AppInput from '../components/AppInput.vue';
import AppButton from '../components/AppButton.vue';
import { useAuthStore } from '../stores/auth';
import { storage } from '../services/storage';

const router = useRouter();
const auth = useAuthStore();

const codigo = ref('');
const datos = ref(null);         // datos autocompletados
const usuarioTipo = ref('TELEFONO');
const password = ref('');
const password2 = ref('');
const error = ref('');
const ok = ref('');
const cargando = ref(false);
const solicitudId = ref(null);

const usuarioElegido = computed(() => {
  if (!datos.value) return '';
  return usuarioTipo.value === 'TELEFONO' ? datos.value.telefono : datos.value.correo;
});

const puedeCrear = computed(() =>
  datos.value &&
  usuarioElegido.value &&
  password.value.length >= 6 &&
  password.value === password2.value
);

// Paso 1: validar código y traer datos
const validar = () => {
  error.value = '';
  try {
    const c = storage.validarCodigo(codigo.value.trim().toUpperCase());
    const sol = storage.solicitudPorCodigo(c.codigo);
    if (!sol) throw new Error('No se encontraron datos para este código');
    if (sol.usada) throw new Error('Esta solicitud ya fue usada');

    solicitudId.value = sol.id;
    datos.value = reactive({
      nombre: sol.nombre,
      ci: sol.ci,
      telefono: sol.telefono,
      direccion: sol.direccion,
      correo: sol.correo || '',
    });
    // Por defecto usar teléfono; si no hay, usar correo
    usuarioTipo.value = sol.telefono ? 'TELEFONO' : 'CORREO';
  } catch (e) {
    error.value = e.message;
  }
};

// Paso 2: crear cuenta
const crear = () => {
  error.value = ''; ok.value = ''; cargando.value = true;
  try {
    if (password.value !== password2.value) throw new Error('Las contraseñas no coinciden');
    if (password.value.length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres');

    // 1) Crear usuario con los datos de la solicitud
    const user = storage.crearUsuario({
      nombre: datos.value.nombre,
      ci: datos.value.ci,
      telefono: datos.value.telefono,
      correo: datos.value.correo || null,
      direccion: datos.value.direccion,
      password: password.value,
      rol: 'CLIENTE',
    });

    // 2) Guardar sesión manualmente (mismo formato que login)
    const { password: _, ...safe } = user;
    localStorage.setItem('p_sesion', JSON.stringify(safe));
    auth.user = safe;

    // 3) Vincular préstamo al usuario
    storage.asociarPrestamoAUsuarioPorCodigo(codigo.value.trim().toUpperCase(), user.id);

    // 4) Consumir el código
    storage.consumirCodigo(codigo.value.trim().toUpperCase(), user.id);

    // 5) Marcar solicitud como usada
    if (solicitudId.value) storage.marcarSolicitudUsada(solicitudId.value, user.id);

    ok.value = 'Cuenta creada. Redirigiendo...';
    setTimeout(() => router.push('/app/dashboard'), 800);
  } catch (e) {
    error.value = e.message;
  } finally {
    cargando.value = false;
  }
};

const volver = () => {
  datos.value = null;
  codigo.value = '';
  password.value = '';
  password2.value = '';
  error.value = '';
  ok.value = '';
};
</script>