
import { db } from "./firebase-config.js";
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

// Elementos
const hotelesList = document.getElementById('hoteles-list');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const fechaInput = document.getElementById('fecha-reserva');

// Inicializar Flatpickr
flatpickr("#fecha-reserva", {dateFormat:"Y-m-d"});

// Mostrar hoteles
async function cargarHoteles(filtro=''){
  hotelesList.innerHTML = '';
  const hotelesRef = collection(db,'hoteles');
  let q = hotelesRef;
  if(filtro){
    q = query(hotelesRef, where("nombre",'==',filtro));
  }
  const snapshot = await getDocs(q);
  snapshot.forEach(docSnap=>{
    const h = docSnap.data();
    const card = document.createElement('div');
    card.className = 'hotel-card';
    card.innerHTML = `
      <img src="assets/images/${h.imagen}" alt="${h.nombre}">
      <h3>${h.nombre}</h3>
      <p>Ciudad: ${h.ciudad}</p>
      <p>Precio: $${h.precio}</p>
    `;
    hotelesList.appendChild(card);
  });
}

// Buscador
searchBtn?.addEventListener('click', ()=>{
  const filtro = searchInput.value.trim();
  cargarHoteles(filtro);
});

// Inicializar mapa Leaflet
const map = L.map('map').setView([-12.0464,-77.0428],12);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
  attribution:'&copy; OpenStreetMap contributors'
}).addTo(map);

// Cargar hoteles en mapa
async function cargarHotelesMapa(){
  const snapshot = await getDocs(collection(db,'hoteles'));
  snapshot.forEach(docSnap=>{
    const h = docSnap.data();
    if(h.lat && h.lng){
      L.marker([h.lat,h.lng]).addTo(map).bindPopup(`<b>${h.nombre}</b><br>${h.ciudad}`);
    }
  });
}

// Inicializa
window.addEventListener('DOMContentLoaded',()=>{
  cargarHoteles();
  cargarHotelesMapa();
});
