import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const routes = [
  { path: '/', component: () => import('../views/Splash.vue') },
  { path: '/login', component: () => import('../views/Login.vue'), meta: { publicOnly: true } },
  { path: '/registro', component: () => import('../views/Registro.vue'), meta: { publicOnly: true } },
  {
    path: '/app',
    component: () => import('../layouts/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: 'dashboard', component: () => import('../views/DashboardCliente.vue') },

      // 🆕 Cliente
      { path: 'historial', component: () => import('../views/Historial.vue') },
      { path: 'garantias', component: () => import('../views/Garantias.vue') },
      { path: 'prestamo/:id', component: () => import('../views/DetallePrestamo.vue') },
      { path: 'perfil', component: () => import('../views/Perfil.vue') },

      // 🆕 Prestamista
      { path: 'admin', component: () => import('../views/DashboardPrestamista.vue'), meta: { prestamista: true } },
      { path: 'cobros', component: () => import('../views/Cobros.vue'), meta: { prestamista: true } },
      { path: 'cobro/:id', component: () => import('../views/CobroDetalle.vue'), meta: { prestamista: true } },
      { path: 'reportes', component: () => import('../views/Reportes.vue'), meta: { prestamista: true } },
      { path: 'nuevo-prestamo', component: () => import('../views/NuevoPrestamo.vue'), meta: { prestamista: true } },
    ],
  },
];

const router = createRouter({ history: createWebHistory(), routes });

router.beforeEach((to) => {
  const auth = useAuthStore();
  if (to.meta.requiresAuth && !auth.isAuth) return '/login';
  if (to.meta.prestamista && !auth.isPrestamista) return '/app/dashboard';
  if (to.meta.publicOnly && auth.isAuth) {
    return auth.isPrestamista ? '/app/admin' : '/app/dashboard';
  }
});

export default router;