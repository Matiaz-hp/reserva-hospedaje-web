import { db } from "./firebase-config.js";
import {
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

// ELEMENTOS DOM
const hotelesList = document.getElementById("hoteles-list");
const searchBtn = document.getElementById("search-btn");
const fechaEntrada = document.getElementById("fecha-reserva");
const fechaSalida = document.getElementById("fecha-salida");
const tipoHabitacion = document.getElementById("tipo-habitacion");
const huespedes = document.getElementById("huespedes");

// CALENDARIOS
flatpickr("#fecha-reserva", { dateFormat: "Y-m-d" });
flatpickr("#fecha-salida", { dateFormat: "Y-m-d" });

// ===============================
// CARGAR HOTELES
// ===============================
async function cargarHoteles(filtros = {}) {
  hotelesList.innerHTML = "";

  const hotelesRef = collection(db, "hoteles");
  let q = hotelesRef;

  // Filtro por tipo de habitación (si existe en Firestore)
  if (filtros.tipo && filtros.tipo !== "Todas") {
    q = query(q, where("tipo", "==", filtros.tipo));
  }

  const snapshot = await getDocs(q);

  snapshot.forEach((docSnap) => {
    const h = docSnap.data();

    const card = document.createElement("div");
    card.className = "hotel-card";
    card.style.opacity = 0;
    card.style.transform = "translateY(20px)";

    const imgUrl = `https://source.unsplash.com/400x300/?hotel,room`;

    card.innerHTML = `
      <img src="${imgUrl}" alt="${h.nombre}">
      <div class="content">
        <h3>${h.nombre}</h3>
        <p>📍 ${h.ciudad}</p>
        <p>💲 ${h.precio} por noche</p>
        <p id="clima-${docSnap.id}">Cargando clima...</p>
        <button>Reservar</button>
      </div>
    `;

    hotelesList.appendChild(card);

    // CLIMA
    if (h.lat && h.lng) {
      fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${h.lat}&lon=${h.lng}&appid=TU_API_KEY&units=metric&lang=es`
      )
        .then((res) => res.json())
        .then((data) => {
          const climaP = card.querySelector(`#clima-${docSnap.id}`);
          climaP.textContent = `🌤 ${data.weather[0].description}, ${data.main.temp}°C`;
        })
        .catch(() => {});
    }

    // ANIMACIÓN
    setTimeout(() => {
      card.style.opacity = 1;
      card.style.transform = "translateY(0)";
    }, 100);
  });
}

// ===============================
// EVENTO BUSCAR
// ===============================
searchBtn.addEventListener("click", () => {
  const filtros = {
    fechaEntrada: fechaEntrada.value,
    fechaSalida: fechaSalida.value,
    tipo: tipoHabitacion.value,
    huespedes: huespedes.value,
  };

  cargarHoteles(filtros);
});

// CARGA INICIAL
window.addEventListener("DOMContentLoaded", () => {
  cargarHoteles();
});
