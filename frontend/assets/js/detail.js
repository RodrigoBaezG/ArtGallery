document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const artworkId = urlParams.get('id');

    if (artworkId) {
        cargarDetalleObra(artworkId);
    } else {
        const container = document.getElementById('artwork-detail');
        if (container) container.innerHTML = '<p class="error-message">Error: no artwork ID specified.</p>';
    }
});

async function cargarDetalleObra(id) {
    const detailContainer = document.getElementById('artwork-detail');
    if (!detailContainer) return;

    try {
        const response = await fetch(`${API_BASE_URL}/pintura/${id}`);

        if (response.status === 404) {
            detailContainer.innerHTML = '<p class="error-message">Artwork not found.</p>';
            return;
        }

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const obra = await response.json();
        renderizarDetalle(obra, detailContainer);

    } catch (error) {
        console.error('Error loading artwork:', error);
        if (detailContainer) {
            detailContainer.innerHTML = `<p class="error-message">Could not load artwork. ${error.message}</p>`;
        }
    }
}

function renderizarDetalle(obra, container) {
    const precio = obra.precio
        ? `$${parseFloat(obra.precio).toFixed(2)}`
        : 'Contact for pricing';

    document.title = `${obra.titulo} — Kuko Báez`;

    const descripcionHTML = obra.descripcion
        ? `<div class="detail-description"><p>${obra.descripcion}</p></div>`
        : '';

    container.innerHTML = `
        <a href="javascript:history.back()" class="back-link">← Back</a>
        <div class="detail-content">
            <div class="detail-image-container">
                <img src="${obra.url_imagen}" alt="${obra.titulo}">
            </div>
            <div class="detail-info">
                <h1>${obra.titulo}</h1>
                <div class="detail-meta">
                    <div class="detail-meta-item">
                        <span class="detail-meta-label">Technique</span>
                        <span class="detail-meta-value">${obra.tecnica}</span>
                    </div>
                    <div class="detail-meta-item">
                        <span class="detail-meta-label">Print price</span>
                        <span class="detail-meta-value price">${precio}</span>
                    </div>
                </div>
                ${descripcionHTML}
            </div>
        </div>
    `;
}
