/* ==========================================================================
   i18n.js — runtime bilingüe EN / ES
   - Carga i18n/{lang}.json (anidado; la clave con puntos es su ruta).
   - Rellena [data-i18n] (texto) y [data-i18n-attr="attr:clave;attr2:clave2"].
   - [[PROPUESTA]] → se quita el prefijo. [[TODO…]] → se oculta el elemento
     (o el ancestro indicado en data-i18n-hide="selector"). Si un [[TODO]] va
     en mitad del texto se elimina; si lo que queda acaba en ":" se oculta.
   - data-i18n-group: el contenedor se oculta si todos sus elementos
     ocultables (salvo los marcados data-i18n-label) están ocultos.
   - Ocultar = sustituir el nodo por un comentario (no depende de [hidden],
     que el CSS con display:grid/flex anularía) y restaurarlo si deja de ser TODO.
   - Idioma: ?lang > localStorage > navigator.language (es*) > en.
   API: window.I18n = { lang, ready, t, clean, isTodo, setLang, register,
        setShown, artworkText }. Evento: document 'i18n:change' {detail:{lang}}.
   ========================================================================== */
(function () {
  'use strict';

  var LANGS = ['en', 'es'];
  var STORAGE_KEY = 'lang';
  var SITE_URL = 'https://kukobaezgallery.netlify.app/';
  var BASE = new URL('../../', document.currentScript ? document.currentScript.src : location.href);

  var dicts = {};
  var current = detectLang();
  var registry = { text: [], attr: [], groups: [] };
  var placeholders = new WeakMap(); // elemento → comentario que lo sustituye

  /* ---- Detección y persistencia ---------------------------------------- */
  function detectLang() {
    var param = new URLSearchParams(location.search).get('lang');
    if (LANGS.indexOf(param) !== -1) { store(param); return param; }
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (LANGS.indexOf(saved) !== -1) return saved;
    } catch (e) { /* almacenamiento bloqueado */ }
    var nav = (navigator.language || '').toLowerCase();
    return nav.indexOf('es') === 0 ? 'es' : 'en';
  }

  function store(lang) {
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* ignorar */ }
  }

  function setUrlLang(lang) {
    try {
      var url = new URL(location.href);
      url.searchParams.set('lang', lang);
      history.replaceState(history.state, '', url);
    } catch (e) { /* ignorar */ }
  }

  /* ---- Textos ------------------------------------------------------------ */
  var TODO_INLINE = /\s*\[\[TODO[^\]]*\]\]/g;
  var PROPOSAL = /^\s*\[\[PROPUESTA\]\]\s*/;

  function isTodo(str) {
    if (str == null) return true;
    str = String(str);
    if (/^\s*\[\[TODO/.test(str)) return true;
    var rest = str.replace(TODO_INLINE, '').trim();
    return rest === '' || /:$/.test(rest); // vacío o "Etiqueta:" sin dato
  }

  function clean(str) {
    if (str == null) return '';
    return String(str).replace(PROPOSAL, '').replace(TODO_INLINE, '').trim();
  }

  function lookup(dict, key) {
    return key.split('.').reduce(function (obj, part) {
      return obj && typeof obj === 'object' ? obj[part] : undefined;
    }, dict);
  }

  function raw(key, lang) {
    var value = lookup(dicts[lang || current], key);
    if (value === undefined && (lang || current) !== 'en') value = lookup(dicts.en, key);
    return typeof value === 'string' ? value : undefined;
  }

  function interpolate(str, vars) {
    var all = {
      year: String(new Date().getFullYear()),
      email: lookup(dicts[current], 'common.contactInfo.email') || ''
    };
    if (vars) Object.keys(vars).forEach(function (k) { all[k] = vars[k]; });
    return str.replace(/\{(\w+)\}/g, function (m, name) {
      return Object.prototype.hasOwnProperty.call(all, name) ? all[name] : m;
    });
  }

  /** Texto limpio e interpolado; '' si la clave no existe o es TODO. */
  function t(key, vars) {
    var value = raw(key);
    if (value === undefined || isTodo(value)) return '';
    return interpolate(clean(value), vars);
  }

  /** Campo bilingüe de artworks.json ({en, es}) → texto limpio o ''. */
  function artworkText(field) {
    if (!field) return '';
    var value = typeof field === 'string' ? field : (field[current] || field.en || '');
    return isTodo(value) ? '' : clean(value);
  }

  /* ---- Mostrar / ocultar sin depender de [hidden] ------------------------ */
  function setShown(el, shown) {
    if (!el) return;
    var ph = placeholders.get(el);
    if (shown) {
      el.removeAttribute('hidden');
      if (ph && ph.parentNode) ph.parentNode.replaceChild(el, ph);
    } else if (el.parentNode && !(ph && ph.parentNode)) {
      if (!ph) { ph = document.createComment('i18n-hidden'); placeholders.set(el, ph); }
      el.parentNode.replaceChild(ph, el);
    }
  }

  function isShown(el) {
    var ph = placeholders.get(el);
    return !(ph && ph.parentNode) && !el.hasAttribute('hidden');
  }

  /* ---- Registro de elementos -------------------------------------------- */
  function register(root) {
    root = root || document;
    var scope = root.querySelectorAll ? root : document;
    var pick = function (sel) {
      var list = Array.prototype.slice.call(scope.querySelectorAll(sel));
      if (root.matches && root.matches(sel)) list.unshift(root);
      return list;
    };
    pick('[data-i18n]').forEach(function (el) {
      var target = el.dataset.i18nHide ? el.closest(el.dataset.i18nHide) : el;
      registry.text.push({ el: el, key: el.dataset.i18n, target: target || el });
    });
    pick('[data-i18n-attr]').forEach(function (el) {
      el.dataset.i18nAttr.split(';').forEach(function (pair) {
        var i = pair.indexOf(':');
        if (i > 0) registry.attr.push({ el: el, attr: pair.slice(0, i).trim(), key: pair.slice(i + 1).trim() });
      });
    });
    pick('[data-i18n-group]').forEach(function (el) { registry.groups.push(el); });
    if (dicts[current]) applyAll();
  }

  function applyAll() {
    var targets = new Map();
    registry.text.forEach(function (item) {
      var value = raw(item.key);
      if (value === undefined) return; // clave inexistente: se deja el fallback
      var todo = isTodo(value);
      if (!todo) item.el.textContent = interpolate(clean(value));
      var prev = targets.has(item.target) ? targets.get(item.target) : true;
      targets.set(item.target, prev && !todo);
    });
    targets.forEach(function (shown, el) { setShown(el, shown); });

    registry.attr.forEach(function (item) {
      var value = raw(item.key);
      if (value === undefined) return;
      if (isTodo(value)) item.el.removeAttribute(item.attr);
      else item.el.setAttribute(item.attr, interpolate(clean(value)));
    });

    registry.groups.forEach(function (group) {
      var members = [];
      targets.forEach(function (shown, el) {
        if (el === group || (el.dataset && 'i18nLabel' in el.dataset)) return;
        var ph = placeholders.get(el);
        if (group.contains(el) || (ph && group.contains(ph))) members.push(el);
      });
      setShown(group, members.length === 0 || members.some(isShown));
    });
  }

  /* ---- Página: lang, título, meta, selector, canonical ------------------ */
  function setMeta(selector, value) {
    var el = document.head.querySelector(selector);
    if (el && value) el.setAttribute('content', value);
  }

  function applyPage() {
    document.documentElement.lang = current;
    var page = document.body.dataset.page;
    if (page && document.body.dataset.meta !== 'custom') {
      var title = t('meta.' + page + '.title');
      var desc = t('meta.' + page + '.description');
      if (title) document.title = title;
      setMeta('meta[name="description"]', desc);
      setMeta('meta[property="og:title"]', title);
      setMeta('meta[property="og:description"]', desc);
      setMeta('meta[name="twitter:title"]', title);
      setMeta('meta[name="twitter:description"]', desc);
      var canonical = document.head.querySelector('link[rel="canonical"]');
      if (canonical) {
        var url = new URL(canonical.getAttribute('href'));
        url.search = new URLSearchParams(location.search).has('lang') ? '?lang=' + current : '';
        canonical.setAttribute('href', url.href);
        setMeta('meta[property="og:url"]', url.href);
      }
    }
    setMeta('meta[property="og:locale"]', current === 'es' ? 'es_ES' : 'en_US');
    setMeta('meta[property="og:locale:alternate"]', current === 'es' ? 'en_US' : 'es_ES');

    document.querySelectorAll('[data-lang]').forEach(function (btn) {
      btn.setAttribute('aria-pressed', String(btn.dataset.lang === current));
    });
  }

  /* ---- Carga ------------------------------------------------------------ */
  function load(lang) {
    if (dicts[lang]) return Promise.resolve(dicts[lang]);
    return fetch(new URL('i18n/' + lang + '.json', BASE))
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (json) { dicts[lang] = json; return json; });
  }

  function setLang(lang, opts) {
    if (LANGS.indexOf(lang) === -1) return Promise.resolve();
    var loads = [load(lang)];
    if (lang !== 'en') loads.push(load('en').catch(function () {})); // respaldo de claves
    return Promise.all(loads).then(function () {
      current = lang;
      api.lang = lang;
      if (opts && opts.persist) { store(lang); setUrlLang(lang); }
      applyAll();
      applyPage();
      document.dispatchEvent(new CustomEvent('i18n:change', { detail: { lang: lang } }));
    }).catch(function (err) {
      console.warn('[i18n] No se pudo cargar el idioma "' + lang + '":', err);
    });
  }

  var api = {
    lang: current,
    site: SITE_URL,
    t: t,
    raw: raw,
    clean: clean,
    isTodo: isTodo,
    artworkText: artworkText,
    setShown: setShown,
    register: register,
    setLang: setLang,
    ready: null
  };
  window.I18n = api;

  function init() {
    register(document);
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-lang]');
      if (!btn || btn.dataset.lang === current) return;
      setLang(btn.dataset.lang, { persist: true });
    });
    return setLang(current);
  }

  api.ready = new Promise(function (resolve) {
    var start = function () { init().then(resolve, resolve); };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
    else start();
  });
})();
