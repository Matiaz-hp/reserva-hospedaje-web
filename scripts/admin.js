import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

/* =======================
   LISTA DE ADMINS
======================= */
const ADMINS = [
  "admin@admin.com",   // cambia por tu correo real
];

/* =======================
   ELEMENTOS DOM
======================= */
const logoutBtn = document.getElementById("logout-admin");
const guardarBtn = document.getElementById("guardar-hotel");
const listaHoteles = document.getElementById("lista-hoteles");
const msg = document.getElementById("admin-msg");

/* =======================
   PROTECCIÓN DEL PANEL
======================= */
onAuthStateChanged(auth, user => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  if (!ADMINS.includes(user.email)) {
    alert("Acceso denegado: no eres administrador");
    window.location.href = "index.html";
  }
});

/* =======================
   LOGOUT ADMIN
======================= */
logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "index.html";
});

/* =======================
   GUARDAR HOTEL
======================= */
guardarBtn.addEventListener("click", async () => {
  const nombre = document.getElementById("hotel-nombre").value.trim();
  const ciudad = document.getElementById("hotel-ciudad").value.trim();
  const precio = document.getElementById("hotel-precio").value;

  if (!nombre || !ciudad || !precio) {
    msg.textContent = "❌ Completa todos los campos";
    return;
  }

  try {
    await addDoc(collection(db, "hoteles"), {
      nombre,
      ciudad,
      precio: Number(precio),
      createdAt: new Date()
    });

    msg.textContent = "✅ Hotel guardado correctamente";
    document.getElementById("hotel-nombre").value = "";
    document.getElementById("hotel-ciudad").value = "";
    document.getElementById("hotel-precio").value = "";

    cargarHoteles();
  } catch (err) {
    msg.textContent = err.message;
  }
});

/* =======================
   LISTAR HOTELES
======================= */
async function cargarHoteles() {
  listaHoteles.innerHTML = "";

  const snapshot = await getDocs(collection(db, "hoteles"));
  snapshot.forEach(doc => {
    const h = doc.data();

    listaHoteles.innerHTML += `
      <div style="margin-bottom:10px;">
        <strong>${h.nombre}</strong> – ${h.ciudad} – $${h.precio}
      </div>
    `;
  });
}

cargarHoteles();
