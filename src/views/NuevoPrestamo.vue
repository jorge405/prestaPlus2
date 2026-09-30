<template>
  <div class="space-y-4">
    <AppCard>
      <h2 class="font-bold text-lg mb-1">Nuevo préstamo</h2>
      <p class="text-xs text-slate-500 mb-4">
        Completa los datos del cliente y del préstamo. Al final se generará un código
        que el cliente usará para crear su cuenta.
      </p>

      <!-- Datos del cliente -->
      <p class="text-xs font-semibold text-slate-400 mb-2">DATOS DEL CLIENTE</p>
      <div class="space-y-3 mb-4">
        <AppInput v-model="form.nombre" label="Nombre completo" />
        <div class="grid grid-cols-2 gap-3">
          <AppInput v-model="form.ci" label="CI" />
          <AppInput v-model="form.telefono" label="Teléfono" />
        </div>
        <AppInput v-model="form.direccion" label="Dirección" />
        <AppInput v-model="form.correo" label="Correo (opcional)" type="email" />
      </div>

      <!-- Datos del préstamo -->
      <p class="text-xs font-semibold text-slate-400 mb-2">DATOS DEL PRÉSTAMO</p>
      <div class="space-y-3">
        <div class="grid grid-cols-2 gap-3">
          <AppInput v-model.number="form.monto" type="number" label="Monto (Bs.)" />
          <AppInput v-model.number="form.interesMensual" type="number" label="Interés %" />
        </div>
        <AppInput v-model.number="form.plazoMeses" type="number" label="Plazo (meses)" />

        <div>
          <label class="text-sm font-medium">Tipo de garantía</label>
          <select v-model="form.tipoGarantia"
            class="w-full mt-1 px-4 py-3 rounded-2xl border border-slate-200 focus:border-brand-500 outline-none">
            <option v-for="t in tipos" :key="t.value" :value="t.value">{{ t.label }}</option>
          </select>
        </div>

        <AppInput v-model="form.descripcion" label="Descripción del artículo" />
        <AppInput v-model.number="form.valorAvaluo" type="number" label="Valor de avalúo (Bs.)" />
      </div>

      <div v-if="form.monto && form.plazoMeses" class="mt-4 p-4 bg-brand-50 rounded-2xl text-sm">
        <p class="text-brand-800">Total a pagar: <b>Bs. {{ resumen.total }}</b></p>
        <p class="text-brand-800">Cuota mensual: <b>Bs. {{ resumen.cuota }}</b></p>
      </div>

      <p v-if="error" class="text-red-500 text-sm mt-3">{{ error }}</p>

      <div class="mt-5">
        <AppButton @click="crear" :disabled="!puedeCrear">Crear préstamo y generar código</AppButton>
      </div>
    </AppCard>

    <!-- Modal código generado -->
    <div v-if="codigoModal" class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div class="bg-white rounded-3xl w-full max-w-sm p-6 text-center my-4">
        <div class="w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center mx-auto mb-3 text-3xl">
          🎟
        </div>
        <h3 class="font-bold text-lg">¡Préstamo creado!</h3>
        <p class="text-xs text-slate-500 mt-1 mb-4">
          Comparte este código con <b>{{ codigoModal.nombre }}</b>. Lo usará para crear su cuenta y ver su préstamo.
        </p>

        <div class="bg-brand-50 rounded-2xl p-4 mb-4">
          <p class="text-xs text-brand-700">Código de invitación</p>
          <p class="font-extrabold text-2xl text-brand-800 font-mono tracking-wider mt-1">
            {{ codigoModal.codigo }}
          </p>
        </div>

        <div class="bg-slate-50 rounded-2xl p-3 mb-4 text-xs text-slate-600 text-left space-y-1">
          <p><b>Cliente:</b> {{ codigoModal.nombre }}</p>
          <p><b>CI:</b> {{ codigoModal.ci }}</p>
          <p><b>Préstamo:</b> {{ codigoModal.codigoVinculo }}</p>
          <p><b>Monto:</b> Bs. {{ codigoModal.monto }}</p>
          <p><b>Plazo:</b> {{ codigoModal.plazoMeses }} meses</p>
        </div>

        <div class="space-y-2">
          <AppButton @click="copiarCodigo">
            {{ copiado ? '✅ Copiado' : 'Copiar código' }}
          </AppButton>
          <AppButton variant="soft" @click="irAlPanel">Ir al panel</AppButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import AppCard from '../components/AppCard.vue';
import AppInput from '../components/AppInput.vue';
import AppButton from '../components/AppButton.vue';
import { usePrestamosStore } from '../stores/prestamos';
import { useAuthStore } from '../stores/auth';
import { storage } from '../services/storage';

const auth = useAuthStore();
const store = usePrestamosStore();
const router = useRouter();

const form = reactive({
  // Cliente
  nombre: '', ci: '', telefono: '', direccion: '', correo: '',
  // Préstamo
  monto: 1000, interesMensual: 5, plazoMeses: 6,
  tipoGarantia: 'JOYA', descripcion: '', valorAvaluo: 1500,
});
const error = ref('');
const codigoModal = ref(null);
const copiado = ref(false);

const tipos = [
  { value: 'JOYA', label: 'Joyería' },
  { value: 'ELECTRODOMESTICO', label: 'Electrodoméstico' },
  { value: 'VEHICULO', label: 'Vehículo' },
  { value: 'ELECTRONICA', label: 'Electrónica' },
  { value: 'HERRAMIENTA', label: 'Herramienta' },
  { value: 'MAQUINARIA', label: 'Maquinaria' },
  { value: 'INSTRUMENTO', label: 'Instrumento' },
  { value: 'COLECCION', label: 'Colección' },
  { value: 'PERSONAL', label: 'Personal' },
  { value: 'INMUEBLE', label: 'Inmueble' },
];

const puedeCrear = computed(() =>
  form.nombre.trim() &&
  form.ci.trim() &&
  form.telefono.trim() &&
  form.direccion.trim() &&
  form.monto > 0 &&
  form.plazoMeses > 0 &&
  form.descripcion.trim()
);

const resumen = computed(() => {
  const total = form.monto * (1 + (form.interesMensual / 100) * form.plazoMeses);
  return { total: total.toFixed(2), cuota: (total / form.plazoMeses).toFixed(2) };
});

const crear = () => {
  error.value = '';
  try {
    // 1) Crear préstamo SIN cliente
    const p = storage.crearPrestamo({
      clienteId: null,
      prestamistaId: auth.user.id,
      monto: form.monto,
      interesMensual: form.interesMensual,
      plazoMeses: form.plazoMeses,
      garantias: [{
        tipo: form.tipoGarantia,
        descripcion: form.descripcion || 'Sin descripción',
        valorAvaluo: form.valorAvaluo,
        fotos: [],
      }],
    });

    // 2) Crear la "solicitud" con los datos precargados del cliente
    storage.crearSolicitud({
      prestamistaId: auth.user.id,
      prestamoId: p.id,
      nombre: form.nombre.trim(),
      ci: form.ci.trim(),
      telefono: form.telefono.trim(),
      direccion: form.direccion.trim(),
      correo: form.correo.trim(),
    });

    // 3) Generar código de invitación ligado a ese préstamo
    const cod = storage.generarCodigoInvitacionParaPrestamo(
      auth.user.id, p.id, `Préstamo ${p.codigoVinculo}`
    );

    store.cargar();
    codigoModal.value = {
      codigo: cod.codigo,
      codigoVinculo: p.codigoVinculo,
      monto: p.monto,
      plazoMeses: p.plazoMeses,
      nombre: form.nombre,
      ci: form.ci,
    };
    copiado.value = false;
  } catch (e) {
    error.value = e.message;
  }
};

const copiarCodigo = async () => {
  try {
    await navigator.clipboard.writeText(codigoModal.value.codigo);
    copiado.value = true;
    setTimeout(() => (copiado.value = false), 1800);
  } catch {
    alert('Copia manualmente: ' + codigoModal.value.codigo);
  }
};

const irAlPanel = () => {
  codigoModal.value = null;
  router.push('/app/admin');
};
</script>