import { db } from "./firebase-config.js";
import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  deleteDoc,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

const auth = getAuth();

/* ===============================
   DOM
================================ */
const fechaEntrada = document.getElementById("fecha-reserva");
const fechaSalida = document.getElementById("fecha-salida");
const searchBtn = document.getElementById("search-btn");
const hotelesList = document.getElementById("hoteles-list");
const reservasList = document.getElementById("reservas-list");

const reservarSection = document.getElementById("reservar");
const hotelesSection = document.getElementById("hoteles");
const reservasSection = document.getElementById("mis-reservas");
const pagosSection = document.getElementById("pagos");

const tabs = document.querySelectorAll(".tab");

const reservaModal = document.getElementById("reserva-modal");
const confirmarBtn = document.getElementById("confirmar-reserva");
const closeReserva = document.getElementById("close-reserva");

/* ===============================
   UTILIDADES
================================ */
function ocultarTodo() {
  reservarSection.style.display = "none";
  hotelesSection.style.display = "none";
  reservasSection.style.display = "none";
  pagosSection.style.display = "none";
}

function validarFechas(entrada, salida) {
  const error = document.getElementById("error-fechas");

  if (!entrada || !salida) {
    error.textContent = "Selecciona fechas válidas";
    error.style.display = "block";
    return false;
  }

  if (new Date(salida) <= new Date(entrada)) {
    error.textContent = "La salida debe ser mayor";
    error.style.display = "block";
    return false;
  }

  error.style.display = "none";
  return true;
}

function calcularNoches(e, s) {
  return (new Date(s) - new Date(e)) / (1000 * 60 * 60 * 24);
}

/* ===============================
   HOTELES
================================ */
let reservaActual = null;

async function hotelDisponible(hotelId, entrada, salida) {
  const q = query(collection(db, "reservas"), where("hotelId", "==", hotelId));
  const snap = await getDocs(q);

  for (const d of snap.docs) {
    const r = d.data();
    if (
      new Date(r.entrada) < new Date(salida) &&
      new Date(r.salida) > new Date(entrada)
    ) {
      return false;
    }
  }
  return true;
}

async function cargarHoteles() {
  hotelesList.innerHTML = "";

  if (!validarFechas(fechaEntrada.value, fechaSalida.value)) return;

  const snapshot = await getDocs(collection(db, "hoteles"));

  for (const docSnap of snapshot.docs) {
    const h = docSnap.data();

    if (!(await hotelDisponible(docSnap.id, fechaEntrada.value, fechaSalida.value)))
      continue;

    const card = document.createElement("div");
    card.className = "hotel-card";

    card.innerHTML = `
      <div class="content">
        <h3>${h.nombre}</h3>
        <p>📍 ${h.ciudad}</p>
        <p>💲 ${h.precio} por noche</p>
        <button>Reservar</button>
      </div>
    `;

    card.querySelector("button").onclick = () => {
      if (!auth.currentUser) {
        alert("Inicia sesión");
        return;
      }

      const noches = calcularNoches(fechaEntrada.value, fechaSalida.value);
      const total = noches * h.precio;

      reservaActual = {
        hotelId: docSnap.id,
        hotel: h.nombre,
        precio: h.precio,
        noches,
        total,
        entrada: fechaEntrada.value,
        salida: fechaSalida.value,
        userId: auth.currentUser.uid,
        estado: "pendiente",
        createdAt: new Date()
      };

      document.getElementById("reserva-hotel").textContent = h.nombre;
      document.getElementById("reserva-precio").textContent = h.precio;
      document.getElementById("reserva-entrada").textContent = fechaEntrada.value;
      document.getElementById("reserva-salida").textContent = fechaSalida.value;

      reservaModal.style.display = "flex";
    };

    hotelesList.appendChild(card);
  }
}

/* ===============================
   RESERVAS
================================ */
confirmarBtn.onclick = async () => {
  await addDoc(collection(db, "reservas"), reservaActual);
  reservaModal.style.display = "none";
  alert("Reserva creada (pendiente de pago)");
};

async function cargarMisReservas() {
  reservasList.innerHTML = "";

  if (!auth.currentUser) {
    reservasList.innerHTML = "<p>Inicia sesión</p>";
    return;
  }

  const q = query(
    collection(db, "reservas"),
    where("userId", "==", auth.currentUser.uid)
  );

  const snap = await getDocs(q);

  if (snap.empty) {
    reservasList.innerHTML = "<p>No tienes reservas</p>";
    return;
  }

  snap.forEach(docSnap => {
    const r = docSnap.data();
    const div = document.createElement("div");
    div.className = "hotel-card";
    div.innerHTML = `
      <h3>${r.hotel}</h3>
      <p>${r.entrada} → ${r.salida}</p>
      <p>Total: $${r.total}</p>
    `;
    reservasList.appendChild(div);
  });
}

/* ===============================
   PAGOS
================================ */
async function cargarPagoPendiente() {
  const pagoMsg = document.getElementById("pago-msg");

  if (!auth.currentUser) {
    pagoMsg.textContent = "Inicia sesión";
    return;
  }

  const q = query(
    collection(db, "reservas"),
    where("userId", "==", auth.currentUser.uid),
    where("estado", "==", "pendiente")
  );

  const snap = await getDocs(q);

  pagoMsg.textContent = snap.empty
    ? "No tienes pagos pendientes"
    : "Tienes una reserva pendiente de pago";
}

/* ===============================
   TABS (FIX DEFINITIVO)
================================ */
tabs.forEach(tab => {
  tab.onclick = () => {
    tabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");

    ocultarTodo();

    if (tab.dataset.tab === "reservar") {
      reservarSection.style.display = "block";
      hotelesSection.style.display = "block";
    }

    if (tab.dataset.tab === "mis-reservas") {
      reservasSection.style.display = "block";
      cargarMisReservas();
    }

    if (tab.dataset.tab === "pagos") {
      pagosSection.style.display = "block";
      cargarPagoPendiente();
    }
  };
});


import { auth } from "./firebase-config.js";
import { signInWithEmailAndPassword } from
  "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

// correos admin permitidos
const ADMINS = [
  "admin@tudominio.com" // 👈 cambia por tu correo real
];

const adminLoginBtn = document.getElementById("admin-login-btn");

adminLoginBtn?.addEventListener("click", async () => {
  const email = document.getElementById("admin-email").value;
  const password = document.getElementById("admin-password").value;
  const error = document.getElementById("admin-error");

  error.textContent = "";

  if (!email || !password) {
    error.textContent = "Completa todos los campos";
    return;
  }

  if (!ADMINS.includes(email)) {
    error.textContent = "No autorizado como administrador";
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, password);

    // 🔐 login correcto → ir al dashboard
    window.location.href = "admin-dashboard.html";

  } catch (err) {
    error.textContent = "Credenciales incorrectas";
  }
});


/* ===============================
   EVENTOS
================================ */
searchBtn.onclick = cargarHoteles;
closeReserva.onclick = () => (reservaModal.style.display = "none");
