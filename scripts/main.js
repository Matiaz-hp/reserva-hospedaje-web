import { db } from "./firebase-config.js";
import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

import {
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";


const auth = getAuth();

// ===============================
// VARIABLES DOM
// ===============================
const fechaEntrada = document.getElementById("fecha-reserva");
const fechaSalida = document.getElementById("fecha-salida");
const searchBtn = document.getElementById("search-btn");
const hotelesList = document.getElementById("hoteles-list");
const reservasList = document.getElementById("reservas-list");

const tabs = document.querySelectorAll(".tab");
const searchSection = document.querySelector(".search-card");
const hotelesSection = document.getElementById("hoteles");
const reservasSection = document.getElementById("mis-reservas");

const reservaModal = document.getElementById("reserva-modal");
const confirmarBtn = document.getElementById("confirmar-reserva");
const closeReserva = document.getElementById("close-reserva");

let reservaActual = null;

// ===============================
// VALIDAR FECHAS
// ===============================
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

// ===============================
// DISPONIBILIDAD
// ===============================
async function hotelDisponible(hotelId, entrada, salida) {
  const q = query(
    collection(db, "reservas"),
    where("hotelId", "==", hotelId)
  );

  const snapshot = await getDocs(q);

  for (const doc of snapshot.docs) {
    const r = doc.data();

    const inicioReserva = new Date(r.entrada);
    const finReserva = new Date(r.salida);

    if (
      inicioReserva < new Date(salida) &&
      finReserva > new Date(entrada)
    ) {
      return false;
    }
  }
  return true;
}

// ===============================
// CARGAR HOTELES
// ===============================
async function cargarHoteles() {
  hotelesList.innerHTML = "";

  if (!validarFechas(fechaEntrada.value, fechaSalida.value)) return;

  const snapshot = await getDocs(collection(db, "hoteles"));

  for (const docSnap of snapshot.docs) {
    const h = docSnap.data();

    const disponible = await hotelDisponible(
      docSnap.id,
      fechaEntrada.value,
      fechaSalida.value
    );

    if (!disponible) continue;

    const card = document.createElement("div");
    card.className = "hotel-card";

    card.innerHTML = `
      <img src="https://source.unsplash.com/400x300/?hotel,room" />
      <div class="content">
        <h3>${h.nombre}</h3>
        <p>📍 ${h.ciudad}</p>
        <p>💲 ${h.precio} por noche</p>
        <button>Reservar</button>
      </div>
    `;

    card.querySelector("button").addEventListener("click", () => {
      if (!auth.currentUser) {
        alert("Debes iniciar sesión");
        return;
      }

      reservaActual = {
        hotelId: docSnap.id,
        hotel: h.nombre,
        precio: h.precio,
        entrada: fechaEntrada.value,
        salida: fechaSalida.value,
        userId: auth.currentUser.uid,
        createdAt: new Date(),
      };

      document.getElementById("reserva-hotel").textContent = h.nombre;
      document.getElementById("reserva-precio").textContent = h.precio;
      document.getElementById("reserva-entrada").textContent = fechaEntrada.value;
      document.getElementById("reserva-salida").textContent = fechaSalida.value;

      reservaModal.style.display = "flex";
    });

    hotelesList.appendChild(card);
  }
}

// ===============================
// CONFIRMAR RESERVA
// ===============================
confirmarBtn.addEventListener("click", async () => {
  if (!reservaActual) return;

  await addDoc(collection(db, "reservas"), reservaActual);
  reservaModal.style.display = "none";
  alert("✅ Reserva guardada correctamente");
});

// ===============================
// MIS RESERVAS
// ===============================
async function cargarMisReservas() {
  reservasList.innerHTML = "";

  if (!auth.currentUser) {
    reservasList.innerHTML = "<p>Inicia sesión para ver tus reservas</p>";
    return;
  }

  const q = query(
    collection(db, "reservas"),
    where("userId", "==", auth.currentUser.uid)
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    reservasList.innerHTML = "<p>No tienes reservas activas.</p>";
    return;
  }

  snapshot.forEach((docSnap) => {
    const r = docSnap.data();

    const card = document.createElement("div");
    card.className = "hotel-card reserva-card";

    card.innerHTML = `
      <div class="content">
        <h3>${r.hotel}</h3>
        <p>📅 ${r.entrada} → ${r.salida}</p>
        <p>💲 ${r.precio} por noche</p>
        <button class="cancel-btn">❌ Cancelar reserva</button>
      </div>
    `;

    card.querySelector(".cancel-btn").addEventListener("click", async () => {
      const confirmar = confirm(
        "¿Estás seguro de cancelar esta reserva?"
      );

      if (!confirmar) return;

      await deleteDoc(doc(db, "reservas", docSnap.id));

      alert("✅ Reserva cancelada");
      cargarMisReservas(); // refrescar lista
    });

    reservasList.appendChild(card);
  });
}

// ===============================
// TABS
// ===============================
tabs.forEach((tab, index) => {
  tab.addEventListener("click", () => {
    tabs.forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");

    if (index === 0) {
      searchSection.style.display = "block";
      hotelesSection.style.display = "block";
      reservasSection.style.display = "none";
    }

    if (index === 1) {
      searchSection.style.display = "none";
      hotelesSection.style.display = "none";
      reservasSection.style.display = "block";
      cargarMisReservas();
    }
  });
});

// ===============================
// EVENTOS
// ===============================
searchBtn.addEventListener("click", cargarHoteles);

closeReserva.addEventListener("click", () => {
  reservaModal.style.display = "none";
});

fechaEntrada.addEventListener("change", () => {
  document.getElementById("error-fechas").style.display = "none";
});

fechaSalida.addEventListener("change", () => {
  document.getElementById("error-fechas").style.display = "none";
});
