// js/galeria.js

const API_BASE_URL = 'https://artgallery-h90r.onrender.com/api'; // O la URL de Render cuando despliegues

document.addEventListener('DOMContentLoaded', () => {
    // 1. Obtener la categoría de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const categoria = urlParams.get('cat'); 

    if (!categoria) {
        // Si no hay categoría, redirigir a la página principal o mostrar error.
        document.getElementById('gallery-grid').innerHTML = '<p>Error: Categoría no especificada.</p>';
        return;
    }

    // 2. Actualizar el título de la página
    const categoryTitle = document.getElementById('category-title');
    categoryTitle.textContent = categoria.charAt(0).toUpperCase() + categoria.slice(1);
    document.title = `Galería - ${categoryTitle.textContent}`;
    
    // 3. Llamar a la API
    cargarObras(categoria);
});

async function cargarObras(categoria) {
    const gridContainer = document.getElementById('gallery-grid');
    gridContainer.innerHTML = '<p id="loading-message">Cargando obras...</p>'; // Mostrar mensaje de carga

    try {
        // Llama al endpoint que creamos en el backend: /api/categoria/:categoria
        const response = await fetch(`${API_BASE_URL}/categoria/${categoria}`);
        
        if (!response.ok) {
            throw new Error(`Error al cargar datos: ${response.statusText}`);
        }
        
        const obras = await response.json();
        
        // 4. Inyectar las obras en el HTML
        mostrarObras(obras, gridContainer);

    } catch (error) {
        console.error('Fallo al obtener las obras:', error);
        gridContainer.innerHTML = `<p class="error-message">No se pudieron cargar las obras de ${categoria}. Verifica la conexión con el backend.</p>`;
    }
}

function mostrarObras(obras, container) {
    container.innerHTML = ''; // Limpiar el mensaje de carga
    
    if (obras.length === 0) {
        container.innerHTML = '<p>Aún no hay obras en esta categoría.</p>';
        return;
    }

    obras.forEach(obra => {
        const cardHTML = `
            <a href="detail.html?id=${obra.id}" class="artwork-card">
                <img src="${obra.url_imagen}" alt="${obra.titulo}">
                <div class="artwork-info">
                    <h3>${obra.titulo}</h3>
                    <p>Técnica: ${obra.tecnica}</p>
                    <p>${obra.fecha_creacion.substring(0, 10)}</p>
                </div>
            </a>
        `;
        container.innerHTML += cardHTML;
    });
}