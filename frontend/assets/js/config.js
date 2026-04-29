// Detecta el entorno y elige el backend correspondiente.
// - En local (localhost / 127.0.0.1 / file://): apunta al backend local.
// - En cualquier otro host: usa el backend de producción.
const API_BASE_URL = (() => {
    const host = window.location.hostname;
    const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '';
    return isLocal
        ? 'http://localhost:5000/api'
        : 'https://artgallery-h90r.onrender.com/api';
})();
