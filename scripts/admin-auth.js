
// scripts/admin-auth.js
import { auth } from "./firebase-config.js";
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

// Lista de correos permitidos como administradores
const ADMINS = ["admin@tudominio.com"];

// --- Función para login del admin desde el modal en index.html ---
export function loginAdmin(email, password) {
    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;

            if (ADMINS.includes(user.email)) {
                // Usuario es admin, redirige al dashboard
                window.location.href = "admin-dashboard.html";
            } else {
                alert("No tienes permisos para acceder al dashboard");
                signOut(auth); // cerrar sesión si no es admin
            }
        })
        .catch((error) => {
            alert("Correo o contraseña incorrectos");
            console.error(error);
        });
}

// --- Función para proteger dashboard-admin.html ---
export function protectAdminDashboard() {
    onAuthStateChanged(auth, (user) => {
        if (!user || !ADMINS.includes(user.email)) {
            alert("No tienes permisos para acceder al dashboard");
            window.location.href = "index.html";
        }
    });
}
