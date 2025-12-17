import { auth } from "./firebase-config.js";
import { signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

// Lista de correos permitidos como administradores
const ADMINS = ["admin@tudominio.com"];

// Función para login de admin desde modal en index.html
export function loginAdmin(email, password) {
    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            if (ADMINS.includes(user.email)) {
                // Usuario es admin, redirige al dashboard
                window.location.href = "dashboard-admin.html";
            } else {
                alert("No tienes permisos para acceder al dashboard");
                auth.signOut();
            }
        })
        .catch((error) => {
            alert("Correo o contraseña incorrectos");
            console.error(error);
        });
}

// Protección del dashboard
// SOLO incluir esto en dashboard-admin.html
export function protectAdminDashboard() {
    onAuthStateChanged(auth, (user) => {
        if (!user || !ADMINS.includes(user.email)) {
            alert("No tienes permisos para acceder al dashboard");
            window.location.href = "index.html";
        }
    });
}

