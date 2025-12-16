import { db } from "./firebase-config.js";
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

const hotelesList = document.getElementById('hoteles-list');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');

// Cards de ejemplo
const ejemploHoteles = [
  {nombre:'Hotel Sol', ciudad:'Lima', precio:120},
  {nombre:'Hotel Mar', ciudad:'Cusco', precio:80},
  {nombre:'Hotel Andino', ciudad:'Arequipa', precio:100},
  {nombre:'Hotel Plaza', ciudad:'Trujillo', precio:90}
];

// Función para mostrar hoteles
async function cargarHoteles(filtro=''){
  hotelesList.innerHTML = '';

  // Combinar ejemplo + Firestore
  const hoteles = [...ejemploHoteles];

  try {
    const hotelesRef = collection(db,'hoteles');
    let q = hotelesRef;
    if(filtro){ q = query(hotelesRef, where("nombre",'==',filtro)); }
    const snapshot = await getDocs(q);
    snapshot.forEach(docSnap=>{ hoteles.push(docSnap.data()); });
  } catch(err){
    console.log("Firestore no disponible, usando ejemplos");
  }

  hoteles.forEach((h,index)=>{
    const card = document.createElement('div');
    card.className = 'hotel-card';
    const imgUrl = `https://source.unsplash.com/400x300/?hotel,${h.ciudad}`;
    card.innerHTML = `<img src="${imgUrl}" alt="${h.nombre}">
                      <h3>${h.nombre}</h3>
                      <p>Ciudad: ${h.ciudad}</p>
                      <p>Precio: $${h.precio}</p>`;
    hotelesList.appendChild(card);

    // Animación fade-in
    setTimeout(()=>{ card.style.opacity=1; card.style.transform='translateY(0)'; },100*index);
  });
}

// Buscar hoteles
searchBtn?.addEventListener('click', ()=>{ cargarHoteles(searchInput.value.trim()); });

// Cargar al inicio
window.addEventListener('DOMContentLoaded',()=>{ cargarHoteles(); });
