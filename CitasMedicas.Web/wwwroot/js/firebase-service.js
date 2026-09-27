/**
 * VITALIS CARE - FIREBASE BACKEND SERVICE
 * Implementa la capa de datos y autenticación con Firebase (Auth + Cloud Firestore).
 * Incluye modo en vivo con Firestore y modo fallback para pruebas locales y demostraciones.
 */

import { firebaseConfig, isConfigured } from './firebase-config.js';

let app = null;
let auth = null;
let db = null;
let useRealFirebase = false;

// ============================================================================
// GENERACIÓN DINÁMICA DE DISPONIBILIDADES (próximos 5 días hábiles)
// ============================================================================
function generateDynamicAvailabilities(startId) {
  const availabilities = [];
  const today = new Date();
  let count = 0;
  let dayOffset = 1;

  while (count < 5) {
    const candidate = new Date(today);
    candidate.setDate(today.getDate() + dayOffset);
    const dayOfWeek = candidate.getDay();
    // Saltar fines de semana (0 = domingo, 6 = sábado)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      const year = candidate.getFullYear();
      const month = String(candidate.getMonth() + 1).padStart(2, '0');
      const day = String(candidate.getDate()).padStart(2, '0');
      availabilities.push({
        id: `disp-${startId + count}`,
        inicio: `${year}-${month}-${day}T09:00:00`,
        fin: `${year}-${month}-${day}T17:00:00`,
        disponible: true
      });
      count++;
    }
    dayOffset++;
  }
  return availabilities;
}

// Datos semilla para inicializar Firestore y usuarios de demostración
const SEED_DOCTORS = [
  {
    id: "med-1",
    nombre: "Dra. Ana García",
    especialidad: "Cardiología",
    numeroLicencia: "MED-1001",
    email: "ana@citas.local",
    disponibilidades: generateDynamicAvailabilities(1)
  },
  {
    id: "med-2",
    nombre: "Dr. Luis Pérez",
    especialidad: "Dermatología",
    numeroLicencia: "MED-1002",
    email: "luis@citas.local",
    disponibilidades: generateDynamicAvailabilities(10)
  }
];

const SEED_USERS = [
  { id: "user-admin", email: "admin@citas.local", nombreCompleto: "Administrador", rol: "Admin" },
  { id: "user-ana", email: "ana@citas.local", nombreCompleto: "Dra. Ana García", rol: "Medico", medicoId: "med-1" },
  { id: "user-luis", email: "luis@citas.local", nombreCompleto: "Dr. Luis Pérez", rol: "Medico", medicoId: "med-2" },
  { id: "user-maria", email: "maria@citas.local", nombreCompleto: "María López", rol: "Paciente", pacienteId: "pac-1", numeroDocumento: "1020304050", documentoUrl: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80" },
  { id: "user-carlos", email: "carlos@citas.local", nombreCompleto: "Carlos Ruiz", rol: "Paciente", pacienteId: "pac-2", numeroDocumento: "9876543210", documentoUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80" }
];

// Contraseñas conocidas de los usuarios semilla (solo para validación local)
const SEED_PASSWORDS = {
  "admin@citas.local": "Admin123!",
  "ana@citas.local": "Medico123!",
  "luis@citas.local": "Medico123!",
  "maria@citas.local": "Paciente123!",
  "carlos@citas.local": "Paciente123!",
  "krokodragon66@gmail.com": "Paciente123!"
};

// Hash simple para contraseñas de usuarios registrados localmente (SHA-256 via Web Crypto)
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyPassword(password, hash) {
  const computed = await hashPassword(password);
  return computed === hash;
}

// ============================================================================
// Función auxiliar para evitar bloqueos por latencia de red o API inactiva
// ============================================================================
async function withTimeout(promise, ms = 2000) {
  let timer;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error('Firebase timeout')), ms);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timer);
  }
}

// ============================================================================
// Inicializar almacén local inmediatamente para que los datos siempre estén disponibles
initLocalStore();

// ============================================================================
// SINCRONIZACIÓN CENTRAL MULTI-DISPOSITIVO (.NET 9 BACKEND SYNC)
// ============================================================================
export async function syncWithServer() {
  try {
    const res = await fetch('/api/sync/state');
    if (!res.ok) return null;
    const data = await res.json();
    if (!data) return null;

    // Sincronizar usuarios (los registrados desde cualquier dispositivo se comparten)
    if (data.users && Array.isArray(data.users)) {
      const localUsers = JSON.parse(localStorage.getItem('fb_users') || '[]');
      const userMap = new Map();
      // Prioridad a usuarios consolidados del servidor
      data.users.forEach(u => userMap.set(u.email.toLowerCase(), u));
      // Preservar si hay alguno local pendiente
      localUsers.forEach(u => {
        if (!userMap.has(u.email.toLowerCase())) userMap.set(u.email.toLowerCase(), u);
      });
      localStorage.setItem('fb_users', JSON.stringify(Array.from(userMap.values())));
    }

    // Sincronizar citas globales (todas las citas creadas en cualquier celular o PC)
    if (data.appointments && Array.isArray(data.appointments)) {
      localStorage.setItem('fb_appointments', JSON.stringify(data.appointments));
    }

    return data;
  } catch (err) {
    // Si la red no responde, continúa con almacenamiento local
    return null;
  }
}

// ============================================================================
// INICIALIZACIÓN
// ============================================================================
export async function initFirebaseService() {
  initLocalStore();
  // Sincronización inmediata con el servidor central
  await syncWithServer();

  if (isConfigured()) {
    try {
      const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js');
      const { getAuth } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js');
      const { getFirestore, collection, getDocs, limit, query } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js');

      app = initializeApp(firebaseConfig);
      auth = getAuth(app);
      db = getFirestore(app);

      // Verificación activa de respuesta de Firestore (evita que se congele si la API está desactivada)
      await withTimeout(getDocs(query(collection(db, 'medicos'), limit(1))), 1800);

      useRealFirebase = true;
      console.log('✅ Conectado a Firebase Project:', firebaseConfig.projectId);

      try {
        await seedFirestoreIfEmpty();
      } catch (seedErr) {
        console.warn('Nota Firestore seed:', seedErr.message);
      }
      return { mode: 'firebase', project: firebaseConfig.projectId };
    } catch (err) {
      console.warn('⚠️ Cloud Firestore no disponible o inactivo:', err.message, '- Usando sincronización central .NET 9.');
      useRealFirebase = false;
      db = null;
      auth = null;
    }
  } else {
    useRealFirebase = false;
  }

  return { mode: 'sync-central' };
}

// ============================================================================
// ALMACÉN LOCAL SIMULADO (ESTRUCTURA NO-SQL IDÉNTICA A FIRESTORE)
// ============================================================================
function initLocalStore() {
  // Siempre actualizar médicos (las disponibilidades son dinámicas y pueden expirar)
  localStorage.setItem('fb_doctors', JSON.stringify(SEED_DOCTORS));
  if (!localStorage.getItem('fb_users')) {
    localStorage.setItem('fb_users', JSON.stringify(SEED_USERS));
  }
  if (!localStorage.getItem('fb_appointments')) {
    localStorage.setItem('fb_appointments', JSON.stringify([]));
  }
}

// ============================================================================
// AUTENTICACIÓN
// ============================================================================
export async function fbLogin(email, password) {
  const normEmail = email.trim().toLowerCase();

  // 1. Sincronizar primero para obtener usuarios y citas creados en otros dispositivos
  try {
    await syncWithServer();
  } catch (_) {}

  // 2. Autenticación centralizada (.NET 9 Sync / SQLite)
  try {
    const syncRes = await fetch('/api/sync/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: normEmail, password })
    });
    if (syncRes.ok) {
      const data = await syncRes.json();
      if (data && data.success && data.user) {
        console.log('✅ Sesión iniciada via Sync Central:', data.user.nombreCompleto, `(${data.user.rol})`);
        sessionStorage.setItem('vitalis_current_user', JSON.stringify(data.user));
        return data.user;
      }
    }
  } catch (_) {
    // Si el servidor central no responde o estamos offline, continuar con fallbacks
  }

  if (useRealFirebase && auth) {
    try {
      const { signInWithEmailAndPassword } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js');
      const userCredential = await signInWithEmailAndPassword(auth, normEmail, password);

      let profile = {};
      try {
        const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js');
        const userDoc = await getDoc(doc(db, 'usuarios', userCredential.user.uid));
        if (userDoc.exists()) profile = userDoc.data();
      } catch (_) {}

      const demoUser = SEED_USERS.find(u => u.email.toLowerCase() === normEmail);

      const userObj = {
        id: userCredential.user.uid,
        email: userCredential.user.email,
        nombreCompleto: profile.nombreCompleto || demoUser?.nombreCompleto || userCredential.user.displayName || normEmail.split('@')[0],
        rol: profile.rol || demoUser?.rol || 'Paciente',
        pacienteId: profile.pacienteId || demoUser?.pacienteId || userCredential.user.uid,
        medicoId: profile.medicoId || demoUser?.medicoId || null
      };

      sessionStorage.setItem('vitalis_current_user', JSON.stringify(userObj));
      return userObj;

    } catch (authErr) {
      console.warn('Firebase Auth error, comprobando usuario demo o fallback:', authErr.code || authErr.message);

      // Verificar contra usuario demo o registrado localmente CON validación de contraseña:
      const localUsers = JSON.parse(localStorage.getItem('fb_users') || '[]');
      const allUsers = [...SEED_USERS, ...localUsers];
      const found = allUsers.find(u => u.email.toLowerCase() === normEmail);

      if (found) {
        // Validar contraseña: usuario semilla o usuario registrado localmente
        const seedPwd = SEED_PASSWORDS[normEmail];
        if (seedPwd) {
          if (password !== seedPwd) throw new Error('Credenciales incorrectas.');
        } else if (found.passwordHash) {
          if (!(await verifyPassword(password, found.passwordHash))) throw new Error('Credenciales incorrectas.');
        }
        console.log('✅ Sesión iniciada con usuario demo/local:', found.nombreCompleto, `(${found.rol})`);
        sessionStorage.setItem('vitalis_current_user', JSON.stringify(found));
        return found;
      }

      // Si no es un usuario demo, dar mensaje informativo y claro
      if (authErr.code === 'auth/operation-not-allowed') {
        throw new Error('Para crear o autenticar cuentas nuevas, habilita "Correo electrónico/contraseña" en Firebase Console > Authentication > Método de acceso.');
      } else if (authErr.code === 'auth/user-not-found' || authErr.code === 'auth/invalid-credential') {
        throw new Error('Credenciales incorrectas o usuario no registrado.');
      }
      throw authErr;
    }
  }

  // Fallback local con validación de contraseña
  const users = JSON.parse(localStorage.getItem('fb_users') || '[]');
  const allUsers = [...SEED_USERS, ...users];
  const found = allUsers.find(u => u.email.toLowerCase() === normEmail);
  if (!found) throw new Error('Credenciales inválidas.');

  // Validar contraseña
  const seedPwd = SEED_PASSWORDS[normEmail];
  if (seedPwd) {
    if (password !== seedPwd) throw new Error('Credenciales incorrectas.');
  } else if (found.passwordHash) {
    if (!(await verifyPassword(password, found.passwordHash))) throw new Error('Credenciales incorrectas.');
  }

  sessionStorage.setItem('vitalis_current_user', JSON.stringify(found));
  return found;
}

export async function fbRegisterPatient(data) {
  const { nombreCompleto, email, password, fechaNacimiento, telefono, numeroDocumento = '', documentoUrl = '' } = data;
  const normEmail = email.trim().toLowerCase();

  if (useRealFirebase && auth) {
    try {
      const { createUserWithEmailAndPassword, updateProfile } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js');
      const cred = await createUserWithEmailAndPassword(auth, normEmail, password);

      try {
        await updateProfile(cred.user, { displayName: nombreCompleto });
      } catch (_) {}

      const userObj = {
        uid: cred.user.uid,
        id: cred.user.uid,
        nombreCompleto,
        email: normEmail,
        rol: 'Paciente',
        fechaNacimiento,
        telefono,
        numeroDocumento,
        documentoUrl,
        pacienteId: cred.user.uid,
        creadoEn: new Date().toISOString()
      };

      try {
        const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js');
        await setDoc(doc(db, 'usuarios', cred.user.uid), userObj);
      } catch (firestoreErr) {
        console.warn('Nota: Guardado directo en Firestore usuarios omitido:', firestoreErr.message);
      }

      sessionStorage.setItem('vitalis_current_user', JSON.stringify(userObj));
      try {
        await fetch('/api/sync/user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userObj)
        });
      } catch (_) {}
      return userObj;

    } catch (authErr) {
      if (authErr.code === 'auth/operation-not-allowed' || authErr.code === 'auth/network-request-failed') {
        console.warn('Firebase Auth Correo/Contraseña no activado aún en consola. Registrando con protección local:', authErr.message);
        const users = JSON.parse(localStorage.getItem('fb_users') || '[]');
        if (users.some(u => u.email.toLowerCase() === normEmail)) {
          throw new Error('Ya existe una cuenta registrada con este correo.');
        }

        const newPatientId = 'pac-' + Date.now();
        const pwdHash = await hashPassword(password);
        const newUser = {
          id: 'user-' + Date.now(),
          nombreCompleto,
          email: normEmail,
          rol: 'Paciente',
          pacienteId: newPatientId,
          fechaNacimiento,
          telefono,
          numeroDocumento,
          documentoUrl,
          passwordHash: pwdHash
        };

        users.push(newUser);
        localStorage.setItem('fb_users', JSON.stringify(users));
        sessionStorage.setItem('vitalis_current_user', JSON.stringify(newUser));
        try {
          await fetch('/api/sync/user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...newUser, password })
          });
        } catch (_) {}
        return newUser;
      }
      throw authErr;
    }
  }

  // Fallback local
  const users = JSON.parse(localStorage.getItem('fb_users') || '[]');
  if (users.some(u => u.email.toLowerCase() === normEmail)) {
    throw new Error('Ya existe una cuenta registrada con este correo.');
  }

  const newPatientId = 'pac-' + Date.now();
  const pwdHash = await hashPassword(password);
  const newUser = {
    id: 'user-' + Date.now(),
    nombreCompleto,
    email: normEmail,
    rol: 'Paciente',
    pacienteId: newPatientId,
    fechaNacimiento,
    telefono,
    numeroDocumento,
    documentoUrl,
    passwordHash: pwdHash
  };

  users.push(newUser);
  localStorage.setItem('fb_users', JSON.stringify(users));
  sessionStorage.setItem('vitalis_current_user', JSON.stringify(newUser));
  try {
    await fetch('/api/sync/user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newUser, password })
    });
  } catch (_) {}
  return newUser;
}

export async function fbLogout() {
  if (useRealFirebase && auth) {
    try {
      const { signOut } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js');
      await signOut(auth);
    } catch (_) {}
  }
  sessionStorage.removeItem('vitalis_current_user');
}

export function fbGetCurrentUser() {
  const saved = sessionStorage.getItem('vitalis_current_user');
  return saved ? JSON.parse(saved) : null;
}

// ============================================================================
// MÉDICOS Y DISPONIBILIDADES
// ============================================================================
export async function fbGetDoctors() {
  const localDoctors = JSON.parse(localStorage.getItem('fb_doctors') || JSON.stringify(SEED_DOCTORS));

  if (useRealFirebase && db) {
    try {
      const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js');
      const snapshot = await getDocs(collection(db, 'medicos'));
      if (!snapshot.empty) {
        const firestoreDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const map = new Map();
        localDoctors.forEach(d => map.set(d.id, d));
        firestoreDocs.forEach(d => map.set(d.id, d));
        const merged = Array.from(map.values());
        localStorage.setItem('fb_doctors', JSON.stringify(merged));
        return merged;
      }
    } catch (err) {
      console.warn('Firestore no disponible para lectura de médicos, usando datos locales:', err.message);
    }
  }

  return localDoctors;
}

export async function fbRegisterDoctor({
  nombreCompleto,
  email,
  password,
  numeroLicencia,
  especialidad,
  numeroDocumento = '',
  documentoUrl = '',
  horaInicio = '08:00',
  horaFin = '16:00'
}) {
  const normEmail = email.toLowerCase().trim();
  const doctors = JSON.parse(localStorage.getItem('fb_doctors') || JSON.stringify(SEED_DOCTORS));
  const users = JSON.parse(localStorage.getItem('fb_users') || JSON.stringify(SEED_USERS));

  if (users.some(u => u.email.toLowerCase() === normEmail) || doctors.some(d => d.email?.toLowerCase() === normEmail)) {
    throw new Error('Ya existe una cuenta médica o de usuario registrada con este correo electrónico.');
  }

  const newDocId = 'med-' + Date.now();
  const newUserId = 'user-' + Date.now();
  const pwdHash = await hashPassword(password);

  // Generar disponibilidades para los próximos 30 días hábiles
  const disponibilidades = [];
  const today = new Date();
  let addedDays = 0;
  let dayOffset = 0;

  while (addedDays < 30) {
    const candidate = new Date(today);
    candidate.setDate(today.getDate() + dayOffset);
    const dayOfWeek = candidate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Lunes a Viernes
      const year = candidate.getFullYear();
      const month = String(candidate.getMonth() + 1).padStart(2, '0');
      const day = String(candidate.getDate()).padStart(2, '0');
      disponibilidades.push({
        id: `disp-${newDocId}-${addedDays + 1}`,
        inicio: `${year}-${month}-${day}T${horaInicio}:00`,
        fin: `${year}-${month}-${day}T${horaFin}:00`,
        disponible: true
      });
      addedDays++;
    }
    dayOffset++;
  }

  const prefix = nombreCompleto.trim().startsWith('Dr') ? '' : 'Dr(a). ';
  const finalName = `${prefix}${nombreCompleto.trim()}`;

  const newDoctorObj = {
    id: newDocId,
    usuarioId: newUserId,
    nombre: finalName,
    especialidad,
    numeroLicencia,
    email: normEmail,
    numeroDocumento,
    documentoUrl,
    horaInicio,
    horaFin,
    disponibilidades
  };

  const newUserObj = {
    id: newUserId,
    email: normEmail,
    nombreCompleto: finalName,
    rol: 'Medico',
    medicoId: newDocId,
    numeroDocumento,
    documentoUrl,
    passwordHash: pwdHash,
    password: password
  };

  if (useRealFirebase && db) {
    try {
      const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js');
      await withTimeout(setDoc(doc(db, 'medicos', newDocId), newDoctorObj), 2500);
      await withTimeout(setDoc(doc(db, 'usuarios', newUserId), newUserObj), 2500);
    } catch (e) {
      console.warn('Firestore no disponible al guardar médico, usando almacenamiento local:', e.message);
    }
  }

  doctors.push(newDoctorObj);
  localStorage.setItem('fb_doctors', JSON.stringify(doctors));

  users.push(newUserObj);
  localStorage.setItem('fb_users', JSON.stringify(users));

  try {
    await fetch('/api/sync/user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUserObj)
    });
  } catch (_) {}

  return newDoctorObj;
}

// ============================================================================
// GESTIÓN DE CITAS (CREAR, CONSULTAR, CONFIRMAR, CANCELAR)
// ============================================================================
export async function fbCreateAppointment(payload) {
  const { medicoId, pacienteId, inicio, fin, motivo } = payload;
  const user = fbGetCurrentUser();

  if (new Date(inicio) >= new Date(fin)) {
    throw new Error('La hora de inicio debe ser anterior a la hora de fin.');
  }
  if (new Date(inicio) <= new Date()) {
    throw new Error('La cita debe programarse en el futuro.');
  }

  if (useRealFirebase && db) {
    try {
      const { collection, addDoc, query, where, getDocs } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js');

      // Validar solapamiento en Firestore con timeout de seguridad
      const q = query(collection(db, 'citas'), where('medicoId', '==', medicoId));
      const snap = await withTimeout(getDocs(q), 1800);
      const hasOverlap = snap.docs.some(d => {
        const c = d.data();
        return c.estado !== 'Cancelada' && new Date(inicio) < new Date(c.fin) && new Date(fin) > new Date(c.inicio);
      });

      if (hasOverlap) throw new Error('El médico ya tiene una cita agendada en ese horario.');

      const docs = await fbGetDoctors();
      const docData = docs.find(d => d.id === medicoId || d.id === String(medicoId));

      const nuevaCita = {
        medicoId,
        medicoNombre: docData ? docData.nombre : 'Dr. Médico',
        pacienteId,
        pacienteNombre: user ? user.nombreCompleto : 'Paciente',
        numeroDocumento: user?.numeroDocumento || '',
        documentoUrl: user?.documentoUrl || '',
        inicio,
        fin,
        motivo,
        estado: 'Pendiente',
        fechaCreacion: new Date().toISOString()
      };

      const docRef = await withTimeout(addDoc(collection(db, 'citas'), nuevaCita), 1800);
      const citaGuardada = { id: docRef.id, ...nuevaCita };

      // Mantener espejo en almacén local
      const appointments = JSON.parse(localStorage.getItem('fb_appointments') || '[]');
      appointments.push(citaGuardada);
      localStorage.setItem('fb_appointments', JSON.stringify(appointments));

      try {
        await fetch('/api/sync/appointment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(citaGuardada)
        });
      } catch (_) {}

      return citaGuardada;
    } catch (firestoreErr) {
      if (firestoreErr.message.includes('El médico ya tiene una cita')) throw firestoreErr;
      console.warn('Firestore write no disponible, usando fallback local:', firestoreErr.message);
    }
  }

  // Fallback local
  const appointments = JSON.parse(localStorage.getItem('fb_appointments') || '[]');
  const hasOverlap = appointments.some(c => 
    c.medicoId == medicoId && c.estado !== 'Cancelada' && new Date(inicio) < new Date(c.fin) && new Date(fin) > new Date(c.inicio)
  );
  if (hasOverlap) throw new Error('El médico ya tiene una cita agendada en ese horario.');

  const doctors = JSON.parse(localStorage.getItem('fb_doctors') || JSON.stringify(SEED_DOCTORS));
  const docData = doctors.find(d => d.id == medicoId);

  const nuevaCita = {
    id: 'cita-' + Date.now(),
    medicoId,
    medicoNombre: docData ? docData.nombre : 'Dr. Médico',
    pacienteId,
    pacienteNombre: user ? user.nombreCompleto : 'Paciente',
    numeroDocumento: user?.numeroDocumento || '',
    documentoUrl: user?.documentoUrl || '',
    inicio,
    fin,
    motivo,
    estado: 'Pendiente',
    fechaCreacion: new Date().toISOString()
  };

  appointments.push(nuevaCita);
  localStorage.setItem('fb_appointments', JSON.stringify(appointments));

  try {
    await fetch('/api/sync/appointment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nuevaCita)
    });
  } catch (_) {}

  return nuevaCita;
}

export async function fbGetPatientAppointments(pacienteId) {
  if (useRealFirebase && db) {
    try {
      const { collection, query, where, getDocs } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js');
      const q = query(collection(db, 'citas'), where('pacienteId', '==', pacienteId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }
    } catch (e) {
      console.warn('Firestore citas paciente no disponible, usando local:', e.message);
    }
  }

  const appointments = JSON.parse(localStorage.getItem('fb_appointments') || '[]');
  return appointments.filter(c => c.pacienteId == pacienteId);
}

export async function fbGetDoctorAppointments(medicoId) {
  if (useRealFirebase && db) {
    try {
      const { collection, query, where, getDocs } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js');
      const q = query(collection(db, 'citas'), where('medicoId', '==', medicoId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }
    } catch (e) {
      console.warn('Firestore citas médico no disponible, usando local:', e.message);
    }
  }

  const appointments = JSON.parse(localStorage.getItem('fb_appointments') || '[]');
  const users = JSON.parse(localStorage.getItem('fb_users') || JSON.stringify(SEED_USERS));
  return appointments
    .filter(c => c.medicoId == medicoId)
    .map(c => {
      const u = users.find(usr => usr.id === c.pacienteId || usr.pacienteId === c.pacienteId);
      return {
        ...c,
        numeroDocumento: c.numeroDocumento || u?.numeroDocumento || '1020304050',
        documentoUrl: c.documentoUrl || u?.documentoUrl || 'https://res.cloudinary.com/demo/image/upload/sample.jpg'
      };
    });
}

export async function fbUpdateAppointmentStatus(citaId, nuevoEstado) {
  if (useRealFirebase && db) {
    try {
      const { doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js');
      await updateDoc(doc(db, 'citas', citaId), { estado: nuevoEstado });
    } catch (e) {
      console.warn('Firestore update cita omitido:', e.message);
    }
  }

  const appointments = JSON.parse(localStorage.getItem('fb_appointments') || '[]');
  const cita = appointments.find(c => c.id == citaId);
  if (cita) {
    cita.estado = nuevoEstado;
    localStorage.setItem('fb_appointments', JSON.stringify(appointments));
  }

  try {
    await fetch(`/api/sync/appointment/${citaId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nuevoEstado })
    });
  } catch (_) {}
}

export async function fbCancelAppointment(citaId) {
  const appointments = JSON.parse(localStorage.getItem('fb_appointments') || '[]');
  let cita = appointments.find(c => c.id == citaId);

  if (useRealFirebase && db) {
    try {
      const { doc, getDoc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js');
      const snap = await getDoc(doc(db, 'citas', citaId));
      if (snap.exists()) cita = snap.data();

      if (cita) {
        if (cita.estado === 'Cancelada' || cita.estado === 'Completada') {
          throw new Error('La cita no puede cancelarse en su estado actual.');
        }
        const inicio = new Date(cita.inicio);
        if (inicio <= new Date(Date.now() + 24 * 60 * 60 * 1000)) {
          throw new Error('La cancelación debe hacerse con al menos 24 horas de anticipación.');
        }
        await updateDoc(doc(db, 'citas', citaId), { estado: 'Cancelada' });
      }
    } catch (e) {
      if (e.message.includes('24 horas') || e.message.includes('no puede cancelarse')) throw e;
      console.warn('Firestore cancel omitido, usando local:', e.message);
    }
  }

  if (cita) {
    if (cita.estado === 'Cancelada' || cita.estado === 'Completada') {
      throw new Error('La cita no puede cancelarse en su estado actual.');
    }
    const inicio = new Date(cita.inicio);
    if (inicio <= new Date(Date.now() + 24 * 60 * 60 * 1000)) {
      throw new Error('La cancelación debe hacerse con al menos 24 horas de anticipación.');
    }
    cita.estado = 'Cancelada';
    localStorage.setItem('fb_appointments', JSON.stringify(appointments));
  }

  try {
    await fetch(`/api/sync/appointment/${citaId}/cancel`, { method: 'POST' });
  } catch (_) {}
}

// Obtener todas las citas del sistema para supervisión administrativa global
export async function fbGetAllAppointments() {
  if (useRealFirebase && db) {
    try {
      const { collection, getDocs, orderBy, query } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js');
      const snap = await withTimeout(getDocs(query(collection(db, 'citas'), orderBy('inicio', 'desc'))), 1800);
      if (!snap.empty) {
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }
    } catch (e) {
      console.warn('Firestore citas global no disponible, usando local:', e.message);
    }
  }

  const appointments = JSON.parse(localStorage.getItem('fb_appointments') || '[]');
  return appointments.slice().reverse();
}

// Cancelación forzada de emergencia ejecutada por el Administrador (omite regla de 24h)
export async function fbForceCancelAppointment(citaId) {
  if (useRealFirebase && db) {
    try {
      const { doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js');
      await withTimeout(updateDoc(doc(db, 'citas', citaId), { estado: 'Cancelada' }), 1800);
    } catch (e) {
      console.warn('Firestore cancel forzado omitido, usando local:', e.message);
    }
  }

  const appointments = JSON.parse(localStorage.getItem('fb_appointments') || '[]');
  const cita = appointments.find(c => c.id == citaId);
  if (cita) {
    if (cita.estado === 'Cancelada') {
      throw new Error('Esta cita médica ya se encuentra cancelada.');
    }
    cita.estado = 'Cancelada';
    localStorage.setItem('fb_appointments', JSON.stringify(appointments));
  }

  try {
    await fetch(`/api/sync/appointment/${citaId}/cancel`, { method: 'POST' });
  } catch (_) {}
}

export async function fbGetAdminStats() {
  if (useRealFirebase && db) {
    try {
      const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js');
      const citasSnap = await getDocs(collection(db, 'citas'));
      const medicosSnap = await getDocs(collection(db, 'medicos'));
      const usuariosSnap = await getDocs(collection(db, 'usuarios'));

      const citas = citasSnap.docs.map(d => d.data());
      if (citas.length > 0 || medicosSnap.size > 0) {
        return {
          totalCitas: citas.length,
          citasPendientes: citas.filter(c => c.estado === 'Pendiente').length,
          citasConfirmadas: citas.filter(c => c.estado === 'Confirmada').length,
          citasCompletadas: citas.filter(c => c.estado === 'Completada').length,
          citasCanceladas: citas.filter(c => c.estado === 'Cancelada').length,
          totalMedicos: medicosSnap.size,
          totalPacientes: usuariosSnap.docs.filter(u => u.data().rol === 'Paciente').length
        };
      }
    } catch (e) {
      console.warn('Firestore stats omitido, usando local:', e.message);
    }
  }

  const citas = JSON.parse(localStorage.getItem('fb_appointments') || '[]');
  const medicos = JSON.parse(localStorage.getItem('fb_doctors') || JSON.stringify(SEED_DOCTORS));
  const usuarios = JSON.parse(localStorage.getItem('fb_users') || JSON.stringify(SEED_USERS));

  return {
    totalCitas: citas.length,
    citasPendientes: citas.filter(c => c.estado === 'Pendiente').length,
    citasConfirmadas: citas.filter(c => c.estado === 'Confirmada').length,
    citasCompletadas: citas.filter(c => c.estado === 'Completada').length,
    citasCanceladas: citas.filter(c => c.estado === 'Cancelada').length,
    totalMedicos: medicos.length,
    totalPacientes: usuarios.filter(u => u.rol === 'Paciente').length
  };
}

async function seedFirestoreIfEmpty() {
  try {
    const { collection, getDocs, doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js');
    const snap = await getDocs(collection(db, 'medicos'));
    if (snap.empty) {
      console.log('Poblando colección inicial de médicos en Cloud Firestore...');
      for (const m of SEED_DOCTORS) {
        await setDoc(doc(db, 'medicos', m.id), m);
      }
      for (const u of SEED_USERS) {
        await setDoc(doc(db, 'usuarios', u.id), u);
      }
    }
  } catch (e) {
    console.warn('Firestore seed omitido (las colecciones se crearán bajo demanda):', e.message);
  }
}
