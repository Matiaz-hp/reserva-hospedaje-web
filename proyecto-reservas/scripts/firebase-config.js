
// Importa Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

// Tu configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDDUxyUkvBOda8HmnQVQ2IdpnClntvMtSI",
  authDomain: "app-reservas-9e680.firebaseapp.com",
  projectId: "app-reservas-9e680",
  storageBucket: "app-reservas-9e680.firebasestorage.app",
  messagingSenderId: "669976941208",
  appId: "1:669976941208:web:086a7c3f5d7330250eb6ed",
  measurementId: "G-1RLMESE1VY"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);

// Exporta Auth y Firestore para usar en otros scripts
export const auth = getAuth(app);
export const db = getFirestore(app);
