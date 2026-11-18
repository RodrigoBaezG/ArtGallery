/* Marca <html> con la clase "js" antes de pintar (carga síncrona en <head>, antes del CSS).
   Archivo externo en lugar de <script> inline para cumplir la CSP (script-src 'self'). */
document.documentElement.classList.add('js');
