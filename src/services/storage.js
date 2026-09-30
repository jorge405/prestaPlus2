// Capa de persistencia sobre localStorage (sin backend)

const K = {
  USUARIOS: 'p_usuarios',
  SESION: 'p_sesion',
  PRESTAMOS: 'p_prestamos',
  CODIGOS: 'p_codigos',
  SOLICITUDES: 'p_solicitudes', // 🆕 datos precargados por el admin
};

const read = (k, def = []) => {
  try { return JSON.parse(localStorage.getItem(k)) ?? def; }
  catch { return def; }
};
const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
const codigoVinculo = () => 'PRS-' + Math.random().toString(36).slice(2, 8).toUpperCase();
const codigoInvitacion = () => 'INV-' + Math.random().toString(36).slice(2, 8).toUpperCase();

export const storage = {
  // ---------- Usuarios
  usuarios: () => read(K.USUARIOS, []),
  guardarUsuarios: (u) => write(K.USUARIOS, u),

  crearUsuario({
    nombre, ci, correo, telefono, direccion = '',
    password, rol = 'CLIENTE', verificado = true,
  }) {
    const usuarios = this.usuarios();
    if (correo && usuarios.some(u => u.correo === correo)) {
      throw new Error('Ese correo ya está registrado');
    }
    if (telefono && usuarios.some(u => u.telefono === telefono)) {
      throw new Error('Ese teléfono ya está registrado');
    }
    if (ci && usuarios.some(u => u.ci === ci)) {
      throw new Error('Ese CI ya está registrado');
    }

    const user = {
      id: uid(), nombre, ci, correo: correo || null, telefono: telefono || null,
      direccion, password, rol, verificado,
      fotoCarnet: null, selfie: null,
      createdAt: new Date().toISOString(),
    };
    usuarios.push(user);
    this.guardarUsuarios(usuarios);
    return user;
  },

  /** Login aceptando correo O teléfono O ci */
  login({ usuario, password }) {
    const u = this.usuarios().find(x =>
      (x.correo === usuario || x.telefono === usuario || x.ci === usuario)
      && x.password === password
    );
    if (!u) throw new Error('Credenciales inválidas');
    const { password: _, ...safe } = u;
    write(K.SESION, safe);
    return safe;
  },

  logout() { localStorage.removeItem(K.SESION); },
  sesion: () => read(K.SESION, null),

  actualizarUsuario(id, patch) {
    const arr = this.usuarios();
    const idx = arr.findIndex(u => u.id === id);
    if (idx === -1) return null;
    arr[idx] = { ...arr[idx], ...patch };
    this.guardarUsuarios(arr);
    if (this.sesion()?.id === id) {
      const { password: _, ...safe } = arr[idx];
      write(K.SESION, safe);
    }
    return arr[idx];
  },
  usuarioPorId: (id) => storage.usuarios().find(u => u.id === id),

  // ---------- Solicitudes precargadas por el admin 🆕
  solicitudes: () => read(K.SOLICITUDES, []),
  guardarSolicitudes: (s) => write(K.SOLICITUDES, s),

  crearSolicitud({ prestamistaId, prestamoId, nombre, ci, telefono, direccion, correo = '' }) {
    const arr = this.solicitudes();
    const s = {
      id: uid(),
      prestamistaId,
      prestamoId,
      nombre, ci, telefono, direccion, correo,
      usada: false,
      createdAt: new Date().toISOString(),
    };
    arr.push(s);
    this.guardarSolicitudes(arr);
    return s;
  },

  solicitudPorPrestamo(prestamoId) {
    return this.solicitudes().find(s => s.prestamoId === prestamoId && !s.usada) || null;
  },

  /** Busca la solicitud asociada a un código */
  solicitudPorCodigo(codigo) {
    const cod = this.codigos().find(c => c.codigo === codigo);
    if (!cod || !cod.prestamoId) return null;
    return this.solicitudes().find(s => s.prestamoId === cod.prestamoId) || null;
  },

  marcarSolicitudUsada(solicitudId, clienteId) {
    const arr = this.solicitudes();
    const s = arr.find(x => x.id === solicitudId);
    if (!s) return;
    s.usada = true;
    s.clienteId = clienteId;
    s.usadaEn = new Date().toISOString();
    this.guardarSolicitudes(arr);
  },

  // ---------- Códigos de invitación
  codigos: () => read(K.CODIGOS, []),
  guardarCodigos: (c) => write(K.CODIGOS, c),

  generarCodigoInvitacionParaPrestamo(prestamistaId, prestamoId, nota = '') {
    const arr = this.codigos();
    let codigo;
    do { codigo = codigoInvitacion(); } while (arr.some(c => c.codigo === codigo));

    const nuevo = {
      codigo,
      prestamistaId,
      prestamoId,
      nota,
      usado: false,
      usadoPorId: null,
      createdAt: new Date().toISOString(),
    };
    arr.push(nuevo);
    this.guardarCodigos(arr);
    return nuevo;
  },

  generarCodigoInvitacion(prestamistaId, nota = '') {
    const arr = this.codigos();
    let codigo;
    do { codigo = codigoInvitacion(); } while (arr.some(c => c.codigo === codigo));

    const nuevo = {
      codigo, prestamistaId, prestamoId: null, nota,
      usado: false, usadoPorId: null,
      createdAt: new Date().toISOString(),
    };
    arr.push(nuevo);
    this.guardarCodigos(arr);
    return nuevo;
  },

  validarCodigo(codigo) {
    const c = this.codigos().find(x => x.codigo === codigo);
    if (!c) throw new Error('Código inválido');
    if (c.usado) throw new Error('Este código ya fue usado');
    return c;
  },

  consumirCodigo(codigo, usuarioId) {
    const arr = this.codigos();
    const c = arr.find(x => x.codigo === codigo);
    if (!c) return;
    c.usado = true;
    c.usadoPorId = usuarioId;
    c.usadoEn = new Date().toISOString();
    this.guardarCodigos(arr);
  },

  asociarPrestamoAUsuarioPorCodigo(codigo, clienteId) {
    const cod = this.codigos().find(c => c.codigo === codigo);
    if (!cod || !cod.prestamoId) return null;

    const arr = this.prestamos();
    const p = arr.find(x => x.id === cod.prestamoId);
    if (!p) return null;
    if (p.clienteId) return null;

    p.clienteId = clienteId;
    this.guardarPrestamos(arr);
    return p;
  },

  // ---------- Préstamos
  prestamos: () => read(K.PRESTAMOS, []),
  guardarPrestamos: (p) => write(K.PRESTAMOS, p),

  crearPrestamo({ clienteId = null, prestamistaId, monto, interesMensual, plazoMeses, garantias = [] }) {
    const total = +(monto * (1 + (interesMensual / 100) * plazoMeses)).toFixed(2);
    const cuotaMonto = +(total / plazoMeses).toFixed(2);
    const cuotas = Array.from({ length: plazoMeses }).map((_, i) => {
      const f = new Date(); f.setMonth(f.getMonth() + i + 1);
      return {
        id: uid(), numero: i + 1, monto: cuotaMonto,
        fechaVencimiento: f.toISOString(),
        estado: 'PENDIENTE',
        fechaPago: null,
        metodo: null,
        comprobante: null,
        notaCliente: '',
        enviadoEn: null,
        verificadoEn: null,
        motivoRechazo: null,
      };
    });
    const p = {
      id: uid(), codigoVinculo: codigoVinculo(),
      clienteId, prestamistaId,
      monto: +monto, interesMensual: +interesMensual, plazoMeses: +plazoMeses,
      totalPagar: total, estado: 'ACTIVO',
      fechaInicio: new Date().toISOString(),
      garantias, cuotas,
    };
    const arr = this.prestamos();
    arr.push(p);
    this.guardarPrestamos(arr);
    return p;
  },

  vincularPorCodigo(codigo, clienteId) {
    const arr = this.prestamos();
    const p = arr.find(x => x.codigoVinculo === codigo);
    if (!p) throw new Error('Código inválido');
    if (p.clienteId) throw new Error('Código ya usado');
    p.clienteId = clienteId;
    this.guardarPrestamos(arr);
    return p;
  },

  prestamosDe(usuario) {
    const all = this.prestamos();
    if (!usuario) return [];
    return usuario.rol === 'CLIENTE'
      ? all.filter(p => p.clienteId === usuario.id)
      : all.filter(p => p.prestamistaId === usuario.id);
  },

  subirComprobante(prestamoId, cuotaId, { metodo = 'QR', comprobante = null, nota = '' }) {
    const arr = this.prestamos();
    const p = arr.find(x => x.id === prestamoId);
    if (!p) return;
    const c = p.cuotas.find(x => x.id === cuotaId);
    if (!c || c.estado === 'PAGADA' || c.estado === 'EN_VERIFICACION') return;
    c.estado = 'EN_VERIFICACION';
    c.metodo = metodo;
    c.comprobante = comprobante;
    c.notaCliente = nota;
    c.enviadoEn = new Date().toISOString();
    c.motivoRechazo = null;
    this.guardarPrestamos(arr);
    return p;
  },

  verificarPago(prestamoId, cuotaId, aprobado) {
    const arr = this.prestamos();
    const p = arr.find(x => x.id === prestamoId);
    if (!p) return;
    const c = p.cuotas.find(x => x.id === cuotaId);
    if (!c) return;

    if (aprobado) {
      c.estado = 'PAGADA';
      c.fechaPago = new Date().toISOString();
      c.verificadoEn = new Date().toISOString();
      c.motivoRechazo = null;
      if (p.cuotas.every(x => x.estado === 'PAGADA')) p.estado = 'PAGADO';
    } else {
      c.estado = 'PENDIENTE';
      c.motivoRechazo = 'Comprobante rechazado por el administrador';
      c.fechaPago = null;
    }
    this.guardarPrestamos(arr);
    return p;
  },

  cuotasEnVerificacion(prestamistaId) {
    return this.prestamos()
      .filter(p => p.prestamistaId === prestamistaId)
      .flatMap(p => p.cuotas
        .filter(c => c.estado === 'EN_VERIFICACION')
        .map(c => ({ prestamo: p, cuota: c }))
      );
  },

  historialDe(usuario) {
    const prestamos = this.prestamosDe(usuario);
    return prestamos.map(p => {
      const pagos = p.cuotas
        .filter(c => c.estado === 'PAGADA')
        .map(c => ({
          cuota: c.numero,
          monto: c.monto,
          fecha: c.fechaPago,
          metodo: c.metodo || 'EFECTIVO',
        }));
      return {
        ...p,
        pagos,
        totalPagado: pagos.reduce((a, x) => a + x.monto, 0),
      };
    }).sort((a, b) => new Date(b.fechaInicio) - new Date(a.fechaInicio));
  },

  datosCliente(clienteId) {
    const u = this.usuarioPorId(clienteId);
    if (!u) return null;
    const prestamos = this.prestamos().filter(p => p.clienteId === clienteId);
    const totalPrestado = prestamos.reduce((a, p) => a + Number(p.monto), 0);
    const totalPagado = prestamos.reduce((a, p) =>
      a + p.cuotas.filter(c => c.estado === 'PAGADA').reduce((s, c) => s + c.monto, 0), 0);
    const saldoPendiente = prestamos.reduce((a, p) =>
      a + p.cuotas.filter(c => c.estado !== 'PAGADA').reduce((s, c) => s + c.monto, 0), 0);
    const garantias = prestamos.flatMap(p =>
      (p.garantias || []).map(g => ({ ...g, codigo: p.codigoVinculo })));

    return { usuario: u, prestamos, totalPrestado, totalPagado, saldoPendiente, garantias };
  },
};

// ---------- Seed de demo ----------
export function seed() {
  if (localStorage.getItem('p_seeded_v5')) return;

  ['p_usuarios', 'p_prestamos', 'p_codigos', 'p_sesion', 'p_solicitudes',
   'p_seeded', 'p_seeded_v2', 'p_seeded_v3', 'p_seeded_v4'].forEach(k => localStorage.removeItem(k));

  const prestamista = storage.crearUsuario({
    nombre: 'Admin Presta+', ci: '0000000', correo: 'admin@presta.com',
    telefono: '70000000', password: 'admin123', rol: 'PRESTAMISTA',
  });

  const clientesBase = [
    { nombre: 'Juan Pérez',    ci: '12345678', correo: 'juan@demo.com',    telefono: '71234567', password: 'juan123',   direccion: 'Av. América #123' },
    { nombre: 'María López',   ci: '23456789', correo: 'maria@demo.com',   telefono: '72345678', password: 'maria123',  direccion: 'Calle Sucre #456' },
    { nombre: 'Carlos Rojas',  ci: '34567890', correo: 'carlos@demo.com',  telefono: '73456789', password: 'carlos123', direccion: 'Av. Blanco Galindo km 5' },
    { nombre: 'Ana Gutiérrez', ci: '45678901', correo: 'ana@demo.com',     telefono: '74567890', password: 'ana123',    direccion: 'Barrio Linde #789' },
    { nombre: 'Luis Mamani',   ci: '56789012', correo: 'luis@demo.com',    telefono: '75678901', password: 'luis123',   direccion: 'Zona Sur #321' },
    { nombre: 'Sofía Quispe',  ci: '67890123', correo: 'sofia@demo.com',   telefono: '76789012', password: 'sofia123',  direccion: 'Calle Bolívar #654' },
  ];
  const clientes = clientesBase.map(c => storage.crearUsuario({ ...c, rol: 'CLIENTE' }));

  const crearPrestamoConFecha = ({ cliente, mesesAtras, monto, interes, plazo, garantia }) => {
    const arr = storage.prestamos();
    const fechaInicio = new Date();
    fechaInicio.setMonth(fechaInicio.getMonth() - mesesAtras);
    fechaInicio.setDate(10);

    const total = +(monto * (1 + (interes / 100) * plazo)).toFixed(2);
    const cuotaMonto = +(total / plazo).toFixed(2);
    const uidLocal = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

    const cuotas = Array.from({ length: plazo }).map((_, i) => {
      const f = new Date(fechaInicio);
      f.setMonth(f.getMonth() + i + 1);
      return {
        id: uidLocal(), numero: i + 1, monto: cuotaMonto,
        fechaVencimiento: f.toISOString(),
        estado: 'PENDIENTE', fechaPago: null, metodo: null,
        comprobante: null, notaCliente: '', enviadoEn: null,
        verificadoEn: null, motivoRechazo: null,
      };
    });

    const p = {
      id: uidLocal(),
      codigoVinculo: 'PRS-' + Math.random().toString(36).slice(2, 8).toUpperCase(),
      clienteId: cliente.id,
      prestamistaId: prestamista.id,
      monto: +monto, interesMensual: +interes, plazoMeses: +plazo,
      totalPagar: total, estado: 'ACTIVO',
      fechaInicio: fechaInicio.toISOString(),
      garantias: [garantia], cuotas,
    };
    arr.push(p);
    storage.guardarPrestamos(arr);
    return p;
  };

  const marcarPagadas = (prestamoId, cantidad) => {
    const arr = storage.prestamos();
    const p = arr.find(x => x.id === prestamoId);
    if (!p) return;
    for (let i = 0; i < cantidad && i < p.cuotas.length; i++) {
      const c = p.cuotas[i];
      if (c.estado === 'PAGADA') continue;
      c.estado = 'PAGADA';
      c.fechaPago = new Date(c.fechaVencimiento).toISOString();
      c.metodo = Math.random() > 0.5 ? 'QR' : 'EFECTIVO';
    }
    if (p.cuotas.every(x => x.estado === 'PAGADA')) p.estado = 'PAGADO';
    storage.guardarPrestamos(arr);
  };

  const p1 = crearPrestamoConFecha({ cliente: clientes[0], mesesAtras: 5, monto: 2000, interes: 5, plazo: 4, garantia: { tipo: 'JOYA', descripcion: 'Anillo de oro 14k', valorAvaluo: 3500, fotos: [] } });
  marcarPagadas(p1.id, 4);

  const p2 = crearPrestamoConFecha({ cliente: clientes[1], mesesAtras: 4, monto: 1500, interes: 6, plazo: 3, garantia: { tipo: 'ELECTRONICA', descripcion: 'iPhone 12 128GB', valorAvaluo: 2800, fotos: [] } });
  marcarPagadas(p2.id, 3);

  const p3 = crearPrestamoConFecha({ cliente: clientes[2], mesesAtras: 3, monto: 5000, interes: 5, plazo: 5, garantia: { tipo: 'VEHICULO', descripcion: 'Moto Honda 150cc', valorAvaluo: 9000, fotos: [] } });
  marcarPagadas(p3.id, 2);

  const p4 = crearPrestamoConFecha({ cliente: clientes[3], mesesAtras: 3, monto: 1200, interes: 7, plazo: 4, garantia: { tipo: 'ELECTRODOMESTICO', descripcion: 'Refrigeradora Samsung', valorAvaluo: 2200, fotos: [] } });
  marcarPagadas(p4.id, 1);

  const p5 = crearPrestamoConFecha({ cliente: clientes[4], mesesAtras: 2, monto: 3500, interes: 5, plazo: 6, garantia: { tipo: 'HERRAMIENTA', descripcion: 'Taladro percutor Bosch', valorAvaluo: 1800, fotos: [] } });
  marcarPagadas(p5.id, 0);

  const p6 = crearPrestamoConFecha({ cliente: clientes[5], mesesAtras: 2, monto: 2500, interes: 6, plazo: 6, garantia: { tipo: 'JOYA', descripcion: 'Cadena de plata 925', valorAvaluo: 1400, fotos: [] } });
  marcarPagadas(p6.id, 3);

  const p7 = crearPrestamoConFecha({ cliente: clientes[0], mesesAtras: 1, monto: 4000, interes: 5, plazo: 6, garantia: { tipo: 'ELECTRONICA', descripcion: 'Laptop Lenovo IdeaPad', valorAvaluo: 4500, fotos: [] } });
  marcarPagadas(p7.id, 1);

  const p8 = crearPrestamoConFecha({ cliente: clientes[1], mesesAtras: 1, monto: 1800, interes: 6, plazo: 4, garantia: { tipo: 'INSTRUMENTO', descripcion: 'Guitarra eléctrica Fender', valorAvaluo: 2500, fotos: [] } });
  marcarPagadas(p8.id, 2);

  const p9 = crearPrestamoConFecha({ cliente: clientes[2], mesesAtras: 0, monto: 6000, interes: 5, plazo: 8, garantia: { tipo: 'MAQUINARIA', descripcion: 'Compresor industrial 50L', valorAvaluo: 8000, fotos: [] } });
  marcarPagadas(p9.id, 0);

  const p10 = crearPrestamoConFecha({ cliente: clientes[4], mesesAtras: 0, monto: 900, interes: 7, plazo: 3, garantia: { tipo: 'COLECCION', descripcion: 'Reloj antiguo Seiko', valorAvaluo: 1300, fotos: [] } });
  marcarPagadas(p10.id, 1);

  localStorage.setItem('p_seeded_v5', '1');
}