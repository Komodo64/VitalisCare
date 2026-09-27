/**
 * VITALIS CARE - CONFIGURACIÓN DE FIREBASE
 * 
 * Para conectar tu propio proyecto de Firebase:
 * 1. Ve a https://console.firebase.google.com/
 * 2. Crea un proyecto nuevo (ej. "vitalis-care")
 * 3. En "Compilación" activa:
 *    - "Authentication" -> Método de inicio de sesión: "Correo electrónico/contraseña".
 *    - "Firestore Database" -> Crear base de datos en "Modo de prueba".
 * 4. En Configuración del proyecto (ícono de engranaje) -> "Tus apps" -> Web (</>)
 * 5. Copia tu objeto firebaseConfig y reemplázalo aquí abajo:
 */

export const firebaseConfig = {
  apiKey: "AIzaSyBe0HEFPW9m7_oMXYmyia1gq4N0W24p880",
  authDomain: "vitalis-care-f0e5e.firebaseapp.com",
  projectId: "vitalis-care-f0e5e",
  storageBucket: "vitalis-care-f0e5e.firebasestorage.app",
  messagingSenderId: "934259869390",
  appId: "1:934259869390:web:d9685bdfeb2e238201329f",
  measurementId: "G-F0CRQLWMJ3"
};

// Indica si las credenciales de Firebase fueron provistas por el usuario y están activas
export const isConfigured = () => {
  return Boolean(
    firebaseConfig.apiKey && 
    firebaseConfig.apiKey !== "TU_API_KEY_AQUI" &&
    firebaseConfig.projectId
  );
};
