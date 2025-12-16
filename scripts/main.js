import { db } from "./firebase-config.js";
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

const hotelesList = document.getElementById('hoteles-list');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');

// Hoteles de ejemplo en Nauta, Loreto
const ejemploHoteles = [
  {nombre:'Hotel Nauta River', ciudad:'Nauta', precio:120},
  {nombre:'Amazon Lodge', ciudad:'Nauta', precio:150},
  {nombre:'Hotel Selva', ciudad:'Nauta', precio:100},
  {nombre:'Posada Loreto', ciudad:'Nauta', precio:90}
];

async function cargarHoteles(filtro=''){
  hotelesList.innerHTML = '';

  const hoteles = ejemploHoteles.filter(h => h.ciudad.toLowerCase() === 'nauta');

  try {
    const hotelesRef = collection(db,'hoteles');
    let q = query(hotelesRef, where("ciudad",'==','Nauta'));
    if(filtro){ q = query(hotelesRef, where("ciudad",'==','Nauta'), where("nombre",'==',filtro)); }

    const snapshot = await getDocs(q);
    snapshot.forEach(docSnap=>{ hoteles.push(docSnap.data()); });
  } catch(err){
    console.log("Firestore no disponible, usando ejemplos locales");
  }

  hoteles.forEach((h,index)=>{
    const card = document.createElement('div');
    card.className = 'hotel-card';
    const imgUrl = `https://source.unsplash.com/400x300/?hotel,nauta`;
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

