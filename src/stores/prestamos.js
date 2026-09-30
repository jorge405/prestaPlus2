import { defineStore } from 'pinia';
import { storage } from '../services/storage';
import { useAuthStore } from './auth';

export const usePrestamosStore = defineStore('prestamos', {
  state: () => ({ lista: [], historial: [] }),
  actions: {
    cargar() {
      const auth = useAuthStore();
      this.lista = storage.prestamosDe(auth.user);
      this.historial = storage.historialDe(auth.user);
    },
    crear(payload) {
      const auth = useAuthStore();
      const p = storage.crearPrestamo({ ...payload, prestamistaId: auth.user.id });
      this.cargar();
      return p;
    },
    subirComprobante(prestamoId, cuotaId, data) {
      storage.subirComprobante(prestamoId, cuotaId, data);
      this.cargar();
    },
    verificarPago(prestamoId, cuotaId, aprobado) {
      storage.verificarPago(prestamoId, cuotaId, aprobado);
      this.cargar();
    },
    vincular(codigo) {
      const auth = useAuthStore();
      storage.vincularPorCodigo(codigo, auth.user.id);
      this.cargar();
    },
  },
});