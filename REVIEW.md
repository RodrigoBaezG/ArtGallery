# REVIEW — Kuko Báez Art Gallery

## Resumen General

El proyecto es un portafolio artístico full-stack para el artista Rodrigo "Kuko" Báez. La arquitectura es sólida: frontend estático en HTML/CSS/JS vanilla, backend en Node.js + Express, y base de datos PostgreSQL. La estructura de carpetas es clara y la responsividad está bien pensada con un enfoque mobile-first. Sin embargo, hay una serie de correcciones técnicas y mejoras estéticas necesarias antes de poder considerarlo producción.

---

## Puntos a Mejorar — Lista Paso a Paso

### Fase 1 — Correcciones Críticas

1. **Configurar variables de entorno en `.env`**
   - El archivo `backend/.env` está vacío. El servidor no puede conectarse a la base de datos sin las credenciales.
   - Agregar: `DB_USER`, `DB_HOST`, `DB_NAME`, `DB_PASSWORD`, `DB_PORT`, `DATABASE_URL`, `PORT`, `NODE_ENV`.

2. **Desacoplar la URL del API**
   - `gallery.js` y `detail.js` tienen la URL de producción hardcodeada: `https://artgallery-h90r.onrender.com/api`.
   - Crear un archivo `frontend/assets/js/config.js` con la URL base, y switchear según el entorno (localhost en dev, producción en deploy).

3. **Corregir rutas de imágenes en la base de datos**
   - Las rutas usan backslashes de Windows (`assets\img\...`). Las URLs deben usar forward slashes (`assets/img/...`).
   - Actualizar los registros en la tabla `pinturas` y validar las rutas antes de insertarlas.

4. **Corregir variable CSS inexistente**
   - `gallery.css` referencia `--color-negro` que no está definida en `styles.css`.
   - Reemplazar por la variable correcta `--color-gris-oscuro` o definir la variable faltante.

---

### Fase 2 — Funcionalidad Incompleta

5. **Mostrar la descripción en la página de detalle**
   - La tabla `pinturas` tiene un campo `descripcion` que nunca se muestra en `detail.js`.
   - Agregar el campo al template de `detail.js` y darle estilo en `detail.css`.

6. **Agregar media query en `detail.css` para móvil**
   - El layout de detalle usa `flex-direction: row` por defecto pero no tiene breakpoint para pantallas pequeñas.
   - Agregar `flex-direction: column` para pantallas menores de 768px.

7. **Validación defensiva en JavaScript**
   - Antes de manipular el DOM, verificar que los elementos existen (`if (!element) return`).
   - Agregar `try/catch` en las llamadas `fetch` para manejar errores de red sin romper la UI.

8. **Validación e higiene en el backend**
   - Agregar validación de parámetros en las rutas (`/api/pintura/:id` debe verificar que el ID sea un número válido).
   - Agregar manejo de errores globales con middleware Express.
   - Agregar rate limiting básico con `express-rate-limit`.

---

### Fase 3 — Mejoras de Producto

9. **Sustituir imágenes de prueba por obra real**
   - Reemplazar los registros con imágenes de `picsum.photos` por las imágenes reales del artista.
   - Organizar las imágenes por categoría en `frontend/assets/img/`.

10. **Añadir más obras a la base de datos**
    - Con solo 4 registros de prueba no se puede evaluar el layout de galería ni la experiencia real.
    - Insertar al menos 9-12 obras distribuidas entre las 3 categorías.

11. **Lazy loading de imágenes**
    - Agregar `loading="lazy"` en todas las etiquetas `<img>` para mejorar el rendimiento.

12. **SEO básico y Open Graph**
    - Agregar meta tags en los tres archivos HTML: `description`, `og:title`, `og:image`, `og:url`.
    - Agregar un `<link rel="canonical">` por página.

13. **Panel de administración (futuro)**
    - Agregar una ruta protegida con autenticación para que el artista pueda subir y gestionar sus obras sin tocar la base de datos directamente.

---

### Fase 4 — Calidad y Documentación

14. **Completar el `README.md`**
    - Agregar instrucciones de instalación local, configuración de base de datos, y cómo correr el servidor.
    - Documentar los endpoints del API.

15. **Agregar tests básicos**
    - Al menos un test de integración por endpoint del API usando `supertest` o similar.

---

## Mejoras Estéticas — Aspecto Moderno y Minimalista

El objetivo es un diseño más limpio, aireado y contemporáneo, cercano a las galerías de arte actuales (Saatchi Art, Artsy, Are.na). Los cambios propuestos no rompen la identidad existente sino que la refinan.

### Tipografía

- **Titulares:** Cambiar a una fuente serif con carácter, por ejemplo `Cormorant Garamond` o `Playfair Display` (Google Fonts). Las galerías de arte usan serifas para dar peso y elegancia.
- **Cuerpo / interfaz:** Mantener una sans-serif limpia. Cambiar a `Inter` o `DM Sans` para mejor legibilidad en pantalla.
- **Tamaños:** Aumentar el contraste de escala tipográfica. El h1 del hero puede ser más grande (clamp de 3rem a 6rem). Los párrafos de información deben respirar más (line-height: 1.7).

### Paleta de Color

- Simplificar a **3 tonos máximo** más blanco y negro:
  - Fondo principal: `#F5F4F0` (blanco roto cálido, no blanco puro — reduce fatiga visual)
  - Texto: `#1C1C1A` (negro casi puro)
  - Acento único: mantener el verde esmeralda `#156969` como único color de marca
- Eliminar el azul ultramarino como segunda variable de acento. El conflicto entre dos acentos fríos debilita la identidad.

### Espaciado y Layout

- Aumentar el padding vertical en todas las secciones. Una galería de arte necesita aire — mínimo `4rem` arriba y abajo por sección.
- En el grid de galería, reducir el número de columnas en desktop de 3 a **2 columnas con imágenes más grandes**. Esto da más peso visual a cada obra.
- Usar `gap` generoso entre cards (al menos `2rem`).

### Navegación

- Simplificar la navbar: solo el logo a la izquierda y los links a la derecha, sin fondos ni bordes.
- Fondo de navbar: transparente sobre el hero, cambia a `#F5F4F0` con `box-shadow` al hacer scroll (efecto de scroll-aware con un pequeño script).
- Quitar el color de fondo sólido actual de la navbar y dejar solo la frontera inferior sutil.

### Cards de Galería

- Eliminar el `border-radius` redondeado de las cards. Las esquinas rectas son más editoriales.
- Quitar el `box-shadow` de las cards — el hover ya da el efecto suficiente.
- Hacer que la información debajo de la imagen sea más minimalista: solo título en serif y técnica en sans-serif pequeña y gris.
- En hover: en lugar de escalar la card, hacer un `fade-in` de una capa semitransparente sobre la imagen con el título encima (efecto overlay).

### Hero de la Home

- Aumentar el hero a `100vh` con la imagen cubriendo toda la pantalla.
- Centrar el título del artista con letras grandes en blanco sobre la imagen (con un overlay oscuro sutil).
- Quitar el fondo de color del bloque de texto si lo hay — la imagen debe hablar sola.

### Página de Detalle

- Layout de dos columnas: imagen en el 60% izquierdo, información en el 40% derecho.
- La información debe estar alineada verticalmente al centro con buen espaciado interno.
- Agregar una línea divisoria (`<hr>`) sutil entre campos de información.
- El precio, si está disponible, destacarlo en el acento verde esmeralda.

### Footer

- Simplificar al máximo: solo nombre del artista, año, y links de redes sociales como iconos SVG (no texto).
- Fondo del footer: negro `#1C1C1A`, texto blanco — buen contraste y cierre definitivo de la página.

### Microinteracciones

- Agregar una transición de entrada suave (`fade-in` + `translateY` de 20px) en las cards de galería al cargar la página usando `IntersectionObserver`.
- Cursor personalizado: un círculo pequeño que sigue el ratón sobre las imágenes (opcional, añade carácter artístico).
- Link "Ver obra" en hover de cards con un underline animado en lugar de botón.

---

## Prioridad de Implementación

| Prioridad | Item |
|-----------|------|
| Alta | Fase 1 completa (críticos) |
| Alta | Mejoras tipográficas y paleta simplificada |
| Alta | Layout del hero a 100vh |
| Media | Fase 2 completa (funcionalidad incompleta) |
| Media | Cards sin borde-radius, overlay en hover |
| Media | Footer negro simplificado |
| Baja | Fase 3 (producto) y Fase 4 (documentación) |
| Baja | Microinteracciones y cursor personalizado |
