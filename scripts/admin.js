import { auth, db } from "./firebase-config.js";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

/* =====================
   ELEMENTOS DOM
===================== */
const listaHoteles = document.getElementById("lista-hoteles");
const listaUsuarios = document.getElementById("lista-usuarios");
const listaReservas = document.getElementById("lista-reservas");
const msgHotel = document.getElementById("hotel-msg");
const guardarHotelBtn = document.getElementById("guardar-hotel");

let hotelEditandoId = null;

/* =====================
   GUARDAR / EDITAR HOTEL
===================== */
guardarHotelBtn.addEventListener("click", async () => {
  const hotel = {
    nombre: document.getElementById("hotel-nombre").value.trim(),
    ciudad: document.getElementById("hotel-ciudad").value.trim(),
    precio: Number(document.getElementById("hotel-precio").value),
    capacidad: Number(document.getElementById("hotel-capacidad").value),
    fechaInicio: document.getElementById("hotel-fecha-inicio").value,
    fechaFin: document.getElementById("hotel-fecha-fin").value,
    imagen: document.getElementById("hotel-imagen").value.trim()
  };

  if (!hotel.nombre || !hotel.ciudad || !hotel.precio) {
    msgHotel.textContent = "❌ Completa los campos obligatorios";
    return;
  }

  try {
    if (hotelEditandoId) {
      await updateDoc(doc(db, "hoteles", hotelEditandoId), hotel);
      msgHotel.textContent = "✅ Hotel actualizado";
      hotelEditandoId = null;
    } else {
      await addDoc(collection(db, "hoteles"), hotel);
      msgHotel.textContent = "✅ Hotel agregado";
    }

    limpiarFormularioHotel();
    cargarHoteles();
  } catch (e) {
    msgHotel.textContent = e.message;
  }
});

/* =====================
   LISTAR HOTELES
===================== */
async function cargarHoteles() {
  listaHoteles.innerHTML = "";
  const snapshot = await getDocs(collection(db, "hoteles"));

  snapshot.forEach(d => {
    const h = d.data();
    listaHoteles.innerHTML += `
      <div class="hotel-item">
        <div class="hotel-info">
          <img src="${h.imagen || 'https://via.placeholder.com/60'}">
          <div>
            <strong>${h.nombre}</strong><br>
            ${h.ciudad} – <b>S/. ${h.precio}</b>
          </div>
        </div>
        <div>
          <button class="btn-small edit" data-id="${d.id}">Editar</button>
          <button class="btn-small delete" data-id="${d.id}">Eliminar</button>
        </div>
      </div>
    `;
  });

  document.querySelectorAll(".edit").forEach(btn => {
    btn.onclick = () => editarHotel(btn.dataset.id);
  });

  document.querySelectorAll(".delete").forEach(btn => {
    btn.onclick = () => eliminarHotel(btn.dataset.id);
  });
}

/* =====================
   EDITAR HOTEL
===================== */
async function editarHotel(id) {
  const snap = await getDocs(collection(db, "hoteles"));
  snap.forEach(d => {
    if (d.id === id) {
      const h = d.data();
      document.getElementById("hotel-nombre").value = h.nombre;
      document.getElementById("hotel-ciudad").value = h.ciudad;
      document.getElementById("hotel-precio").value = h.precio;
      document.getElementById("hotel-capacidad").value = h.capacidad;
      document.getElementById("hotel-fecha-inicio").value = h.fechaInicio;
      document.getElementById("hotel-fecha-fin").value = h.fechaFin;
      document.getElementById("hotel-imagen").value = h.imagen;
      hotelEditandoId = id;
    }
  });
}

/* =====================
   ELIMINAR HOTEL
===================== */
async function eliminarHotel(id) {
  if (!confirm("¿Eliminar este hotel?")) return;
  await deleteDoc(doc(db, "hoteles", id));
  cargarHoteles();
}

/* =====================
   LISTAR USUARIOS
===================== */
async function cargarUsuarios() {
  listaUsuarios.innerHTML = "";
  const snapshot = await getDocs(collection(db, "users"));

  snapshot.forEach(d => {
    const u = d.data();
    listaUsuarios.innerHTML += `
      <div class="user-item">
        <span>${u.name} – ${u.email}</span>
        <button class="btn-small delete" data-id="${d.id}">Eliminar</button>
      </div>
    `;
  });

  document.querySelectorAll(".user-item .delete").forEach(btn => {
    btn.onclick = async () => {
      if (!confirm("¿Eliminar usuario?")) return;
      await deleteDoc(doc(db, "users", btn.dataset.id));
      cargarUsuarios();
    };
  });
}

/* =====================
   LISTAR RESERVAS (✔ USUARIO REAL)
===================== */
async function cargarReservas() {
  listaReservas.innerHTML = "";
  const snapshot = await getDocs(collection(db, "reserva"));

  for (const d of snapshot.docs) {
    const r = d.data();

    let userName = "Usuario desconocido";
    let userEmail = "";

    if (r.userId) {
      const userSnap = await getDoc(doc(db, "users", r.userId));
      if (userSnap.exists()) {
        const u = userSnap.data();
        userName = u.name;
        userEmail = u.email;
      }
    }

    listaReservas.innerHTML += `
      <div class="reserva-item">
        <div class="reserva-info">
          <img src="${r.imagen || 'https://via.placeholder.com/60'}">
          <div>
            <strong>${r.hotel}</strong><br>
            Usuario: <b>${userName}</b><br>
            ${userEmail ? `Email: ${userEmail}<br>` : ""}
            ${r.fechaEntrada} → ${r.fechaSalida}<br>
            Estado: <b>${r.estado}</b>
          </div>
        </div>
        ${r.estado === "pendiente"
          ? `<button class="btn-small" data-pay="${d.id}">Marcar pagado</button>`
          : ""}
        <button class="btn-small delete" data-del="${d.id}">Eliminar</button>
      </div>
    `;
  }

  document.querySelectorAll("[data-del]").forEach(btn => {
    btn.onclick = async () => {
      await deleteDoc(doc(db, "reserva", btn.dataset.del));
      cargarReservas();
    };
  });
}

/* =====================
   UTIL
===================== */
function limpiarFormularioHotel() {
  document.querySelectorAll("#hoteles-tab input").forEach(i => i.value = "");
}

/* =====================
   INIT
===================== */
cargarHoteles();
cargarUsuarios();
cargarReservas();

