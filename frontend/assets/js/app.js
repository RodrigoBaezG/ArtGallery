document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.querySelector('.menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const navbar = document.querySelector('.navbar');

    // ---- Mobile menu toggle ----
    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            const isOpen = navMenu.classList.contains('active');
            menuToggle.textContent = isOpen ? '✕' : '☰';
            menuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });

        document.querySelectorAll('.nav-menu a').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                menuToggle.textContent = '☰';
                menuToggle.setAttribute('aria-expanded', 'false');
            });
        });
    }

    // ---- Scroll-aware navbar ----
    if (navbar) {
        const hasFullHero = document.querySelector('.hero');

        if (!hasFullHero) {
            // Gallery and detail pages: always solid navbar
            navbar.classList.add('solid');
        } else {
            // Index page: transparent at top, solid on scroll
            const onScroll = () => {
                navbar.classList.toggle('scrolled', window.scrollY > 60);
            };
            window.addEventListener('scroll', onScroll, { passive: true });
        }
    }
});
