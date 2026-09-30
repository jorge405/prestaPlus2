<template>
  <div class="space-y-4">
    <AppCard>
      <h2 class="font-bold text-lg mb-1">Reportes</h2>
      <p class="text-xs text-slate-500">Genera reportes en PDF</p>
    </AppCard>

    <!-- KPIs -->
    <div class="grid grid-cols-2 gap-3">
      <AppCard><p class="text-xs text-slate-500">Cartera</p><p class="text-xl font-extrabold text-brand-700">Bs. {{ kpis.cartera }}</p></AppCard>
      <AppCard><p class="text-xs text-slate-500">Recaudado</p><p class="text-xl font-extrabold text-brand-700">Bs. {{ kpis.recaudado }}</p></AppCard>
      <AppCard><p class="text-xs text-slate-500">Pendiente</p><p class="text-xl font-extrabold text-amber-600">Bs. {{ kpis.pendiente }}</p></AppCard>
      <AppCard><p class="text-xs text-slate-500">En mora</p><p class="text-xl font-extrabold text-red-600">Bs. {{ kpis.mora }}</p></AppCard>
    </div>

    <!-- Reporte 1: Clientes del mes -->
    <AppCard>
      <p class="font-semibold text-slate-800 mb-1">📅 Clientes del mes</p>
      <p class="text-xs text-slate-500 mb-3">Clientes que obtuvieron un préstamo en el mes seleccionado</p>

      <select v-model="mesReporte"
        class="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm mb-3">
        <option v-for="m in meses" :key="m.value" :value="m.value">{{ m.label }}</option>
      </select>

      <div class="bg-brand-50 rounded-2xl p-3 mb-3">
        <p class="text-xs text-brand-700">Clientes en {{ etiquetaMes(mesReporte) }}</p>
        <p class="font-bold text-brand-800 text-lg">{{ clientesDelMes.length }}</p>
      </div>

      <AppButton @click="pdfClientesMes">📄 Generar PDF</AppButton>
    </AppCard>

    <!-- Reporte 2: Historial por cliente -->
    <AppCard>
      <p class="font-semibold text-slate-800 mb-1">👤 Historial por cliente</p>
      <p class="text-xs text-slate-500 mb-3">Todos los préstamos y pagos de un cliente</p>

      <select v-model="clienteSeleccionado"
        class="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm mb-3">
        <option value="">Selecciona un cliente...</option>
        <option v-for="c in clientes" :key="c.id" :value="c.id">
          {{ c.nombre }} — CI {{ c.ci }}
        </option>
      </select>

      <div v-if="clienteActual" class="bg-brand-50 rounded-2xl p-3 mb-3 space-y-1">
        <p class="text-sm font-semibold text-brand-800">{{ clienteActual.nombre }}</p>
        <p class="text-xs text-brand-700">{{ prestamosCliente.length }} préstamos · Bs. {{ totalPrestadoCliente.toFixed(2) }} otorgado</p>
        <p class="text-xs text-brand-700">Bs. {{ totalPagadoCliente.toFixed(2) }} pagado</p>
      </div>

      <AppButton @click="pdfHistorialCliente" :disabled="!clienteSeleccionado">
        📄 Generar PDF
      </AppButton>
    </AppCard>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import AppCard from '../components/AppCard.vue';
import AppButton from '../components/AppButton.vue';
import { usePrestamosStore } from '../stores/prestamos';
import { storage } from '../services/storage';
import { generarPDF } from '../utils/pdf';

const store = usePrestamosStore();
onMounted(() => store.cargar());

const lista = computed(() => store.lista);

const kpis = computed(() => {
  const cartera = lista.value.reduce((a, p) => a + Number(p.monto), 0);
  let recaudado = 0, pendiente = 0, mora = 0;
  const hoy = new Date();
  lista.value.forEach(p => p.cuotas.forEach(c => {
    if (c.estado === 'PAGADA') recaudado += c.monto;
    else {
      pendiente += c.monto;
      if (new Date(c.fechaVencimiento) < hoy) mora += c.monto;
    }
  }));
  return {
    cartera: cartera.toFixed(2),
    recaudado: recaudado.toFixed(2),
    pendiente: pendiente.toFixed(2),
    mora: mora.toFixed(2),
  };
});

// --- Clientes
const clientes = computed(() => storage.usuarios().filter(u => u.rol === 'CLIENTE'));

// --- Meses
const meses = computed(() => {
  const set = new Set();
  lista.value.forEach(p => {
    const d = new Date(p.fechaInicio);
    set.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  });
  const arr = Array.from(set).sort().reverse();
  return arr.map(v => {
    const [y, m] = v.split('-');
    const n = new Date(y, m - 1, 1).toLocaleDateString('es-BO', { month: 'long', year: 'numeric' });
    return { value: v, label: n.charAt(0).toUpperCase() + n.slice(1) };
  });
});

const mesReporte = ref('');
if (meses.value.length) mesReporte.value = meses.value[0].value;

const etiquetaMes = (v) => {
  if (!v) return '';
  const [y, m] = v.split('-');
  const n = new Date(y, m - 1, 1).toLocaleDateString('es-BO', { month: 'long', year: 'numeric' });
  return n.charAt(0).toUpperCase() + n.slice(1);
};

// --- Reporte 1: clientes del mes
const clientesDelMes = computed(() => {
  if (!mesReporte.value) return [];
  return lista.value
    .filter(p => {
      const d = new Date(p.fechaInicio);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === mesReporte.value;
    })
    .map(p => ({
      prestamo: p,
      cliente: storage.usuarioPorId(p.clienteId),
    }));
});

const pdfClientesMes = () => {
  const filas = clientesDelMes.value.map(x => [
    x.cliente?.nombre || '—',
    x.cliente?.ci || '—',
    x.cliente?.correo || '—',
    `Bs. ${x.prestamo.monto}`,
    `${x.prestamo.plazoMeses} meses`,
    `Bs. ${x.prestamo.totalPagar}`,
    x.prestamo.estado,
  ]);

  generarPDF({
    titulo: 'Reporte de clientes del mes',
    subtitulo: etiquetaMes(mesReporte.value),
    columnas: ['Cliente', 'CI', 'Correo', 'Monto', 'Plazo', 'Total', 'Estado'],
    filas,
    pie: `Total préstamos: ${filas.length}`,
  });
};

// --- Reporte 2: historial por cliente
const clienteSeleccionado = ref('');
const clienteActual = computed(() => storage.usuarioPorId(clienteSeleccionado.value));

const prestamosCliente = computed(() => {
  if (!clienteSeleccionado.value) return [];
  return lista.value.filter(p => p.clienteId === clienteSeleccionado.value);
});

const totalPrestadoCliente = computed(() =>
  prestamosCliente.value.reduce((a, p) => a + Number(p.monto), 0)
);
const totalPagadoCliente = computed(() =>
  prestamosCliente.value.reduce((a, p) =>
    a + p.cuotas.filter(c => c.estado === 'PAGADA').reduce((s, c) => s + c.monto, 0), 0)
);

const pdfHistorialCliente = () => {
  const c = clienteActual.value;
  const filas = [];
  prestamosCliente.value.forEach(p => {
    filas.push([
      p.codigoVinculo,
      `Bs. ${p.monto}`,
      `${p.interesMensual}% · ${p.plazoMeses}m`,
      `Bs. ${p.totalPagar}`,
      p.estado,
      new Date(p.fechaInicio).toLocaleDateString('es-BO'),
    ]);
  });

  // Se agrega una segunda tabla en el pie describiendo pagos
  const pagosFilas = [];
  prestamosCliente.value.forEach(p => {
    p.cuotas.filter(cu => cu.estado === 'PAGADA').forEach(cu => {
      pagosFilas.push([
        p.codigoVinculo,
        `Cuota ${cu.numero}`,
        `Bs. ${cu.monto}`,
        cu.metodo || 'EFECTIVO',
        new Date(cu.fechaPago).toLocaleDateString('es-BO'),
      ]);
    });
  });

  // Se combinan ambas tablas en un solo PDF
  const titulo = `Historial del cliente: ${c.nombre}`;
  generarPDF({
    titulo,
    subtitulo: `CI ${c.ci} · ${c.correo || '—'}`,
    columnas: ['Código', 'Monto', 'Interés/Plazo', 'Total', 'Estado', 'Inicio'],
    filas,
    pie: `Préstamos: ${filas.length} · Pagado: Bs. ${totalPagadoCliente.value.toFixed(2)} | Pagos: ${pagosFilas.length}`,
  });
};
</script>