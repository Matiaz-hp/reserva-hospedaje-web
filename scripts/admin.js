
import { auth, db } from "./firebase-config.js";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { deleteUser } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

/* ==========================
   ELEMENTOS DEL DOM
========================== */
const hotelNombre = document.getElementById("hotel-nombre");
const hotelCiudad = document.getElementById("hotel-ciudad");
const hotelPrecio = document.getElementById("hotel-precio");
const hotelCapacidad = document.getElementById("hotel-capacidad");
const hotelFechaInicio = document.getElementById("hotel-fecha-inicio");
const hotelFechaFin = document.getElementById("hotel-fecha-fin");
const hotelImagen = document.getElementById("hotel-imagen");
const guardarBtn = document.getElementById("guardar-hotel");
const listaHoteles = document.getElementById("lista-hoteles");
const hotelMsg = document.getElementById("hotel-msg");

const listaUsuarios = document.getElementById("lista-usuarios");

let editHotelId = null; // para saber si estamos editando

/* ==========================
   FUNCIONES CRUD DE HOTELES
========================== */
async function guardarHotel() {
  const nombre = hotelNombre.value.trim();
  const ciudad = hotelCiudad.value.trim();
  const precio = hotelPrecio.value.trim();
  const capacidad = hotelCapacidad.value.trim();
  const fechaInicio = hotelFechaInicio.value;
  const fechaFin = hotelFechaFin.value;
  const imagen = hotelImagen.value.trim();

  if (!nombre || !ciudad || !precio || !capacidad || !fechaInicio || !fechaFin || !imagen) {
    hotelMsg.textContent = "❌ Completa todos los campos";
    hotelMsg.className = "messages error";
    return;
  }

  try {
    if (editHotelId) {
      // Editar hotel
      await updateDoc(doc(db, "hoteles", editHotelId), {
        nombre,
        ciudad,
        precio: Number(precio),
        capacidad: Number(capacidad),
        fechaInicio,
        fechaFin,
        imagenUrl: imagen
      });
      hotelMsg.textContent = "✅ Hotel actualizado correctamente";
      editHotelId = null;
      guardarBtn.textContent = "Guardar Hotel";
    } else {
      // Crear nuevo hotel
      await addDoc(collection(db, "hoteles"), {
        nombre,
        ciudad,
        precio: Number(precio),
        capacidad: Number(capacidad),
        fechaInicio,
        fechaFin,
        imagenUrl: imagen,
        createdAt: new Date()
      });
      hotelMsg.textContent = "✅ Hotel guardado correctamente";
    }

    // Limpiar formulario
    hotelNombre.value = "";
    hotelCiudad.value = "";
    hotelPrecio.value = "";
    hotelCapacidad.value = "";
    hotelFechaInicio.value = "";
    hotelFechaFin.value = "";
    hotelImagen.value = "";

  } catch (err) {
    hotelMsg.textContent = "❌ " + err.message;
    hotelMsg.className = "messages error";
  }
}

guardarBtn.addEventListener("click", guardarHotel);

/* ==========================
   LISTAR HOTELES EN TIEMPO REAL
========================== */
const qHoteles = query(collection(db, "hoteles"), orderBy("createdAt", "desc"));
onSnapshot(qHoteles, (snapshot) => {
  listaHoteles.innerHTML = "";
  snapshot.forEach(docSnap => {
    const h = docSnap.data();
    const div = document.createElement("div");
    div.className = "hotel-item";
    div.innerHTML = `
      <div class="hotel-info">
        <img src="${h.imagenUrl}" alt="${h.nombre}">
        <strong>${h.nombre}</strong> – ${h.ciudad} – $${h.precio} – Cap: ${h.capacidad} – ${h.fechaInicio} a ${h.fechaFin}
      </div>
      <div>
        <button class="edit" data-id="${docSnap.id}">Editar</button>
        <button class="delete" data-id="${docSnap.id}">Eliminar</button>
      </div>
    `;
    listaHoteles.appendChild(div);
  });

  // Eventos botones Editar y Eliminar
  document.querySelectorAll(".edit").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const id = e.target.dataset.id;
      const docSnap = await getDocs(doc(db, "hoteles", id));
      const hotel = (await doc(db, "hoteles", id).get()).data();
      hotelNombre.value = hotel.nombre;
      hotelCiudad.value = hotel.ciudad;
      hotelPrecio.value = hotel.precio;
      hotelCapacidad.value = hotel.capacidad;
      hotelFechaInicio.value = hotel.fechaInicio;
      hotelFechaFin.value = hotel.fechaFin;
      hotelImagen.value = hotel.imagenUrl;
      editHotelId = id;
      guardarBtn.textContent = "Actualizar Hotel";
    });
  });

  document.querySelectorAll(".delete").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const id = e.target.dataset.id;
      if (confirm("¿Eliminar este hotel?")) {
        await deleteDoc(doc(db, "hoteles", id));
        hotelMsg.textContent = "✅ Hotel eliminado";
        hotelMsg.className = "messages";
      }
    });
  });
});

/* ==========================
   LISTAR USUARIOS
========================== */
const firebaseAuth = getAuth();
async function cargarUsuarios() {
  // NOTA: Firebase Auth no permite obtener todos los usuarios directamente en cliente,
  // normalmente se requiere Firebase Admin SDK (Node.js) o cloud function
  // Aquí vamos a simular con Firestore usuarios guardados
  const snapshot = await getDocs(collection(db, "usuarios"));
  listaUsuarios.innerHTML = "";
  snapshot.forEach(docSnap => {
    const u = docSnap.data();
    const div = document.createElement("div");
    div.className = "user-item";
    div.innerHTML = `
      <div>${u.nombre || "Sin nombre"} – ${u.email}</div>
      <div>
        <button class="delete-user" data-id="${docSnap.id}">Eliminar</button>
      </div>
    `;
    listaUsuarios.appendChild(div);
  });

  document.querySelectorAll(".delete-user").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const id = e.target.dataset.id;
      if (confirm("¿Eliminar este usuario?")) {
        await deleteDoc(doc(db, "usuarios", id));
        alert("Usuario eliminado de Firestore (Auth no se puede eliminar desde cliente)");
        cargarUsuarios();
      }
    });
  });
}

cargarUsuarios();
