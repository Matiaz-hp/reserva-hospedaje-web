import { auth } from "./firebase-config.js";
import { signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

// Lista de correos permitidos como administradores
const ADMINS = ["admin@tudominio.com"]; // tu correo admin

// Función para login de admin
export function loginAdmin(email, password) {
    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            if (ADMINS.includes(user.email)) {
                // Usuario es admin
                window.location.href = "dashboard-admin.html";
            } else {
                // Usuario no es admin
                alert("No tienes permisos para acceder al dashboard");
                auth.signOut();
                window.location.href = "index.html";
            }
        })
        .catch((error) => {
            alert("Correo o contraseña incorrectos");
            console.error(error);
        });
}

// Verificar si ya hay un usuario logueado al cargar dashboard
onAuthStateChanged(auth, (user) => {
    if (!user || !ADMINS.includes(user.email)) {
        alert("No tienes permisos para acceder al dashboard");
        window.location.href = "index.html";
    }
});

