/* ==========================================================================
   about.js — recursos opcionales de la página About
   El retrato y los CV en PDF aún no existen. Su marcado vive en <template>
   (no se descarga nada ni se ve ningún enlace roto, tampoco sin JS).
   Cada <template data-optional-asset> lleva data-enabled="false": este script
   lo ignora y no hace ninguna petición. Para activarlo, cuando el archivo
   exista, se cambia a data-enabled="true" en about.html; entonces se hace un
   HEAD de comprobación y, si responde bien, se inserta el bloque.
   ========================================================================== */
(function () {
  'use strict';

  var templates = document.querySelectorAll('template[data-optional-asset][data-enabled="true"]');
  if (!templates.length) return;

  function exists(url) {
    return fetch(url, { method: 'HEAD', cache: 'no-cache' }).then(function (r) {
      var type = r.headers.get('content-type') || '';
      return r.ok && type.indexOf('text/html') === -1; // descarta páginas 404/fallback
    }).catch(function () { return false; });
  }

  Array.prototype.forEach.call(templates, function (tpl) {
    exists(tpl.dataset.optionalAsset).then(function (ok) {
      if (!ok) return;
      var target = document.querySelector(tpl.dataset.target);
      if (!target) return;
      var node = tpl.content.firstElementChild.cloneNode(true);
      if (tpl.dataset.position === 'prepend') target.insertBefore(node, target.firstChild);
      else target.appendChild(node);
      if (tpl.dataset.targetClass) target.classList.add(tpl.dataset.targetClass);
      target.removeAttribute('hidden');
      var section = target.closest('[data-optional-section]');
      if (section) section.removeAttribute('hidden');
      window.I18n.register(node);
    });
  });
})();
