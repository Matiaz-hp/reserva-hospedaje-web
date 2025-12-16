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

// ===============================
// DOM
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
// FECHAS
// ===============================
flatpickr("#fecha-reserva", { dateFormat: "Y-m-d" });
flatpickr("#fecha-salida", { dateFormat: "Y-m-d" });

// ===============================
// TABS
// ===============================
tabs.forEach((tab, index) подтверждение => {
  tab.addEventListener("click", () => {
    tabs.forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");

    // Reservar
    if (index === 0) {
      searchSection.style.display = "block";
      hotelesSection.style.display = "block";
      reservasSection.style.display = "none";
    }

    // Mis Reservas
    if (index === 1) {
      searchSection.style.display = "none";
      hotelesSection.style.display = "none";
      reservasSection.style.display = "block";
      cargarMisReservas();
    }
  });
});


fechaEntrada.addEventListener("change", () => {
  document.getElementById("error-fechas").style.display = "none";
});

fechaSalida.addEventListener("change", () => {
  document.getElementById("error-fechas").style.display = "none";
});


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
        <button>Reservar</button>
      </div>
    `;

    card.querySelector("button").addEventListener("click", () => {
      if (!auth.currentUser) {
        alert("Debes iniciar sesión");
        return;
      }

if (!validarFechas(fechaEntrada.value, fechaSalida.value)) {
  return;
}

      reservaActual = {
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
  await addDoc(collection(db, "reservas"), reservaActual);
  reservaModal.style.display = "none";
  alert("✅ Reserva guardada");
});

// ===============================
// CARGAR MIS RESERVAS
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

  snapshot.forEach((docSnap) => {
    const r = docSnap.data();

    const card = document.createElement("div");
    card.className = "hotel-card reserva-card";

    card.innerHTML = `
      <div class="content">
        <h3>${r.hotel}</h3>
        <p>📅 ${r.entrada} → ${r.salida}</p>
        <p>💲 ${r.precio} por noche</p>
      </div>
    `;

    reservasList.appendChild(card);
  });
}

// ===============================
// CERRAR MODAL
// ===============================
closeReserva.addEventListener("click", () => {
  reservaModal.style.display = "none";
});

// INICIO
window.addEventListener("DOMContentLoaded", cargarHoteles);
