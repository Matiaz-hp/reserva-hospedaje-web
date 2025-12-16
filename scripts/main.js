import { db } from "./firebase-config.js";
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

const hotelesGrid = document.querySelector('.hoteles-grid');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');

flatpickr("#fecha-reserva",{dateFormat:"Y-m-d"});

const OPENWEATHER_API_KEY = "TU_API_KEY_OPENWEATHER";
const UNSPLASH_ACCESS_KEY = "TU_API_KEY_UNSPLASH";

async function fetchWeather(ciudad){
  try{
    const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${ciudad}&units=metric&appid=${OPENWEATHER_API_KEY}`);
    const data = await res.json();
    return data.main ? `${data.temp}°C, ${data.weather[0].main}` : '';
  }catch{return'';}
}

async function fetchUnsplash(ciudad){
  try{
    const res = await fetch(`https://api.unsplash.com/search/photos?query=${ciudad} hotel&client_id=${UNSPLASH_ACCESS_KEY}`);
    const data = await res.json();
    return data.results[0]?.urls.small || 'assets/images/hotel1.jpg';
  }catch{return 'assets/images/hotel1.jpg';}
}

async function cargarHoteles(filtro=''){
  hotelesGrid.innerHTML='';
  const hotelesRef = collection(db,'hoteles');
  let q = hotelesRef;
  if(filtro){ q = query(hotelesRef, where("nombre",'==',filtro)); }
  const snapshot = await getDocs(q);
  for(const docSnap of snapshot.docs){
    const h = docSnap.data();
    const img = await fetchUnsplash(h.ciudad);
    const clima = await fetchWeather(h.ciudad);
    const card = document.createElement('div');
    card.className='hotel-card';
    card.innerHTML=`<img src="${img}" alt="${h.nombre}">
      <h3>${h.nombre}</h3>
      <p>Ciudad: ${h.ciudad}</p>
      <p>Precio: $${h.precio}</p>
      <p>Clima: ${clima}</p>`;
    hotelesGrid.appendChild(card);
  }
}

searchBtn?.addEventListener('click',()=>{cargarHoteles(searchInput.value.trim());});

// Mapa
const map = L.map('map').setView([-12.0464,-77.0428],12);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'&copy; OpenStreetMap contributors'}).addTo(map);

async function cargarHotelesMapa(){
  const snapshot = await getDocs(collection(db,'hoteles'));
  snapshot.forEach(async docSnap=>{
    const h = docSnap.data();
    if(h.lat && h.lng){
      const clima = await fetchWeather(h.ciudad);
      L.marker([h.lat,h.lng]).addTo(map)
        .bindPopup(`<b>${h.nombre}</b><br>${h.ciudad}<br>Clima: ${clima}`);
    }
  });
}

window.addEventListener('DOMContentLoaded',()=>{
  cargarHoteles();
  cargarHotelesMapa();
});
