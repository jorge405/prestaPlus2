import { defineStore } from 'pinia';
import { storage } from '../services/storage';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: storage.sesion(),
  }),
  getters: {
    isAuth: (s) => !!s.user,
    isPrestamista: (s) => s.user?.rol === 'PRESTAMISTA' || s.user?.rol === 'ADMIN',
  },
  actions: {
    login({ usuario, correo, ci, telefono, password }) {
      // Compatible con distintos nombres de campo
      const login = usuario || correo || ci || telefono;
      this.user = storage.login({ usuario: login, password });
    },
    registro(payload) {
      const u = storage.crearUsuario(payload);
      const { password: _, ...safe } = u;
      this.user = safe;
      localStorage.setItem('p_sesion', JSON.stringify(safe));
      return u;
    },
    logout() {
      storage.logout();
      this.user = null;
    },
  },
});