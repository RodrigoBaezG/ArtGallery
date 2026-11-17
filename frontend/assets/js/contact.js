/* ==========================================================================
   contact.js — formulario de contacto (Netlify Forms)
   Validación nativa (required / type=email) con mensajes accesibles:
   aria-invalid + .form__error enlazado por aria-describedby. Envío con fetch
   POST url-encoded a "/" y aviso en .form__status (éxito o error).
   Sin JS, el formulario se envía de forma normal a action="/contact.html?sent=1".
   ========================================================================== */
(function () {
  'use strict';

  var form = document.querySelector('form[name="contact"]');
  if (!form) return;

  var I18n = window.I18n;
  var status = form.querySelector('.form__status');
  var submit = form.querySelector('[type="submit"]');
  var fields = Array.prototype.slice.call(form.querySelectorAll('.form__input, .form__textarea, .form__select'));
  var statusState = '';
  var sending = false;

  form.setAttribute('novalidate', '');

  function errorFor(field) {
    return document.getElementById(field.id + '-error');
  }

  function messageFor(field) {
    if (field.validity.valueMissing) return I18n.t('contact.validation.required');
    if (field.validity.typeMismatch || field.validity.patternMismatch) return I18n.t('contact.validation.email');
    return field.validationMessage;
  }

  function validate(field) {
    var error = errorFor(field);
    var ok = field.checkValidity();
    if (ok) field.removeAttribute('aria-invalid');
    else field.setAttribute('aria-invalid', 'true');
    if (error) error.textContent = ok ? '' : messageFor(field);
    return ok;
  }

  function renderStatus() {
    status.classList.remove('form__status--success', 'form__status--error');
    if (!statusState) { status.textContent = ''; return; }
    var heading = I18n.t('contact.' + statusState + '.heading');
    var text = I18n.t('contact.' + statusState + '.text');
    status.textContent = heading + '. ' + text;
    status.classList.add('form__status--' + statusState);
  }

  function setStatus(value) {
    statusState = value;
    renderStatus();
  }

  function setSending(on) {
    sending = on;
    submit.disabled = on;
    submit.textContent = I18n.t(on ? 'contact.form.sending' : 'contact.form.submit');
  }

  fields.forEach(function (field) {
    field.addEventListener('blur', function () {
      if (field.value || field.hasAttribute('aria-invalid')) validate(field);
    });
    field.addEventListener('input', function () {
      if (field.hasAttribute('aria-invalid')) validate(field);
    });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (sending) return;
    var invalid = fields.filter(function (field) { return !validate(field); });
    if (invalid.length) { invalid[0].focus(); return; }

    setStatus('');
    setSending(true);
    fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(new FormData(form)).toString()
    }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      form.reset();
      setStatus('success');
    }).catch(function (err) {
      console.warn('[contact]', err);
      setStatus('error');
    }).then(function () {
      setSending(false);
      status.focus();
    });
  });

  // Vuelta del envío sin JS (action="/contact.html?sent=1")
  I18n.ready.then(function () {
    if (new URLSearchParams(location.search).get('sent') === '1') setStatus('success');
  });

  document.addEventListener('i18n:change', function () {
    renderStatus();
    if (!sending) submit.textContent = I18n.t('contact.form.submit');
    fields.forEach(function (field) { if (field.hasAttribute('aria-invalid')) validate(field); });
  });
})();
