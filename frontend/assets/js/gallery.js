document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const categoria = urlParams.get('cat');

    if (!categoria) {
        const grid = document.getElementById('gallery-grid');
        if (grid) grid.innerHTML = '<p class="error-message">No category specified.</p>';
        return;
    }

    const categoryTitle = document.getElementById('category-title');
    const categorySubtitle = document.getElementById('category-subtitle');

    if (categoryTitle) {
        categoryTitle.textContent = categoria.charAt(0).toUpperCase() + categoria.slice(1);
        document.title = `${categoryTitle.textContent} — Kuko Báez`;
    }
    if (categorySubtitle) {
        categorySubtitle.textContent = 'Explore the collection.';
    }

    cargarObras(categoria);
});

async function cargarObras(categoria) {
    const gridContainer = document.getElementById('gallery-grid');
    if (!gridContainer) return;

    gridContainer.innerHTML = '<p id="loading-message">Loading...</p>';

    try {
        const response = await fetch(`${API_BASE_URL}/categoria/${categoria}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const obras = await response.json();
        mostrarObras(obras, gridContainer);
    } catch (error) {
        console.error('Error fetching artworks:', error);
        gridContainer.innerHTML = '<p class="error-message">Could not load artworks. Please try again later.</p>';
    }
}

function mostrarObras(obras, container) {
    container.innerHTML = '';

    if (obras.length === 0) {
        container.innerHTML = '<p class="error-message">No artworks in this category yet.</p>';
        return;
    }

    obras.forEach(obra => {
        const card = document.createElement('a');
        card.href = `detail.html?id=${obra.id}`;
        card.className = 'artwork-card';

        const imageWrapper = document.createElement('div');
        imageWrapper.className = 'artwork-card-image';

        const img = document.createElement('img');
        img.src = obra.url_imagen;
        img.alt = obra.titulo;
        img.loading = 'lazy';

        const overlay = document.createElement('div');
        overlay.className = 'artwork-card-overlay';
        const overlayLabel = document.createElement('span');
        overlayLabel.textContent = 'View work';
        overlay.appendChild(overlayLabel);

        imageWrapper.appendChild(img);
        imageWrapper.appendChild(overlay);

        const info = document.createElement('div');
        info.className = 'artwork-info';

        const title = document.createElement('h3');
        title.textContent = obra.titulo;

        const technique = document.createElement('p');
        technique.textContent = obra.tecnica;

        info.appendChild(title);
        info.appendChild(technique);
        card.appendChild(imageWrapper);
        card.appendChild(info);
        container.appendChild(card);
    });

    // Fade-in with IntersectionObserver
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, i) => {
            if (entry.isIntersecting) {
                setTimeout(() => entry.target.classList.add('visible'), i * 80);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.08 });

    container.querySelectorAll('.artwork-card').forEach(card => observer.observe(card));
}
