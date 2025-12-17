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

const tabs = document.querySelectorAll(".tab");

const reservarSection = document.getElementById("reservar");
const hotelesSection = document.getElementById("hoteles");
const reservasSection = document.getElementById("mis-reservas");
const pagosSection = document.getElementById("pagos");

const reservaModal = document.getElementById("reserva-modal");
const confirmarBtn = document.getElementById("confirmar-reserva");
const closeReserva = document.getElementById("close-reserva");

const pagarBtn = document.getElementById("pagar-btn");
const pagoMsg = document.getElementById("pago-msg");

let reservaActual = null;
let reservaPendientePago = null;

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
    error.textContent = "⚠️ Debes seleccionar fecha de entrada y salida.";
    error.style.display = "block";
    return false;
  }

  if (new Date(salida) <= new Date(entrada)) {
    error.textContent = "⚠️ La fecha de salida debe ser mayor a la de entrada.";
    error.style.display = "block";
    return false;
  }

  error.style.display = "none";
  return true;
}

function calcularNoches(entrada, salida) {
  return (new Date(salida) - new Date(entrada)) / (1000 * 60 * 60 * 24);
}

/* ===============================
   DISPONIBILIDAD
================================ */
async function hotelDisponible(hotelId, entrada, salida) {
  const q = query(collection(db, "reservas"), where("hotelId", "==", hotelId));
  const snapshot = await getDocs(q);

  for (const d of snapshot.docs) {
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

/* ===============================
   CARGAR HOTELES
================================ */
async function cargarHoteles() {
  hotelesList.innerHTML = "";
  if (!validarFechas(fechaEntrada.value, fechaSalida.value)) return;

  const snapshot = await getDocs(collection(db, "hoteles"));

  for (const d of snapshot.docs) {
    const h = d.data();
    const disponible = await hotelDisponible(d.id, fechaEntrada.value, fechaSalida.value);
    if (!disponible) continue;

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
        alert("Debes iniciar sesión");
        return;
      }

      const noches = calcularNoches(fechaEntrada.value, fechaSalida.value);
      reservaActual = {
        hotelId: d.id,
        hotel: h.nombre,
        precio: h.precio,
        noches,
        total: noches * h.precio,
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
   CONFIRMAR RESERVA
================================ */
confirmarBtn.onclick = async () => {
  if (!reservaActual) return;
  await addDoc(collection(db, "reservas"), reservaActual);
  reservaModal.style.display = "none";
  alert("✅ Reserva creada, pendiente de pago");
};

/* ===============================
   MIS RESERVAS
================================ */
async function cargarMisReservas() {
  reservasList.innerHTML = "";
  if (!auth.currentUser) {
    reservasList.innerHTML = "<p>Inicia sesión</p>";
    return;
  }

  const q = query(collection(db, "reservas"), where("userId", "==", auth.currentUser.uid));
  const snapshot = await getDocs(q);

  snapshot.forEach(d => {
    const r = d.data();
    const card = document.createElement("div");
    card.className = "hotel-card";
    card.innerHTML = `
      <div class="content">
        <h3>${r.hotel}</h3>
        <p>${r.entrada} → ${r.salida}</p>
        <p>💰 $${r.total} (${r.estado})</p>
        <button>Cancelar</button>
      </div>
    `;
    card.querySelector("button").onclick = async () => {
      await deleteDoc(doc(db, "reservas", d.id));
      cargarMisReservas();
    };
    reservasList.appendChild(card);
  });
}

/* ===============================
   PAGOS
================================ */
async function cargarPagoPendiente() {
  pagoMsg.textContent = "";
  if (!auth.currentUser) return;

  const q = query(
    collection(db, "reservas"),
    where("userId", "==", auth.currentUser.uid),
    where("estado", "==", "pendiente")
  );

  const snapshot = await getDocs(q);
  if (!snapshot.empty) {
    reservaPendientePago = snapshot.docs[0];
    pagoMsg.textContent = "Tienes una reserva pendiente de pago";
  } else {
    pagoMsg.textContent = "No hay pagos pendientes";
  }
}

pagarBtn.onclick = async () => {
  if (!reservaPendientePago) return;
  await updateDoc(doc(db, "reservas", reservaPendientePago.id), {
    estado: "pagado"
  });
  alert("💳 Pago simulado exitoso");
  cargarPagoPendiente();
};

/* ===============================
   TABS (SOLUCIÓN REAL)
================================ */
tabs.forEach(tab => {
  tab.onclick = () => {
    tabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");

    ocultarTodo();

    const target = tab.dataset.tab;
    if (target === "reservar") {
      reservarSection.style.display = "block";
      hotelesSection.style.display = "block";
    }
    if (target === "mis-reservas") {
      reservasSection.style.display = "block";
      cargarMisReservas();
    }
    if (target === "pagos") {
      pagosSection.style.display = "block";
      cargarPagoPendiente();
    }
  };
});

/* ===============================
   EVENTOS
================================ */
searchBtn.onclick = cargarHoteles;
closeReserva.onclick = () => reservaModal.style.display = "none";
