if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/ws.js').then((registration) => {
    console.log('Service Worker registrado con éxito:', registration);
  }).catch((error) => {
    console.log('Error al registrar el Service Worker:', error);
  });
}

const CACHE_NAME = 'mi-cache-v1';
window.addEventListener("DOMContentLoaded", async () => {
  const defaultArtist = "Andrea Bocelli";
  const url = `https://deezerdevs-deezer.p.rapidapi.com/search?q=${encodeURIComponent(defaultArtist)}`;

  try {
    const response = await fetch(url, API_OPTIONS);
    if (!response.ok) {
      throw new Error(`Error en la búsqueda: ${response.statusText}`);
    }
    const result = await response.json();
    console.log("Búsqueda predeterminada (Andrea Bocelli):", result);
    mostrarResultados(result, defaultArtist);
  } catch (error) {
    console.error("Error en la búsqueda predeterminada:", error);
  }
});

const API_OPTIONS = {
  method: 'GET',
  headers: {
    'x-rapidapi-key': 'dfd07b68dbmshbde5391ce4eb0ccp1cca52jsn6590bf242300',
    'x-rapidapi-host': 'deezerdevs-deezer.p.rapidapi.com'
  }
};


let audioPlayer = new Audio();
let currentUrl = ""; // Guardar la URL actual

function playAudio(url) {
  if (!audioPlayer.paused && currentUrl === url) {
    audioPlayer.pause();
    return;
  }
  
  if (currentUrl !== url) {
    audioPlayer.src = url;
    currentUrl = url;
  }

  audioPlayer.play();
}

function reproducirPreviewTrack(previewUrl, playBtn) {
  if (audioPlayer.src !== previewUrl) {
    audioPlayer.pause();
    audioPlayer.src = previewUrl;
    currentUrl = previewUrl;
    audioPlayer.play();
    playBtn.innerHTML = '<i class="fa fa-pause"></i>';
  } else {
    if (audioPlayer.paused) {
      audioPlayer.play();
      playBtn.innerHTML = '<i class="fa fa-pause"></i>';
    } else {
      audioPlayer.pause();
      playBtn.innerHTML = '<i class="fa fa-play"></i>';
    }
  }

  audioPlayer.onended = () => {
    playBtn.innerHTML = '<i class="fa fa-play"></i>';
  };
}

document.getElementById("searchButton").addEventListener("click", async () => {
  const searchQuery = document.getElementById("searchInput").value.trim();
  if (!searchQuery) {
    alert("Por favor, ingresa un término de búsqueda");
    return;
  }

  // Actualizar la variable global currentArtist si es una nueva búsqueda
  currentArtist = searchQuery;
  currentPage = 0; // Reiniciar la página para una nueva búsqueda
  buscarArtista(searchQuery);
});


let currentPage = 0; // Página actual de la búsqueda
let currentArtist = ""; // Guarda el artista actual para "Ver más"

async function buscarArtista(artist, append = false) {
  const url = `https://deezerdevs-deezer.p.rapidapi.com/search?q=${encodeURIComponent(artist)}&index=${currentPage * 25}`;

  // Verificar si la respuesta está en el cache
  const cachedResponse = await caches.match(url);
  if (cachedResponse) {
    const data = await cachedResponse.json();
    console.log(`Resultados desde cache para ${artist}:`, data);
    mostrarResultados(data, artist, append);
    return;
  }

  try {
    const response = await fetch(url, API_OPTIONS);
    if (!response.ok) {
      throw new Error(`Error en la búsqueda: ${response.statusText}`);
    }
    const result = await response.json();
    console.log(`Resultados para ${artist} (página ${currentPage}):`, result);
    mostrarResultados(result, artist, append);

    // Guardar la respuesta en cache para futuras solicitudes
    const cache = await caches.open(CACHE_NAME);
    cache.put(url, response.clone());
  } catch (error) {
    console.error("Error en la búsqueda:", error);
  }
}



let offset = 0;
const limit = 25; // Número de canciones por solicitud
let lastSearchQuery = ""; // Guardar la última búsqueda para seguir cargando más

function mostrarResultados(data, searchQuery, append = false) {
  const artistContainer = document.getElementById("artistContainer");
  const container = document.getElementById("resultContainer");

  // Si es una nueva búsqueda, limpiar contenedor y reiniciar el offset
  if (!append) {
    artistContainer.innerHTML = "";
    container.innerHTML = "";
    offset = 0; // Reiniciar offset cuando se hace una nueva búsqueda
    lastSearchQuery = searchQuery; // Guardar la última búsqueda
  }

  if (!data || !data.data || !data.data.length) {
    container.innerHTML = "No se encontraron más resultados";
    return;
  }


  if (!append) {
    const filteredArtist = data.data.find(
      (item) => item.artist.name.toLowerCase() === searchQuery.toLowerCase()
    );

    if (filteredArtist) {
      artistContainer.innerHTML = `
        <div class="artist-info">
          <img src="${filteredArtist.artist.picture_medium}" alt="${filteredArtist.artist.name}" width="150">
          <h2>${filteredArtist.artist.name}</h2>
        </div>
      `;
    } else {
      artistContainer.innerHTML = "<p></p>";
    }
  }


  data.data.forEach((item) => {
    if (item.type === "track") {
      const trackName = item.title || "Sin título";
      const artistName = item.artist?.name || "Desconocido";
      const coverUrl = item.album?.cover_medium || "fallback.jpg";
      const previewUrl = item.preview;

      const div = document.createElement("div");
      div.classList.add("result-item");
      div.innerHTML = `
        <p><strong>${trackName}</strong></p>
        <p>${artistName}</p>
        <div class="album-cover-container">
          <img src="${coverUrl}" alt="Portada" />
          <div class="play" style="cursor: pointer;">
            <i class="fa fa-play"></i>
          </div>
        </div>
      `;

      const playBtn = div.querySelector(".play");
      playBtn.addEventListener("click", () => reproducirPreviewTrack(previewUrl, playBtn));
      container.appendChild(div);
    }
  });

  
  offset += limit;
}


  async function cargarMasCanciones() {
    if (!lastSearchQuery) return;
  
    const url = `https://deezerdevs-deezer.p.rapidapi.com/search?q=${encodeURIComponent(lastSearchQuery)}&index=${offset}`;
  
    try {
      const response = await fetch(url, API_OPTIONS);
      if (!response.ok) {
        throw new Error(`Error en la búsqueda: ${response.statusText}`);
      }
      const result = await response.json();
      console.log("Cargando más canciones:", result);
      mostrarResultados(result, lastSearchQuery, true);
    } catch (error) {
      console.error("Error al cargar más canciones:", error);
    }
  }
  document.getElementById("verMas").addEventListener("click", cargarMasCanciones);
  
document.getElementById("searchButton").addEventListener("click", async () => {
  const searchQuery = document.getElementById("searchInput").value.trim();
  if (!searchQuery) {
    alert("Por favor, ingresa un término de búsqueda");
    return;
  }

  currentPage = 0;
  currentArtist = searchQuery;
  buscarArtista(searchQuery);
});


// Modificamos la llamada para incluir el término de búsqueda



////////////////////////////////////////////////////////////////




