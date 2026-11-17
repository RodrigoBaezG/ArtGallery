/* ==========================================================================
   nav.js — menú móvil
   El botón solo cambia aria-expanded y su texto (abrir/cerrar); el CSS hace
   el resto. Se cierra con Esc, al pulsar un enlace o al hacer clic fuera.
   ========================================================================== */
(function () {
  'use strict';

  var toggle = document.querySelector('.nav__toggle');
  var menu = toggle && document.getElementById(toggle.getAttribute('aria-controls'));

  // Texto visible corto (menuOpen/menuClose: «Menu»/«Close») y nombre accesible
  // completo en aria-label (menuOpenLabel/menuCloseLabel: «Open menu»/«Close menu»).
  function label(open) {
    if (!window.I18n) return;
    var text = window.I18n.t(open ? 'common.nav.menuClose' : 'common.nav.menuOpen');
    var aria = window.I18n.t(open ? 'common.nav.menuCloseLabel' : 'common.nav.menuOpenLabel');
    if (text) toggle.textContent = text;
    if (aria) toggle.setAttribute('aria-label', aria);
  }

  function setOpen(open) {
    toggle.setAttribute('aria-expanded', String(open));
    label(open);
  }

  function isOpen() {
    return toggle.getAttribute('aria-expanded') === 'true';
  }

  if (toggle && menu) {
    toggle.addEventListener('click', function () { setOpen(!isOpen()); });

    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen()) {
        e.preventDefault(); // evita que otras páginas (work.js) reaccionen al mismo Esc
        setOpen(false);
        toggle.focus();
      }
    });

    document.addEventListener('click', function (e) {
      if (isOpen() && !e.target.closest('.nav')) setOpen(false);
    });

    // Si el foco sale de la nav (Tab tras el último enlace), se cierra el menú.
    toggle.closest('.nav').addEventListener('focusout', function (e) {
      if (isOpen() && e.relatedTarget && !e.target.closest('.nav').contains(e.relatedTarget)) setOpen(false);
    });

    document.addEventListener('i18n:change', function () { label(isOpen()); });
  }
})();
