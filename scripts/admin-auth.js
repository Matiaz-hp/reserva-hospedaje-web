import { auth } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

// Lista de correos que serán considerados administradores
const ADMINS = ["admin@tuhotel.com"]; // <- reemplaza con tu correo admin real

// Verificar si el usuario es admin
onAuthStateChanged(auth, (user) => {
  if (!user || !ADMINS.includes(user.email)) {
    // Si no hay usuario logueado o no es admin, volver al index
    alert("No tienes permisos para acceder al dashboard");
    window.location.href = "index.html";
  }
});
