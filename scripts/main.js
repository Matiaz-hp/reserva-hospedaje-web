import { db } from "./firebase-config.js";
import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

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
// CALCULAR NOCHES (PASO 6)
// ===============================
function calcularNoches(entrada, salida) {
  const inicio = new Date(entrada);
  const fin = new Date(salida);
  return (fin - inicio) / (1000 * 60 * 60 * 24);
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

  for (const docSnap of snapshot.docs) {
    const r = docSnap.data();

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

      const noches = calcularNoches(fechaEntrada.value, fechaSalida.value);
      const total = noches * h.precio;

      // ===== PASO 6: TOTAL =====
      reservaActual = {
        hotelId: docSnap.id,
        hotel: h.nombre,
        precio: h.precio,
        noches,
        total,
        entrada: fechaEntrada.value,
        salida: fechaSalida.value,
        userId: auth.currentUser.uid,
        createdAt: new Date(),
      };

      document.getElementById("reserva-hotel").textContent = h.nombre;
      document.getElementById("reserva-precio").textContent = h.precio;
      document.getElementById("reserva-entrada").textContent = fechaEntrada.value;
      document.getElementById("reserva-salida").textContent = fechaSalida.value;
      document.getElementById("reserva-noches").textContent = noches;
      document.getElementById("reserva-total").textContent = total;

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
        <p>🌙 Noches: ${r.noches}</p>
        <p>💰 Total: $${r.total}</p>
        <button class="cancel-btn">❌ Cancelar reserva</button>
      </div>
    `;

    card.querySelector(".cancel-btn").addEventListener("click", async () => {
      if (!confirm("¿Cancelar esta reserva?")) return;

      await deleteDoc(doc(db, "reservas", docSnap.id));
      alert("✅ Reserva cancelada");
      cargarMisReservas();
    });

    reservasList.appendChild(card);
  });
}

// ===============================
// TABS
// ===============================
const pagosTabIndex = 2;
const pagosSectionDom = document.getElementById("pagos");

tabs.forEach((tab, index) => {
  tab.addEventListener("click", () => {
    tabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");

    searchSection.style.display = "none";
    hotelesSection.style.display = "none";
    reservasSection.style.display = "none";
    pagosSectionDom.style.display = "none";

    if (index === 0) {
      searchSection.style.display = "block";
      hotelesSection.style.display = "block";
    }

    if (index === 1) {
      reservasSection.style.display = "block";
      cargarMisReservas();
    }

    if (index === 2) {
      pagosSectionDom.style.display = "block";
      cargarPagoPendiente();
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


// ===============================
// PAGOS SIMULADOS
// ===============================
const pagosSection = document.getElementById("pagos");
const pagarBtn = document.getElementById("pagar-btn");
const pagoMsg = document.getElementById("pago-msg");

let reservaPendientePago = null;

// Detectar reserva pendiente
async function cargarPagoPendiente() {
  if (!auth.currentUser) return;

  const q = query(
    collection(db, "reservas"),
    where("userId", "==", auth.currentUser.uid),
    where("estado", "==", "pendiente")
  );

  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    reservaPendientePago = snapshot.docs[0];
    pagoMsg.textContent = `Reserva pendiente por pagar: ${reservaPendientePago.data().hotel}`;
  } else {
    pagoMsg.textContent = "No tienes pagos pendientes.";
  }
}

// Procesar pago simulado
pagarBtn?.addEventListener("click", async () => {
  if (!reservaPendientePago) {
    pagoMsg.textContent = "No hay reservas pendientes.";
    return;
  }

  // Validación básica
  const cardNumber = document.getElementById("card-number").value;
  const cvv = document.getElementById("card-cvv").value;

  if (cardNumber.length < 16 || cvv.length < 3) {
    pagoMsg.textContent = "❌ Datos de tarjeta inválidos";
    return;
  }

  // Simulación exitosa
  await addDoc(collection(db, "pagos"), {
    reservaId: reservaPendientePago.id,
    userId: auth.currentUser.uid,
    monto: reservaPendientePago.data().total,
    fecha: new Date(),
    metodo: "Tarjeta simulada"
  });

  await deleteDoc(doc(db, "reservas", reservaPendientePago.id));

  pagoMsg.textContent = "✅ Pago realizado con éxito";
  alert("💳 Pago aprobado (simulado)");

  reservaPendientePago = null;
});

