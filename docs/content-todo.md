# Datos pendientes de Rodrigo

Lista de lo que falta para completar los textos del portfolio. Cada `[[TODO: …]]` de `frontend/i18n/en.json` y `es.json` corresponde a una pregunta de aquí. Basta con responder en español; el agente `content-writer` redacta las dos versiones.

Leyenda: **PRIORIDAD ALTA** = lo primero que hay que responder (QA ronda 1: About y fichas de obra se quedan cojas sin esto). **(bloqueante)** = sin esto la página queda con un hueco visible.

---

## General / Home

1. **ACTUALIZADA (2026-11-19)**: por tu decisión de añadir los dibujos, el eslogan es ahora **"Watercolor & drawing illustrator — editorial, books & commissions" / "Ilustrador en acuarela y dibujo — editorial, libros y encargos"**. Se han ajustado igual los títulos y descripciones SEO, el `jobTitle`, la bio ("Ilustrador en acuarela y dibujo") y la línea de técnica de About ("También dibujo a grafito, a plumilla y con bolígrafo"). ¿Te parece bien la formulación?
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

17a. **NUEVA** La página de encargos dice ahora que haces ilustraciones "en acuarela o dibujo" (también en encargos personales), y el paso 4 se llama "Obra final" en lugar de "Pintura". ¿Aceptas encargos solo de dibujo (grafito, plumilla, bolígrafo)? Si no, lo devolvemos a solo acuarela.
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

Desde el 2026-11-19 el catálogo tiene **66 obras en dos categorías**: 33 en **Acuarela** (`watercolor`) y 33 en **Dibujos** (`drawing`). Abajo, primero las 22 originales y después las 44 nuevas.

### Las 22 obras originales

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
| **peacock-headdress** (destacada) | She | Ella | **PRIORIDAD ALTA** | **PRIORIDAD ALTA** | **PRIORIDAD ALTA** |
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

### Las 44 obras nuevas (2026-11-19)

**Títulos: PROPUESTA.** Son títulos descriptivos redactados a partir de lo que se ve, con el mismo tono que los 22 aceptados. En `artworks.json` van sin marca para que no se vea `[[PROPUESTA]]` en pantalla, pero **todos están pendientes de tu visto bueno**: cambia los que quieras. En el fan art el título solo nombra al personaje o la obra; no se afirma ningún vínculo oficial.

Por cada obra falta: **año**, **medidas del original**, **estado** (disponible / vendida / colección privada / encargo) y, opcionalmente, **una frase de descripción**. La única medida conocida es la de `carnival-troupes-ensemble` (50 × 70 cm, del nombre del archivo).

**PRIORIDAD ALTA: los 6 dibujos destacados** (salen primero en la pestaña Dibujos): `dumbledore-pensieve`, `arya-stark-portrait`, `paco-de-lucia-portrait`, `peaky-blinders-shelby-brothers`, `gandalf-and-the-nazgul` y `triana-bridge-seville`.

#### Acuarela (11 nuevas, técnica asignada: "Tinta y acuarela sobre papel")

| id | Título EN (propuesta) | Título ES (propuesta) | Año | Medidas | Estado |
|---|---|---|---|---|---|
| carnival-gentleman-red-top-hat | Carnival: Red Top Hat | Carnaval: chistera roja | falta | falta | falta |
| carnival-singer-reaching-out | Carnival: Reaching Out | Carnaval: el brazo tendido | falta | falta | falta |
| carnival-plumed-bicorne | Carnival: Plumed Bicorne | Carnaval: bicornio de plumas | falta | falta | falta |
| carnival-top-hat-red-coat-profile | Carnival: Red Coat | Carnaval: levita roja | falta | falta | falta |
| carnival-top-hat-open-arms | Carnival: Ribboned Top Hat | Carnaval: chistera de cintas | falta | falta | falta |
| carnival-peace-pendant-open-arms | Carnival: Peace | Carnaval: paz | falta | falta | falta |
| carnival-wide-brim-hat-red-tie | Carnival: Red Tie | Carnaval: corbata roja | falta | falta | falta |
| carnival-man-blue-tunic-rope | Carnival: The Rope | Carnaval: la cuerda | falta | falta | falta |
| carnival-striped-shirt-boater | Carnival: Boater and Stripes | Carnaval: canotier y rayas | falta | falta | falta |
| carnival-singer-head-thrown-back | Carnival: Full Voice | Carnaval: a toda voz | falta | falta | falta |
| boots-hat-treble-clef | Boots, Hat and Treble Clef | Botas, sombrero y clave de sol | falta | falta | falta |

#### Dibujos (33)

| id | Título EN (propuesta) | Título ES (propuesta) | Técnica asignada | Año | Medidas | Estado |
|---|---|---|---|---|---|---|
| **dumbledore-pensieve** (destacada) | Dumbledore and the Pensieve | Dumbledore y el pensadero | Tinta a plumilla | **ALTA** | **ALTA** | **ALTA** |
| **arya-stark-portrait** (destacada) | Arya Stark | Arya Stark | Grafito (confirmar) | **ALTA** | **ALTA** | **ALTA** |
| **paco-de-lucia-portrait** (destacada) | Paco de Lucía | Paco de Lucía | Grafito y aguada gris (confirmar) | **ALTA** | **ALTA** | **ALTA** |
| **peaky-blinders-shelby-brothers** (destacada) | The Shelby Brothers | Los hermanos Shelby | Tinta a plumilla | **ALTA** | **ALTA** | **ALTA** |
| **gandalf-and-the-nazgul** (destacada) | Gandalf and the Nazgûl | Gandalf y el Nazgûl | Tinta a plumilla | **ALTA** | **ALTA** | **ALTA** |
| **triana-bridge-seville** (destacada) | Triana Bridge by Night | Puente de Triana de noche | Tinta y acuarela | **ALTA** | **ALTA** | **ALTA** |
| crucified-christ-closeup | Crucified Christ | Cristo crucificado | Grafito (confirmar) | falta | falta | falta |
| argonath-pillars-of-kings | The Argonath | Los Argonath | Tinta y grafito | falta | falta | falta |
| vito-corleone-godfather | Vito Corleone | Vito Corleone | Tinta a plumilla | falta | falta | falta |
| captain-alatriste | Captain Alatriste | El capitán Alatriste | Tinta y aguada gris | falta | falta | falta |
| voldemort-duel | Voldemort, Wand Raised | Voldemort, varita en alto | Grafito | falta | falta | falta |
| cadiz-cathedral-seafront | Cádiz Cathedral | Catedral de Cádiz | Tinta y acuarela | falta | falta | falta |
| minas-tirith | Minas Tirith | Minas Tirith | Tinta con toques de blanco (confirmar) | falta | falta | falta |
| voldemort-and-harry | Voldemort and Harry | Voldemort y Harry | Tinta a plumilla | falta | falta | falta |
| moses-michelangelo | Michelangelo's Moses | El Moisés de Miguel Ángel | Tinta y realces en blanco sobre papel tintado (confirmar) | falta | falta | falta |
| ned-stark-portrait | Ned Stark | Ned Stark | Tinta y acuarela (confirmar) | falta | falta | falta |
| doctor-strange | Doctor Strange | Doctor Strange | Grafito y tinta | falta | falta | falta |
| thanos-infinity-gauntlet | Thanos and the Infinity Gauntlet | Thanos y el Guantelete del Infinito | Tinta y grafito | falta | falta | falta |
| ragnar-and-lagertha | Ragnar and Lagertha | Ragnar y Lagertha | Bolígrafo azul | falta | falta | falta |
| dobby-studies | Dobby Studies | Estudios de Dobby | Grafito | falta | falta | falta |
| capitan-veneno | Capitán Veneno | Capitán Veneno | Grafito y tinta (confirmar) | falta | falta | falta |
| carnival-troupes-ensemble | Carnival Troupes | Agrupaciones de carnaval | Tinta y acuarela | falta | 50 × 70 cm | falta |
| reclining-lovers | Reclining Lovers | Amantes tendidos | Tinta y acuarela | falta | falta | falta |
| couple-embrace-red-wash | Embrace in Red | Abrazo en rojo | Tinta y acuarela | falta | falta | falta |
| kissing-couple-blue-ink | Kiss in Blue | Beso en azul | Tinta y acuarela | falta | falta | falta |
| bull-red-and-gold | Bull in Red and Gold | Toro en rojo y oro | Tinta y acuarela | falta | falta | falta |
| tabby-cat-walking | Tabby Cat | Gato atigrado | Tinta y acuarela | falta | falta | falta |
| equestrian-fountain-jerez | Fountain in Jerez | Fuente en Jerez | Tinta y acuarela | falta | falta | falta |
| oxford-gothic-memorial | Gothic Memorial, Oxford | Monumento gótico, Oxford | Tinta (confirmar) | falta | falta | falta |
| socrates-statue | Socrates | Sócrates | Tinta a plumilla | falta | falta | falta |
| venus-de-milo | Venus de Milo | Venus de Milo | Tinta a plumilla | falta | falta | falta |
| sculpted-torso-looking-up | Looking Up | Mirando al cielo | Grafito | falta | falta | falta |
| superman-flight | Superman | Superman | Grafito y tinta | falta | falta | falta |

#### Técnicas que tienes que confirmar

Se ha puesto la formulación más prudente según la foto. Dime la técnica real si no coincide:

36. `arya-stark-portrait` y `crucified-christ-closeup`: puesto **"Grafito sobre papel"**. ¿Es grafito, carboncillo o una mezcla?
37. `paco-de-lucia-portrait`: puesto **"Grafito y aguada gris"**. ¿El fondo gris es acuarela, tinta diluida u otra cosa?
38. `capitan-veneno`: puesto **"Grafito y tinta"**. En la foto parece solo lápiz. ¿Lleva tinta?
39. `moses-michelangelo`: puesto **"Tinta y realces en blanco sobre papel tintado"**. ¿Es tinta o bolígrafo? ¿Con qué hiciste los blancos y las manchas verde azulado (acuarela, pastel, lápiz de color)?
40. `ned-stark-portrait`: puesto **"Tinta y acuarela"**. ¿El azul turquesa es acuarela o tinta de color?
41. `minas-tirith`: puesto **"Tinta con toques de blanco"**. ¿El papel es blanco o tintado? ¿Con qué hiciste los blancos?
42. `oxford-gothic-memorial`: puesto **"Tinta sobre papel"**. ¿Plumilla, rotulador o bolígrafo?
43. Las acuarelas sueltas de la pestaña Dibujos (`reclining-lovers`, `couple-embrace-red-wash`, `kissing-couple-blue-ink`, `bull-red-and-gold`, `tabby-cat-walking`, `triana-bridge-seville`, `cadiz-cathedral-seafront`, `equestrian-fountain-jerez`, `carnival-troupes-ensemble`) están todas como "Tinta y acuarela". ¿Correcto?

#### Otras preguntas sobre las obras nuevas

44. ✅ Resuelto (2026-11-19): Rodrigo lo titula «Capitán Veneno» en EN y ES. `capitan-veneno` lleva la dedicatoria «¡Gracias Capitán!». ¿Quién es? ¿Es un encargo o un regalo? ¿Se puede nombrar al retratado? Podría titularse «¡Gracias, Capitán!» si lo prefieres.
45. `oxford-gothic-memorial`: ¿es el Martyrs' Memorial? Si lo confirmas, se nombra en el título.
46. `equestrian-fountain-jerez`: ¿cómo se llama la plaza o la fuente? Así el título sería más concreto.
47. `kissing-couple-blue-ink` viene de un archivo llamado "Hedone8". ¿Forma parte de una serie llamada *Hedone*? ¿Entran también `reclining-lovers` y `couple-embrace-red-wash`? Si es una serie, los títulos podrían llevar ese nombre.
48. Serie de carnaval (11 nuevas + `carnival-troupes-ensemble`): ¿son personajes de agrupaciones concretas (nombre, año, ciudad)? ¿Alguno es un retrato reconocible que se pueda nombrar?
49. Fan art (Harry Potter, El Señor de los Anillos, Juego de Tronos, Marvel, DC, Peaky Blinders, El Padrino, Vikingos): ¿alguno fue un encargo? La pregunta 32 también aplica aquí.
