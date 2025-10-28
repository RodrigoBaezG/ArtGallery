// js/detalle.js

const API_BASE_URL = 'https://artgallery-h90r.onrender.com/api'; // Asegúrate de cambiar esto para Render

document.addEventListener('DOMContentLoaded', () => {
    // 1. Obtener el ID de la URL (ej. detalle.html?id=5)
    const urlParams = new URLSearchParams(window.location.search);
    const artworkId = urlParams.get('id');

    if (artworkId) {
        cargarDetalleObra(artworkId);
    } else {
        document.getElementById('artwork-detail').innerHTML = '<p class="error-message">Error: ID de obra no especificado.</p>';
        document.getElementById('detalle-title').textContent = 'Error';
    }
});

async function cargarDetalleObra(id) {
    const detailContainer = document.getElementById('artwork-detail');

    try {
        // Llama al endpoint del backend: /api/pintura/:id
        const response = await fetch(`${API_BASE_URL}/pintura/${id}`);

        if (response.status === 404) {
            detailContainer.innerHTML = '<p class="error-message">Obra no encontrada.</p>';
            return;
        }

        if (!response.ok) {
            throw new Error('Fallo en la respuesta de la API.');
        }

        const obra = await response.json();

        // 2. Renderizar los detalles en el HTML
        renderizarDetalle(obra, detailContainer);

    } catch (error) {
        console.error('Error al obtener la obra:', error);
        detailContainer.innerHTML = `<p class="error-message">Error al cargar la obra. ${error.message}</p>`;
    }
}

function renderizarDetalle(obra, container) {

    // Formatear la fecha
    const fecha = new Date(obra.fecha_creacion).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });

    // Formatear el precio
    const precio = obra.precio ? `$${parseFloat(obra.precio).toFixed(2)}` : 'N/A';

    // Construir el HTML
    const detailHTML = `
        <div class="detail-content">
            <div class="detail-image-container">
                <img src="${obra.url_imagen}" alt="${obra.titulo}">
            </div>
            <div class="detail-info">
                <h1>${obra.titulo}</h1>
                <p><strong>Technique:</strong> ${obra.tecnica}</p>
                <p><strong>Print price:</strong> ${precio}</p>
                <hr style="margin: 1.5rem 0; border-color: var(--color-ultramar-claro);">
                            </div>
        </div>
    `;

    // Actualizar el título de la pestaña y el contenido
    document.getElementById('detalle-title').textContent = `${obra.titulo} - Galería`;
    container.innerHTML = detailHTML;
}