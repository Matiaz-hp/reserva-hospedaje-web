import { db } from "./firebase-config.js";
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

const hotelesList = document.getElementById('hoteles-list');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');

// Inicializar calendario
flatpickr("#fecha-reserva", {dateFormat:"Y-m-d"});

// Cargar hoteles de Nauta desde Firestore
async function cargarHoteles(filtro='') {
  hotelesList.innerHTML = '';
  const hotelesRef = collection(db,'hoteles');
  let q = query(hotelesRef, where("ciudad",'==',"Nauta"));
  if(filtro){ q = query(hotelesRef, where("nombre",'==',filtro)); }

  const snapshot = await getDocs(q);
  snapshot.forEach(docSnap=>{
    const h = docSnap.data();
    const card = document.createElement('div');
    card.className = 'hotel-card';

    const imgUrl = `https://source.unsplash.com/400x300/?hotel,${h.ciudad}`;
    card.innerHTML = `<img src="${imgUrl}" alt="${h.nombre}">
                      <h3>${h.nombre}</h3>
                      <p>Ciudad: ${h.ciudad}</p>
                      <p>Precio: $${h.precio}</p>
                      <p id="clima-${docSnap.id}">Cargando clima...</p>`;
    hotelesList.appendChild(card);

    // Clima con OpenWeatherMap
    if(h.lat && h.lng){
      fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${h.lat}&lon=${h.lng}&appid=TU_API_KEY&units=metric&lang=es`)
      .then(res=>res.json())
      .then(data=>{
        const climaP = card.querySelector(`#clima-${docSnap.id}`);
        climaP.textContent = `Clima: ${data.weather[0].description}, ${data.main.temp}°C`;
      }).catch(()=>{});
    }

    // Animación
    setTimeout(()=>{ card.style.opacity = 1; card.style.transform = 'translateY(0)'; },100);
  });
}

// Buscar hoteles
searchBtn?.addEventListener('click', ()=>{ cargarHoteles(searchInput.value.trim()); });

// Cargar al iniciar
window.addEventListener('DOMContentLoaded',()=>{ cargarHoteles(); });

