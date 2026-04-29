// backend/tests/api.test.js
//
// Tests de integración del API. Mockean el módulo `config/db` para no depender
// de una base de datos real.
//
// Ejecutar:  node --test tests/api.test.js
//            (desde la carpeta backend/, requiere Node 18+)

const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const request = require('supertest');

// --- Mock del módulo config/db antes de cargar la app ---
const dbPath = require.resolve('../config/db');
const fakeRows = {
    paintings: [
        { id: 1, titulo: 'Test Paint', url_imagen: 'http://x/1.jpg', tecnica: 'Óleo', categoria: 'paintings', precio: '100.00' }
    ],
    drawings: [],
    empty: []
};

let lastQuery = null;
require.cache[dbPath] = {
    id: dbPath,
    filename: dbPath,
    loaded: true,
    exports: {
        query: async (sql, params) => {
            lastQuery = { sql, params };
            if (/FROM pinturas WHERE id/.test(sql)) {
                const id = params[0];
                if (id === 1) {
                    return { rows: [fakeRows.paintings[0]] };
                }
                return { rows: [] };
            }
            if (/FROM pinturas WHERE categoria/.test(sql)) {
                const cat = params[0];
                return { rows: fakeRows[cat] || [] };
            }
            return { rows: [] };
        }
    }
};

const { createApp } = require('../app');
const app = createApp({ enableRateLimit: false });

// --- Tests ---

test('GET / responde 200 con healthcheck', async () => {
    const res = await request(app).get('/');
    assert.strictEqual(res.status, 200);
    assert.match(res.text, /API de Galería de Arte activa\./);
});

test('GET /api/pintura/:id válido devuelve la obra', async () => {
    const res = await request(app).get('/api/pintura/1');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.id, 1);
    assert.strictEqual(res.body.categoria, 'paintings');
});

test('GET /api/pintura/:id inexistente devuelve 404', async () => {
    const res = await request(app).get('/api/pintura/999');
    assert.strictEqual(res.status, 404);
    assert.ok(res.body.error);
});

test('GET /api/pintura/:id no numérico devuelve 400', async () => {
    const res = await request(app).get('/api/pintura/abc');
    assert.strictEqual(res.status, 400);
    assert.match(res.body.error, /número/i);
});

test('GET /api/pintura/0 devuelve 400 por estar fuera de rango', async () => {
    const res = await request(app).get('/api/pintura/0');
    assert.strictEqual(res.status, 400);
    assert.match(res.body.error, /rango/i);
});

test('GET /api/categoria/:categoria devuelve obras', async () => {
    const res = await request(app).get('/api/categoria/paintings');
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body));
    assert.strictEqual(res.body.length, 1);
});

test('GET /api/categoria/:categoria sin resultados devuelve []', async () => {
    const res = await request(app).get('/api/categoria/drawings');
    assert.strictEqual(res.status, 200);
    assert.deepStrictEqual(res.body, []);
});

test('GET /api/categoria con caracteres inválidos devuelve 400', async () => {
    const res = await request(app).get('/api/categoria/inv@lid!');
    assert.strictEqual(res.status, 400);
});

test('Ruta desconocida devuelve 404', async () => {
    const res = await request(app).get('/no-existe');
    assert.strictEqual(res.status, 404);
    assert.ok(res.body.error);
});
