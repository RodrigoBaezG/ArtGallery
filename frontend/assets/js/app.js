// Espera a que el DOM (Document Object Model) esté completamente cargado
document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Seleccionar los elementos clave del DOM
    const menuToggle = document.querySelector('.menu-toggle');
    const navMenu = document.querySelector('.nav-menu');

    // 2. Agregar un "escuchador de eventos" (event listener) al botón
    menuToggle.addEventListener('click', () => {
        
        // 3. Alternar la clase 'active' en la lista de navegación
        // Si la clase existe, la quita. Si no existe, la añade.
        // Esto activará la regla CSS .nav-menu.active { max-height: 300px; }
        navMenu.classList.toggle('active');
        
        // Opcional: Cambiar el icono de hamburguesa a una 'X' al abrir
        if (navMenu.classList.contains('active')) {
            menuToggle.textContent = '✕'; // Icono 'X'
            menuToggle.setAttribute('aria-expanded', 'true');
        } else {
            menuToggle.textContent = '☰'; // Icono de Hamburguesa
            menuToggle.setAttribute('aria-expanded', 'false');
        }
    });

    // 4. Cierre del Menú al hacer clic en un enlace (IMPORTANTE para móviles)
    // Esto asegura que el menú se oculte después de la navegación en la misma página.
    const navLinks = document.querySelectorAll('.nav-menu a');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (navMenu.classList.contains('active')) {
                navMenu.classList.remove('active');
                menuToggle.textContent = '☰';
                menuToggle.setAttribute('aria-expanded', 'false');
            }
        });
    });

});