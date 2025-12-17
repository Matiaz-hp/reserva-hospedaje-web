import { auth, db, storage } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-storage.js";

/* =======================
   LISTA DE ADMINS
======================= */
const ADMINS = ["admin@tudominio.com"];

/* =======================
   ELEMENTOS DOM
======================= */
const logoutBtn = document.getElementById("logout-admin");
const guardarBtn = document.getElementById("guardar-hotel");
const listaHoteles = document.getElementById("lista-hoteles");
const msg = document.getElementById("admin-msg");

/* =======================
   PROTECCIÓN DEL PANEL
======================= */
onAuthStateChanged(auth, user => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }
  if (!ADMINS.includes(user.email)) {
    alert("Acceso denegado: no eres administrador");
    window.location.href = "index.html";
  }
});

/* =======================
   LOGOUT ADMIN
======================= */
logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "index.html";
});

/* =======================
   GUARDAR HOTEL
======================= */
guardarBtn.addEventListener("click", async () => {
  const nombre = document.getElementById("hotel-nombre").value.trim();
  const ciudad = document.getElementById("hotel-ciudad").value.trim();
  const precio = parseFloat(document.getElementById("hotel-precio").value);
  const imagenFile = document.getElementById("hotel-imagen").files[0];

  if (!nombre || !ciudad || !precio || !imagenFile) {
    msg.textContent = "❌ Completa todos los campos incluyendo imagen";
    return;
  }

  try {
    // Subir imagen a Storage
    const storageRef = ref(storage, `hoteles/${Date.now()}_${imagenFile.name}`);
    await uploadBytes(storageRef, imagenFile);
    const imagenUrl = await getDownloadURL(storageRef);

    // Guardar en Firestore
    await addDoc(collection(db, "hoteles"), {
      nombre,
      ciudad,
      precio,
      imagenUrl,
      createdAt: new Date()
    });

    msg.textContent = "✅ Hotel guardado correctamente";
    document.getElementById("hotel-nombre").value = "";
    document.getElementById("hotel-ciudad").value = "";
    document.getElementById("hotel-precio").value = "";
    document.getElementById("hotel-imagen").value = "";

    cargarHoteles();
  } catch (err) {
    console.error(err);
    msg.textContent = "❌ Error al guardar hotel";
  }
});

/* =======================
   CARGAR HOTELES
======================= */
async function cargarHoteles() {
  listaHoteles.innerHTML = "";

  const snapshot = await getDocs(collection(db, "hoteles"));
  snapshot.forEach(docSnap => {
    const hotel = docSnap.data();
    const id = docSnap.id;

    const div = document.createElement("div");
    div.classList.add("hotel-item");

    div.innerHTML = `
      <div class="hotel-info" style="display:flex;align-items:center;">
        <img src="${hotel.imagenUrl}" alt="${hotel.nombre}">
        <span><strong>${hotel.nombre}</strong> – ${hotel.ciudad} – $${hotel.precio}</span>
      </div>
      <div>
        <button onclick="editarHotel('${id}')">✏️ Editar</button>
        <button onclick="eliminarHotel('${id}')">🗑️ Eliminar</button>
      </div>
    `;

    listaHoteles.appendChild(div);
  });
}

/* =======================
   EDITAR HOTEL
======================= */
window.editarHotel = async (id) => {
  const docRef = doc(db, "hoteles", id);
  const hotelSnap = await getDocs(collection(db, "hoteles"));
  const nombre = prompt("Nuevo nombre del hotel:");
  const ciudad = prompt("Nueva ciudad:");
  const precio = prompt("Nuevo precio:");

  if (!nombre || !ciudad || !precio) return;

  await updateDoc(docRef, {
    nombre,
    ciudad,
    precio: parseFloat(precio)
  });

  cargarHoteles();
};

/* =======================
   ELIMINAR HOTEL
======================= */
window.eliminarHotel = async (id) => {
  if (!confirm("¿Seguro que deseas eliminar este hotel?")) return;
  await deleteDoc(doc(db, "hoteles", id));
  cargarHoteles();
};

/* =======================
   CARGAR AL INICIO
======================= */
cargarHoteles();

