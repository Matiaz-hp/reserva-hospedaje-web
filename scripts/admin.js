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
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

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
const logoutBtn = document.getElementById("logout-admin");

let editHotelId = null; // Para saber si estamos editando un hotel

/* ==========================
   PROTECCIÓN DEL DASHBOARD
========================== */
const ADMINS = ["admin@tudominio.com"];

onAuthStateChanged(auth, user => {
  if (!user || !ADMINS.includes(user.email)) {
    alert("No tienes permisos para acceder al Dashboard");
    window.location.href = "index.html";
  }
});

/* ==========================
   LOGOUT ADMIN
========================== */
logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "index.html";
});

/* ==========================
   FUNCIONES CRUD HOTELS
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
        <img src="${h.imagenUrl}" alt="${h.nombre}" style="width:100px;height:60px;object-fit:cover;border-radius:5px;margin-right:10px;">
        <strong>${h.nombre}</strong> – ${h.ciudad} – $${h.precio} – Cap: ${h.capacidad} – ${h.fechaInicio} a ${h.fechaFin}
      </div>
      <div class="hotel-actions">
        <button class="edit" data-id="${docSnap.id}">Editar</button>
        <button class="delete" data-id="${docSnap.id}">Eliminar</button>
      </div>
    `;
    listaHoteles.appendChild(div);
  });

  // Editar hotel
  document.querySelectorAll(".edit").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const id = e.target.dataset.id;
      const hotelRef = doc(db, "hoteles", id);
      const hotelSnap = await getDocs(hotelRef);
      const hotel = (await hotelRef.get()).data();
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

  // Eliminar hotel
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
async function cargarUsuarios() {
  try {
    const snapshot = await getDocs(collection(db, "users"));
    listaUsuarios.innerHTML = "";

    snapshot.forEach(docSnap => {
      const u = docSnap.data();
      const div = document.createElement("div");
      div.className = "user-item";
      div.innerHTML = `
        <div><strong>${u.name || "Sin nombre"}</strong> – ${u.email}</div>
        <div>
          <button class="delete-user" data-id="${docSnap.id}">Eliminar</button>
        </div>
      `;
      listaUsuarios.appendChild(div);
    });

    // Botones para eliminar usuario
    document.querySelectorAll(".delete-user").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        const id = e.target.dataset.id;
        if (confirm("¿Eliminar este usuario?")) {
          await deleteDoc(doc(db, "users", id));
          alert("Usuario eliminado de Firestore");
          cargarUsuarios();
        }
      });
    });

  } catch (err) {
    listaUsuarios.innerHTML = "❌ Error al cargar usuarios: " + err.message;
  }
}

cargarUsuarios();

