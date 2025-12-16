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
import {
  getAuth,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

const auth = getAuth();
const ADMIN_EMAIL = "admin@admin.com"; // 👈 TU CORREO ADMIN

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
const pagosSection = document.getElementById("pagos");

// ADMIN
const adminLoginSection = document.getElementById("admin-login");
const adminPanelSection = document.getElementById("admin-panel");
const adminForm = document.getElementById("admin-login-form");
const hotelSelect = document.getElementById("hotel-select");
const nuevoPrecioInput = document.getElementById("nuevo-precio");
const guardarPrecioBtn = document.getElementById("guardar-precio-btn");
const loginError = document.getElementById("login-error");

// MODAL RESERVA
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
    error.textContent = "⚠️ La fecha de salida debe ser mayor.";
    error.style.display = "block";
    return false;
  }

  error.style.display = "none";
  return true;
}

function calcularNoches(entrada, salida) {
  return (new Date(salida) - new Date(entrada)) / (1000 * 60 * 60 * 24);
}

// ===============================
// DISPONIBILIDAD
// ===============================
async function hotelDisponible(hotelId, entrada, salida) {
  const q = query(collection(db, "reservas"), where("hotelId", "==", hotelId));
  const snapshot = await getDocs(q);

  for (const docSnap of snapshot.docs) {
    const r = docSnap.data();
    if (
      new Date(r.entrada) < new Date(salida) &&
      new Date(r.salida) > new Date(entrada)
    ) {
      return false;
    }
  }
  return true;
}

// ===============================
// CARGAR HOTELES (USUARIO)
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
  alert("✅ Reserva guardada");
});

// ===============================
// LOGIN ADMIN
// ===============================
adminForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("admin-email").value;
  const password = document.getElementById("admin-password").value;

  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);

    if (cred.user.email !== ADMIN_EMAIL) {
      loginError.style.display = "block";
      return;
    }

    adminLoginSection.style.display = "none";
    adminPanelSection.style.display = "block";
    cargarHotelesAdmin();
  } catch (err) {
    loginError.style.display = "block";
  }
});

// ===============================
// ADMIN: CARGAR HOTELES
// ===============================
async function cargarHotelesAdmin() {
  hotelSelect.innerHTML = "";
  const snapshot = await getDocs(collection(db, "hoteles"));

  snapshot.forEach(docSnap => {
    const h = docSnap.data();
    const option = document.createElement("option");
    option.value = docSnap.id;
    option.textContent = `${h.nombre} ($${h.precio})`;
    hotelSelect.appendChild(option);
  });
}

// ===============================
// ADMIN: ACTUALIZAR PRECIO
// ===============================
guardarPrecioBtn?.addEventListener("click", async () => {
  const hotelId = hotelSelect.value;
  const nuevoPrecio = Number(nuevoPrecioInput.value);

  if (!hotelId || nuevoPrecio <= 0) {
    alert("Precio inválido");
    return;
  }

  await updateDoc(doc(db, "hoteles", hotelId), {
    precio: nuevoPrecio
  });

  alert("✅ Precio actualizado");
  cargarHotelesAdmin();
});

// ===============================
// TABS
// ===============================
tabs.forEach((tab, index) => {
  tab.addEventListener("click", () => {
    tabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");

    searchSection.style.display = "none";
    hotelesSection.style.display = "none";
    reservasSection.style.display = "none";
    pagosSection.style.display = "none";
    adminLoginSection.style.display = "none";
    adminPanelSection.style.display = "none";

    if (index === 0) {
      searchSection.style.display = "block";
      hotelesSection.style.display = "block";
    }

    if (index === 1) {
      reservasSection.style.display = "block";
    }

    if (index === 2) {
      pagosSection.style.display = "block";
    }

    if (index === 3) {
      adminLoginSection.style.display = "block";
    }
  });
});

// ===============================
searchBtn.addEventListener("click", cargarHoteles);
closeReserva.addEventListener("click", () => reservaModal.style.display = "none");
