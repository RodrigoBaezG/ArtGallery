# Datos pendientes de Rodrigo

Lista de lo que falta para completar los textos del portfolio. Cada `[[TODO: …]]` de `frontend/i18n/en.json` y `es.json` corresponde a una pregunta de aquí. Basta con responder en español; el agente `content-writer` redacta las dos versiones.

Leyenda: **PRIORIDAD ALTA** = lo primero que hay que responder (QA ronda 1: About y fichas de obra se quedan cojas sin esto). **(bloqueante)** = sin esto la página queda con un hueco visible.

---

## General / Home

1. ¿Te parece bien la línea de posicionamiento **"Watercolor illustrator — editorial, books & commissions" / "Ilustrador en acuarela — editorial, libros y encargos"**? ¿Prefieres "ilustrador" o "artista"?
2. ¿Quieres que en el sitio aparezca "Kuko Báez" solo, o "Kuko Báez (Rodrigo Báez)"? Ahora el nombre real solo sale en la bio y en el copyright.
3. ¿Tienes o piensas tener un dominio propio (p. ej. kukobaez.com)? Afecta a SEO y Open Graph.
4. ¿Qué acuarela quieres como imagen para compartir en redes (Open Graph)?

## About (Sobre mí)

5. **RESPONDIDA**: nacido en Jerez de la Frontera, asentado en Oxford (UK). Ya está en la bio.
6. **RESPONDIDA en parte**: lleva más de 15 años pintando (ya en la bio). Queda abierto, opcional: ¿cómo empezaste con la acuarela? (1–2 frases)
7. **PRIORIDAD ALTA (bio)** ¿Qué formación tienes (estudios, cursos, talleres, autodidacta)? Con año si lo recuerdas.
8. **RESPONDIDA**: retratos, historias y paisajes. Ya está en la bio.
9. **PRIORIDAD ALTA (experiencia)** ¿Con qué clientes, editoriales o marcas has trabajado? Si todavía ninguno, lo dejamos fuera y no pasa nada.
10. **PRIORIDAD ALTA (experiencia)** ¿Se han publicado ilustraciones tuyas en algún libro, revista o medio? Título, medio y año.
11. **PRIORIDAD ALTA (experiencia)** ¿Has expuesto obra? Nombre de la exposición, lugar y año.
12. ¿Algún premio, mención o selección? (solo si existe)
13. Materiales: ¿qué papel (marca, gramaje, grano), pinturas y pinceles usas? ¿Mezclas con tinta, gouache o lápiz?
14. ¿El arte final lo escaneas o lo fotografías? ¿A qué resolución?
15. ~~Retrato~~ **HECHO**: ya hay retrato (busto, fondo blanco, camisa negra). `about.portrait.alt` actualizado.
16. **PRIORIDAD ALTA (CV)** CV en PDF (inglés y español): ¿tienes uno? Si no, ¿quieres que lo redactemos a partir de las respuestas anteriores?

## Commissions (Encargos)

17. Confirma los tipos de encargo: editorial, libros, encargos personales y venta de originales. ¿Falta alguno (p. ej. retratos de mascotas, invitaciones de boda, ilustración para marcas, murales)? ¿Hay alguno que **no** quieras ofrecer?
18. En libros: ¿qué tipo de libros te interesan (infantil, álbum ilustrado, novela, divulgación, cubiertas)?
19. **(bloqueante)** Proceso: ¿coincide con estos pasos? 1) mensaje con la idea → 2) presupuesto y plazo → 3) boceto → 4) acuarela final → 5) entrega. ¿Cambiarías algo?
20. ¿Pides anticipo? Si es así, ¿qué porcentaje y cuándo se paga el resto?
21. ¿Cuántas rondas de cambios incluyes en el boceto? ¿Se aceptan cambios una vez pintada la acuarela?
22. **(bloqueante)** Entrega: en encargos editoriales, ¿entregas escaneo en alta resolución? ¿Qué formato (TIFF, PNG, JPG) y resolución? En encargos personales, ¿entregas el original? ¿Haces envíos? ¿A qué países?
23. **(bloqueante)** Plazos orientativos para: ilustración editorial, proyectos de libro y encargos personales (p. ej. "2–3 semanas").
24. ¿Aceptas encargos urgentes? ¿Con recargo?
25. ¿Quieres mencionar derechos de uso / licencias en editorial (quién conserva los derechos, uso limitado al proyecto)?
26. ¿Mantenemos sin precios públicos, o quieres un "desde X €" para encargos personales?

## Contact (Contacto)

27. **(bloqueante)** ¿En cuánto tiempo sueles responder (p. ej. "en 2–3 días laborables")?
28. ¿Quieres que el email `rkbaezgarcia@gmail.com` siga siendo el visible, o prefieres otro (p. ej. uno con dominio propio)?
29. Opciones del desplegable "Tipo de proyecto": editorial, libro, encargo personal, compra de original, otro. ¿Te sirven?
30. El texto de privacidad dice que solo usarás los datos para responder y que no hay listas de correo. ¿Es así? ¿Necesitas un aviso legal más completo (p. ej. si resides en la UE)?
31. ¿Añadimos otras redes además de Instagram (Behance, LinkedIn, Domestika…)?

## Obras

**Títulos: HECHO.** Rodrigo aceptó los 22 títulos propuestos tal cual (sin prefijo `[[PROPUESTA]]` en `artworks.json`). Las descripciones están vacías a propósito; si alguna obra tiene contexto (encargo, publicación, exposición), cuéntalo y se añade una frase. Técnica asignada: "Acuarela sobre papel"; en la serie `carnival-*`, "Tinta y acuarela sobre papel".

Por cada obra hace falta: **año**, **medidas del original** y **estado** (disponible / vendida / colección privada / encargo). Ahora mismo faltan los tres en las 22.

**PRIORIDAD ALTA: las 6 obras destacadas** (salen primero en la home): `moonlit-sorceress`, `woman-reading-magazine`, `flamenco-duo`, `headwrap-profile`, `father-and-child-guitar` y `peacock-headdress`. Indica año, medidas y estado de estas seis antes que el resto. Es lo único que activa el aviso «Original disponible — consultar». Mientras tanto, la página de encargos ya no promete obras marcadas como disponibles.

| id | Título (EN, aceptado) | Título (ES, aceptado) | Año | Medidas | Estado |
|---|---|---|---|---|---|
| **moonlit-sorceress** (destacada) | Moon Tide | Marea de luna | **PRIORIDAD ALTA** | **PRIORIDAD ALTA** | **PRIORIDAD ALTA** |
| **woman-reading-magazine** (destacada) | The Magazine | La revista | **PRIORIDAD ALTA** | **PRIORIDAD ALTA** | **PRIORIDAD ALTA** |
| **flamenco-duo** (destacada) | Song and Guitar | Cante y guitarra | **PRIORIDAD ALTA** | **PRIORIDAD ALTA** | **PRIORIDAD ALTA** |
| **headwrap-profile** (destacada) | Striped Headwrap | Turbante de rayas | **PRIORIDAD ALTA** | **PRIORIDAD ALTA** | **PRIORIDAD ALTA** |
| **father-and-child-guitar** (destacada) | First Chords | Primeros acordes | **PRIORIDAD ALTA** | **PRIORIDAD ALTA** | **PRIORIDAD ALTA** |
| **peacock-headdress** (destacada) | Peacock | Pavo real | **PRIORIDAD ALTA** | **PRIORIDAD ALTA** | **PRIORIDAD ALTA** |
| bird-and-red-carnation | Bird and Carnation | Pájaro y clavel | falta | falta | falta |
| elven-valley | Valley of Waterfalls | Valle de las cascadas | falta | falta | falta |
| woman-orange-blouse | Orange Blouse | Blusa naranja | falta | falta | falta |
| wolf-portrait | Wolf | Lobo | falta | falta | falta |
| guitarist-profile | Guitarist | Guitarrista | falta | falta | falta |
| bandana-guitarist | Bandana and Guitar | Bandana y guitarra | falta | falta | falta |
| dog-red-collar | Red Collar | Collar rojo | falta | falta | falta |
| two-dogs | Two Friends | Dos amigos | falta | falta | falta |
| carnival-masked-performer | Carnival: Open Arms | Carnaval: brazos abiertos | falta | falta | falta |
| carnival-umbrella-performer | Carnival: The Shout | Carnaval: el grito | falta | falta | falta |
| carnival-harlequin | Carnival: Harlequin | Carnaval: arlequín | falta | falta | falta |
| carnival-singer-scarf | Carnival: The Singer | Carnaval: el cantante | falta | falta | falta |
| embrace-study | Folded | Recogido | falta | falta | falta |
| touching-hands | Touch | Roce | falta | falta | falta |
| crown-of-thorns | Crown of Thorns | Corona de espinas | falta | falta | falta |
| lord-with-wine-glass | The Wine Glass | La copa | falta | falta | falta |

Preguntas adicionales sobre las obras:

32. Algunas obras parecen retratar a personas reales o a personajes y lugares de películas o series (p. ej. `lord-with-wine-glass`, `elven-valley`, `flamenco-duo`, `guitarist-profile`, `crown-of-thorns`). En un portfolio profesional, el fan art de propiedades con copyright puede restar. ¿Quieres mantenerlas? Si alguna es un retrato de alguien concreto, ¿se puede nombrar?
33. `father-and-child-guitar`, `woman-orange-blouse`, `headwrap-profile`, `two-dogs`, `dog-red-collar`: ¿alguna es un encargo? Si lo es, ¿tienes permiso del cliente para publicarla y para nombrarlo?
34. Serie de carnaval: ¿es de un carnaval concreto (ciudad, año)? ¿Es tinta y acuarela, como se ha puesto?
35. ¿Alguna obra está publicada (libro, revista) o se ha expuesto? Sería la descripción ideal.
