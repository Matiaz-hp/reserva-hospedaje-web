import { db } from "./firebase-config.js";
import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

const auth = getAuth();

// DOM
const hotelesList = document.getElementById("hoteles-list");
const searchBtn = document.getElementById("search-btn");
const fechaEntrada = document.getElementById("fecha-reserva");
const fechaSalida = document.getElementById("fecha-salida");
const tipoHabitacion = document.getElementById("tipo-habitacion");
const huespedes = document.getElementById("huespedes");

// MODAL
const reservaModal = document.getElementById("reserva-modal");
const closeReserva = document.getElementById("close-reserva");
const confirmarBtn = document.getElementById("confirmar-reserva");

let reservaActual = null;

// ===============================
// CALENDARIOS
// ===============================
flatpickr("#fecha-reserva", { dateFormat: "Y-m-d" });
flatpickr("#fecha-salida", { dateFormat: "Y-m-d" });

// ===============================
// CARGAR HOTELES
// ===============================
async function cargarHoteles() {
  hotelesList.innerHTML = "";

  const snapshot = await getDocs(collection(db, "hoteles"));

  snapshot.forEach((docSnap) => {
    const h = docSnap.data();

    const card = document.createElement("div");
    card.className = "hotel-card";

    card.innerHTML = `
      <img src="https://source.unsplash.com/400x300/?hotel,room" />
      <div class="content">
        <h3>${h.nombre}</h3>
        <p>📍 ${h.ciudad}</p>
        <p>💲 ${h.precio} por noche</p>
        <button class="btn-reservar">Reservar</button>
      </div>
    `;

    // BOTÓN RESERVAR
    card.querySelector(".btn-reservar").addEventListener("click", () => {
      if (!auth.currentUser) {
        alert("Debes iniciar sesión para reservar");
        return;
      }

      if (!fechaEntrada.value || !fechaSalida.value) {
        alert("Selecciona fechas de entrada y salida");
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
  });
}

// ===============================
// CONFIRMAR RESERVA
// ===============================
confirmarBtn.addEventListener("click", async () => {
  if (!reservaActual) return;

  await addDoc(collection(db, "reservas"), reservaActual);

  reservaModal.style.display = "none";
  alert("✅ Reserva realizada con éxito");
});

// CERRAR MODAL
closeReserva.addEventListener("click", () => {
  reservaModal.style.display = "none";
});

// INICIO
window.addEventListener("DOMContentLoaded", cargarHoteles);
