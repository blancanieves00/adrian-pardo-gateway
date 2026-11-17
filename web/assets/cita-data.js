/*
 * Cuestionario de cita + carta de servicios — datos
 * ─────────────────────────────────────────────────────────────
 * ESTE es el archivo que se toca en cada iteración con Adrián.
 * Carta, preguntas, caminos, tiempos y precios viven aquí; la carta
 * de la home se pinta desde aquí. Un solo sitio para cambiar un precio.
 *
 * Fuentes
 *   Precios: «Lista de precios» de Adrián, 16 oct 2026 (IVA incluido,
 *            precios para clientas nuevas).
 *   Tiempos: los que dictó él, con exposición (sin contar corte ni peinado).
 *            h: 'var' → «variable» (novias).
 *   Reglas:  sus respuestas del 15 oct 2026 (ver docs/CUESTIONARIO.md).
 *
 * Convenciones (menu)
 *   eur    número · { corto, medio, largo, extra } (precio por tramo de largo)
 *   from   true → en la carta sale como «desde» (el final depende del largo o del peinado)
 *   h      horas: número · [min, max] · { corto, medio, largo, extra } · null (sin dato)
 *   min    true → el tiempo es «mínimo»
 *   scalp  true → toca la raíz/piel → puede requerir prueba de alergia
 *   pending 'precio' | 'tiempo' → aún no lo ha confirmado Adrián (sale marcado en el mapa)
 *   carta  false → no sale en la carta de la home
 */
(function (root) {
  const DATA = {
    version: '0.7.0',
    updated: '2026-10-19',
    provisional: false,
    whatsapp: '34677427724',

    schedule: {
      days: [
        { id: 'mar', label: 'Mar', long: 'martes' },
        { id: 'mie', label: 'Mié', long: 'miércoles' },
        { id: 'jue', label: 'Jue', long: 'jueves' },
        { id: 'vie', label: 'Vie', long: 'viernes' },
        { id: 'sab', label: 'Sáb', long: 'sábado' },
      ],
      slots: [
        { id: 'manana', label: 'Mañana' },
        { id: 'tarde', label: 'Tarde' },
        { id: 'igual', label: 'Me da igual' },
      ],
      saturdayMaxHours: 3.5, // sábado 10:00–13:30
    },

    lengthNote: 'Es solo para situarte en un tramo de precio. El largo y el tipo de pelo los valoro yo en persona, y el precio final sale de ahí.',
    lengths: [
      { id: 'corto', label: 'Corto', hint: 'Por encima de los hombros', drop: 0.28 },
      { id: 'medio', label: 'Medio', hint: 'De los hombros a la clavícula', drop: 0.48 },
      { id: 'largo', label: 'Largo', hint: 'Hasta el pecho o media espalda', drop: 0.7 },
      { id: 'extra', label: 'Muy largo', hint: 'Por debajo de media espalda', drop: 0.92 },
    ],

    /* ── Prueba de alergia ──────────────────────────────────
     * Regla de Adrián: si el último color que tocó la raíz (la piel) fue
     * hace más de 3 meses —o nunca—, prueba de alergia al menos 48 h antes.
     * Aplica a los items con scalp: true. Las mechas no: si alguna necesita
     * mecha de prueba, lo hablan por WhatsApp. */
    allergyTest: {
      label: 'Prueba de alergia · 48 h antes',
      text: 'Como tu último color en la raíz fue hace más de 3 meses (o nunca), necesito hacerte una prueba de alergia al menos 48 horas antes del servicio. Es una visita rápida al studio y la reservamos junto con tu cita.',
    },

    /* ── Henna y tintes de supermercado ─────────────────────
     * Adrián quiere saberlo para el diagnóstico. */
    diagnosisNote: 'La henna y los tintes de supermercado reaccionan distinto con la decoloración y el color. Lo tengo en cuenta en el diagnóstico antes de empezar.',

    /* ── Servicios largos: una o dos sesiones (lo elige la clienta) ── */
    split: {
      minHours: 6,
      options: [
        { id: 'una', label: 'En una sesión', hint: 'Un día de studio' },
        { id: 'dos', label: 'En dos sesiones', hint: 'Más cómodo para ti y para tu pelo' },
      ],
    },

    /* ── Señal / depósito ───────────────────────────────────
     * Desactivado. Para activarlo: enabled: true. Sale un aviso en el
     * resultado y una línea en el WhatsApp para servicios ≥ minHours. */
    deposit: {
      enabled: false,
      minHours: 4,
      text: 'Para servicios largos te pediré una pequeña señal al confirmar la cita.',
    },

    /* ── Carta (lista de precios 16 oct 2026) ─────────────── */
    tiers: {},
    menuNote: 'Precios para nuevas clientas, IVA incluido. Donde pone «desde», el precio final depende del largo o del peinado. Los tiempos de color no incluyen corte ni peinado.',
    /* Fidelización: las clientas habituales tienen precios especiales */
    loyalty: {
      name: 'Círculo AP',
      menu: '¿Formas parte del Círculo AP? Mantengo tu tarifa habitual en los servicios que ya te haces.',
      result: 'Estos son los precios para nuevas clientas. Si formas parte de mi Círculo AP, mantengo tu tarifa habitual en los servicios que ya te haces. Los servicios nuevos van con la tarifa actualizada.',
      chip: 'Formo parte del Círculo AP',
      msg: '*Círculo AP:* sí — tarifa habitual en sus servicios de siempre',
    },
    menuGroups: [
      { id: 'corte', label: 'Corte' },
      { id: 'color', label: 'Color' },
      { id: 'mechas', label: 'Mechas y decoloración' },
      { id: 'elumen', label: 'Elumen' },
      { id: 'peinado', label: 'Peinados' },
      { id: 'novias', label: 'Novias' },
      { id: 'extras', label: 'Extras' },
    ],
    menu: {
      /* Corte */
      corte:            { label: 'Corte', group: 'corte', eur: 29, h: 0.5 },
      flequillo:        { label: 'Corte de flequillo', group: 'corte', eur: 14, h: 0.25 },
      rapado:           { label: 'Rapado', group: 'corte', eur: 27, h: 0.5 },
      cover_chicos:     { label: 'Cover chicos', group: 'corte', eur: 29, h: 1.5, scalp: true, hint: 'Cobertura de canas' },
      /* Color */
      tinte_raiz:       { label: 'Tinte de raíz', group: 'color', eur: 53, h: 1.5, scalp: true },
      tinte_raiz_pig:   { label: 'Tinte de raíz con pigmentos', group: 'color', eur: 64, h: 1.5, scalp: true },
      color_completo:   { label: 'Color completo', group: 'color', eur: { corto: 117, medio: 119, largo: 120, extra: 122 }, from: true, h: 2, scalp: true },
      matiz:            { label: 'Matiz de mantenimiento', group: 'color', eur: { corto: 68, medio: 71, largo: 73, extra: 76 }, from: true, h: 1.5 },
      raiz_corte:       { label: 'Color de raíz + corte', group: 'color', eur: 82, h: 2, scalp: true },
      extraccion:       { label: 'Extracción de color', group: 'color', eur: 66, h: null },
      bond_pro:         { label: 'Tratamiento Bond Pro', group: 'color', eur: 65, h: 1 },
      keratina:         { label: 'Alisado de keratina', group: 'color', eur: 190, from: true, h: 4 },
      trat_cuero:       { label: 'Tratamiento personalizado · cuero cabelludo', group: 'color', eur: 25, h: [0.5, 1] },
      trat_cabello:     { label: 'Tratamiento personalizado · cabello', group: 'color', eur: 50, h: [0.5, 1] },
      /* Mechas y decoloración (todas incluyen matiz) */
      mechas:           { label: 'Mechas', group: 'mechas', eur: 250, h: 4, min: true, hint: 'Incluye matiz' },
      mechas_xxl:       { label: 'Mechas XXL', group: 'mechas', eur: 300, h: 4, min: true, hint: 'Incluye matiz' },
      medias_mechas:    { label: 'Medias mechas', group: 'mechas', eur: 100, h: 2.5, hint: 'Incluye matiz' },
      money_piece:      { label: 'Money piece', group: 'mechas', eur: 85, h: 2.5, hint: 'Incluye matiz' },
      deco_raiz:        { label: 'Decoloración de raíz', group: 'mechas', eur: 110, from: true, h: 3, min: true, scalp: true, hint: 'Incluye matiz' },
      deco_global:      { label: 'Decoloración global', group: 'mechas', eur: 365, from: true, h: 6, min: true, scalp: true, hint: 'Incluye matiz. Según largo' },
      color_especial:   { label: 'Color especial', group: 'mechas', eur: 365, from: true, h: null, hint: 'Precio variable según el trabajo' },
      /* Elumen */
      elumen_color:     { label: 'Color estándar', group: 'elumen', eur: 150, h: 2 },
      balancing:        { label: 'Color balancing', group: 'elumen', eur: 145, h: 2, scalp: true },
      elumen_fantasia:  { label: 'Color fantasía', group: 'elumen', eur: 165, h: 2 },
      matiz_elumen:     { label: 'Matiz Elumen', group: 'elumen', eur: 115, h: 2, hint: 'Blonde toning' },
      deco_fantasia:    { label: 'Decoloración global + refresh fantasía', group: 'elumen', eur: 400, h: null },
      /* Peinados */
      peinado_liso:     { label: 'Peinado liso', group: 'peinado', eur: { corto: 30, medio: 35, largo: 40, extra: 45 }, from: true, h: { corto: 0.5, medio: 0.5, largo: 1, extra: 1 } },
      ondas_surf:       { label: 'Ondas surferas', group: 'peinado', eur: { corto: 40, medio: 45, largo: 50, extra: 55 }, from: true, h: { corto: 0.5, medio: 0.5, largo: 1, extra: 1 } },
      ondas_hollywood:  { label: 'Ondas Hollywood', group: 'peinado', eur: 83, from: true, h: 1.5 },
      recogido_salon:   { label: 'Recogido en salón', group: 'peinado', eur: 75, from: true, h: [1, 2], hint: 'De 75 a 80 € según el peinado' },
      recogido_casa:    { label: 'Recogido a domicilio', group: 'peinado', eur: 100, h: [1, 2] },
      evento_fuera:     { label: 'Peinado de evento fuera del salón', group: 'peinado', eur: 100, h: [1, 2], hint: 'Por invitada' },
      maq_salon:        { label: 'Maquillaje y peinado en salón', group: 'peinado', eur: 120, h: [2, 3] },
      maq_casa:         { label: 'Maquillaje y peinado a domicilio', group: 'peinado', eur: 150, h: [2, 3] },
      /* Novias */
      novia_pelo:       { label: 'Novia · peluquería', group: 'novias', eur: 300, h: 'var' },
      novia_pelo_maq:   { label: 'Novia · peluquería y maquillaje', group: 'novias', eur: 500, h: 'var' },
      /* Extras: también como servicio exclusivo */
      peinado_express:  { label: 'Peinado express', group: 'extras', eur: 15, h: 0.5, hint: 'Como extra o como servicio' },
      lavado_masaje:    { label: 'Lavado con masaje', group: 'extras', eur: 15, h: 0.25, hint: 'Como extra o como servicio' },
    },

    colorExtras: ['corte', 'peinado_liso', 'peinado_express', 'lavado_masaje'],

    services: [
      { id: 'color', label: 'Color', hint: 'Mechas, rubios, canas, color balancing', start: 'natural', active: true },
      { id: 'corte', label: 'Corte', hint: 'Corte, flequillo, rapado', start: 'corte', active: true },
      { id: 'peinado', label: 'Peinados, eventos y novias', hint: 'Peinados, maquillaje, invitadas y novias', start: 'peinado', active: true },
      { id: 'tratamiento', label: 'Tratamiento', hint: 'Cabello, cuero cabelludo, Bond Pro, keratina', start: 'tratamiento', active: true },
      { id: 'posticeria', label: 'Posticería y extensiones', hint: 'Prótesis capilar, pelucas, postizos, extensiones', active: false },
    ],

    nodes: {
      natural: {
        q: '¿Tu pelo está natural?',
        help: 'Natural es sin tinte, mechas, decoloración ni henna en la parte que vamos a trabajar. Si dudas, elige «tiene color»: es lo más prudente.',
        options: [
          { label: 'Sí, está natural', hint: 'Nunca teñido, o el color ya salió con los cortes', tag: 'Pelo natural', next: 'n-servicio', rootRecent: false },
          { label: 'No, tiene color', hint: 'Tinte, mechas, decoloración, henna…', tag: 'Pelo con color', next: 't-tipo' },
        ],
      },

      /* ── Pelo natural ──────────────────────────────── */
      'n-servicio': {
        q: '¿Qué te gustaría conseguir?',
        options: [
          { label: 'Aclarar', hint: 'Mechas, balayage, babylights o un rubio global', tag: 'Aclarar', next: 'n-aclarar' },
          { label: 'Cubrir canas', hint: 'Un color uniforme que tape las canas', tag: 'Cubrir canas', next: 'r:color-completo' },
          { label: 'Oscurecer o equilibrar el tono', hint: 'Más profundidad, más brillo, un tono más rico', tag: 'Oscurecer / equilibrar', next: 'r:balancing' },
          { label: 'Aún no lo tengo claro', hint: 'Lo pensamos juntos', tag: 'Sin decidir', next: 'r:consulta', quiet: true },
        ],
      },
      'n-aclarar': {
        q: '¿Cómo quieres aclarar?',
        options: [
          { label: 'Mechas', hint: 'Luz repartida: balayage, babylights, money piece…', tag: 'Mechas', next: 'r:mechas' },
          { label: 'Aclarado global', hint: 'Todo el pelo más claro, de raíz a puntas', tag: 'Aclarado global', next: 'r:global' },
        ],
      },

      /* ── Pelo con color ────────────────────────────── */
      't-tipo': {
        q: '¿Qué color llevas?',
        help: 'La henna y los tintes de supermercado se comportan distinto: saberlo me ayuda en el diagnóstico.',
        options: [
          { label: 'Color de peluquería', hint: 'Tinte, mechas o decoloración hechos en un salón', tag: 'Color de peluquería', next: 't-servicio' },
          { label: 'Tinte de supermercado', hint: 'De caja, aplicado en casa', tag: 'Tinte de supermercado', diag: 'tinte de supermercado', next: 't-servicio' },
          { label: 'Henna', hint: 'Natural o compuesta', tag: 'Henna', diag: 'henna', next: 't-servicio' },
          { label: 'No lo sé, o una mezcla', hint: 'Lo vemos en el diagnóstico', tag: 'Color desconocido', diag: 'no sabe qué color lleva', next: 't-servicio', quiet: true },
        ],
      },
      't-servicio': {
        q: '¿Qué te gustaría conseguir?',
        options: [
          { label: 'Aclarar', hint: 'Mechas, rubio global, retocar tu rubio', tag: 'Aclarar', next: 't-aclarar' },
          { label: 'Cubrir canas', hint: 'Retocar la raíz o igualar todo el color', tag: 'Cubrir canas', next: 't-canas' },
          { label: 'Reavivar mi color', hint: 'Devolverle intensidad y brillo, sin aclarar', tag: 'Reavivar', next: 'r:refresh' },
          { label: 'Equilibrar u oscurecer', hint: 'Unificar tonos, corregir reflejos, más profundidad', tag: 'Equilibrar / oscurecer', next: 'r:balancing' },
          { label: 'Otra cosa, o no lo tengo claro', hint: 'Corregir o quitar un color…', tag: 'Otra cosa', next: 'r:consulta', quiet: true },
        ],
      },
      't-canas': {
        q: '¿Cuándo fue tu último tinte?',
        help: 'Así sé si basta con la raíz o hay que igualar todo el color. Si fue hace más de 3 meses, también necesito hacerte una prueba de alergia antes.',
        options: [
          { label: 'Hace menos de 3 meses', hint: 'Solo se nota la raíz', tag: 'Último tinte < 3 meses', next: 'r:raiz', rootRecent: true },
          { label: 'Hace más de 3 meses', hint: 'Color completo, con prueba de alergia 48 h antes', tag: 'Último tinte > 3 meses', next: 'r:color-completo', rootRecent: false },
        ],
      },
      /* Se pregunta sola, justo antes del largo, cuando el servicio toca
         la raíz y el camino aún no sabe cuándo fue el último color. */
      raiz: {
        q: '¿Cuándo fue tu último color en la raíz?',
        help: 'Cualquier tinte o decoloración que tocara la raíz. Si fue hace más de 3 meses, necesito hacerte una prueba de alergia al menos 48 horas antes.',
        auto: true,
        options: [
          { label: 'Hace menos de 3 meses', hint: 'Me retoqué la raíz hace poco', tag: 'Último color en raíz < 3 meses', rootRecent: true },
          { label: 'Hace más de 3 meses', hint: 'O nunca me he coloreado la raíz', tag: 'Último color en raíz > 3 meses', rootRecent: false },
          { label: 'No lo recuerdo', hint: 'Por prudencia, haremos la prueba', tag: 'No recuerda el último color en raíz', rootRecent: false, quiet: true },
        ],
      },
      't-aclarar': {
        q: '¿Qué tienes en mente?',
        options: [
          { label: 'Retocar mi rubio', hint: 'Ya llevo decoloración: solo la raíz', tag: 'Decoloración de raíz', next: 'r:deco-raiz' },
          { label: 'Mechas', hint: 'Luz repartida sobre el color que ya llevas', tag: 'Mechas', next: 'r:t-mechas' },
          { label: 'Aclarado global', hint: 'Todo el pelo más claro, de raíz a puntas', tag: 'Aclarado global', next: 'r:t-global' },
        ],
      },

      /* ── Corte ─────────────────────────────────────── */
      corte: {
        q: '¿Qué necesitas?',
        options: [
          { label: 'Corte', hint: 'Corte, flequillo o rapado. Si quieres peinado, lo añades después', tag: 'Corte', next: 'r:corte' },
          { label: 'Cover chicos', hint: 'Cobertura de canas', tag: 'Cover chicos', next: 'r:cover' },
        ],
      },

      /* ── Peinados, eventos y novias ────────────────── */
      peinado: {
        q: '¿Qué necesitas?',
        options: [
          { label: 'Un peinado', hint: 'Liso, ondas o recogido', tag: 'Peinado', next: 'r:peinado' },
          { label: 'Peinado express', hint: 'Un acabado rápido', tag: 'Peinado express', next: 'r:express' },
          { label: 'Un evento', hint: 'Maquillaje y peinado para invitada, gala o sesión de fotos', tag: 'Evento', next: 'evento' },
          { label: 'Mi boda', hint: 'Peluquería, o peluquería y maquillaje de novia', tag: 'Novia', next: 'r:novia' },
        ],
      },
      evento: {
        q: '¿Dónde te preparo?',
        options: [
          { label: 'En el studio', hint: 'Pasaje Esperanto, Málaga centro', tag: 'En el studio', next: 'r:glam-salon' },
          { label: 'Donde estés', hint: 'Me desplazo a tu casa, hotel o localización', tag: 'A domicilio', next: 'r:glam-fuera' },
        ],
      },

      /* ── Tratamiento ───────────────────────────────── */
      tratamiento: {
        q: '¿Qué necesita tu pelo?',
        options: [
          { label: 'Cabello', hint: 'Hidratación, nutrición o reconstrucción a medida', tag: 'Cabello', next: 'r:trat-cabello' },
          { label: 'Cuero cabelludo', hint: 'Grasa, caspa, sensibilidad', tag: 'Cuero cabelludo', next: 'r:trat-cuero' },
          { label: 'Bond Pro', hint: 'Reconstrucción de la fibra', tag: 'Bond Pro', next: 'r:bond' },
          { label: 'Alisado de keratina', hint: 'Menos encrespamiento, más brillo', tag: 'Keratina', next: 'r:keratina' },
          { label: 'Lavado con masaje', hint: 'Un rato para ti', tag: 'Lavado con masaje', next: 'r:lavado' },
        ],
      },
    },

    /* ── Resultados ─────────────────────────────────────── */
    results: {
      mechas: {
        title: 'Mechas', lead: 'Luz a medida: balayage, babylights, money piece. Todas incluyen matiz.',
        img: 'img/w/color-2.jpg',
        includes: ['Diagnóstico previo', 'Técnica de mechas a medida', 'Matiz incluido'],
        notes: ['Algunas mechas necesitan una mecha de prueba antes. Si es tu caso, lo hablamos por WhatsApp.'],
        tiers: [
          { id: 'mechas', label: 'Mechas', items: ['mechas'] },
          { id: 'xxl', label: 'Mechas XXL', items: ['mechas_xxl'] },
          { id: 'medias', label: 'Medias mechas', items: ['medias_mechas'] },
          { id: 'money', label: 'Money piece', items: ['money_piece'], desc: 'Los mechones que enmarcan la cara' },
        ],
        extras: ['corte', 'peinado_liso', 'peinado_express', 'lavado_masaje'],
      },
      't-mechas': {
        title: 'Mechas sobre color', lead: 'Luz repartida sobre el color que ya llevas. Incluyen matiz.',
        img: 'img/w/color-4.jpg',
        includes: ['Diagnóstico del color previo', 'Técnica de mechas a medida', 'Matiz incluido'],
        notes: ['Según el color que lleves, puede hacer falta una extracción previa. Lo confirmo al verte.', 'Algunas mechas necesitan una mecha de prueba antes. Si es tu caso, lo hablamos por WhatsApp.'],
        tiers: [
          { id: 'mechas', label: 'Mechas', items: ['mechas'] },
          { id: 'xxl', label: 'Mechas XXL', items: ['mechas_xxl'] },
          { id: 'medias', label: 'Medias mechas', items: ['medias_mechas'] },
          { id: 'money', label: 'Money piece', items: ['money_piece'], desc: 'Los mechones que enmarcan la cara' },
        ],
        extras: ['corte', 'peinado_liso', 'peinado_express', 'lavado_masaje'],
      },
      global: {
        title: 'Aclarado global', lead: 'Rubio de raíz a puntas: decoloración global con matiz.',
        img: 'img/w/color-3.jpg',
        includes: ['Diagnóstico y mecha de prueba', 'Decoloración con protector de puentes', 'Matiz incluido'],
        notes: ['Si es tu primera decoloración, hago antes una mecha de prueba para saber hasta dónde aguanta tu pelo.'],
        tiers: [{ id: 'base', items: ['deco_global'] }],
        extras: ['corte', 'peinado_liso', 'peinado_express', 'lavado_masaje'],
      },
      't-global': {
        title: 'Aclarado global sobre color', lead: 'Del color que llevas a un rubio de raíz a puntas.',
        img: 'img/w/color-3.jpg',
        includes: ['Diagnóstico y mecha de prueba', 'Extracción de color si hace falta', 'Decoloración con protector de puentes', 'Matiz incluido'],
        notes: ['Aclarar sobre un color previo es el proceso más delicado que hago. La mecha de prueba no es opcional.'],
        tiers: [{ id: 'base', items: ['deco_global'] }],
        extras: ['corte', 'peinado_liso', 'peinado_express', 'lavado_masaje'],
      },
      'deco-raiz': {
        title: 'Retoque de rubio', lead: 'Decoloración de raíz para igualarla a tu rubio. Incluye matiz.',
        img: 'img/w/color-5.jpg',
        includes: ['Decoloración solo en raíz', 'Protector de puentes', 'Matiz incluido'],
        tiers: [{ id: 'base', items: ['deco_raiz'] }],
        extras: ['corte', 'peinado_liso', 'peinado_express', 'lavado_masaje'],
      },
      raiz: {
        title: 'Cubrir canas · raíz', lead: 'Tinte de raíz: solo el crecimiento nuevo.',
        img: 'img/w/color-5.jpg',
        includes: ['Color en raíz'],
        tiers: [
          { id: 'base', label: 'Tinte de raíz', items: ['tinte_raiz'] },
          { id: 'pig', label: 'Con pigmentos', items: ['tinte_raiz_pig'], desc: 'Color enriquecido: más brillo y matiz' },
        ],
        extras: ['corte', 'peinado_liso', 'peinado_express', 'lavado_masaje'],
      },
      'color-completo': {
        title: 'Color completo', lead: 'Color de raíz a puntas.',
        img: 'img/w/color-5.jpg',
        includes: ['Diagnóstico y elección de tono', 'Color de raíz a puntas'],
        tiers: [{ id: 'base', items: ['color_completo'] }],
        extras: ['corte', 'peinado_liso', 'peinado_express', 'lavado_masaje'],
      },
      refresh: {
        title: 'Reavivar tu color', lead: 'Matiz para devolver intensidad y brillo.',
        img: 'img/w/color-6.jpg',
        includes: ['Matiz', 'Sellado de cutícula'],
        tiers: [
          { id: 'base', label: 'Matiz de mantenimiento', items: ['matiz'] },
          { id: 'elumen', label: 'Matiz Elumen', items: ['matiz_elumen'], desc: 'Sin amoníaco: brillo espejo y más duración' },
        ],
        extras: ['corte', 'peinado_liso', 'peinado_express', 'lavado_masaje'],
      },
      balancing: {
        title: 'Color balancing', lead: 'Equilibrar tonos, corregir reflejos, dar profundidad. Con Elumen.',
        img: 'img/w/color-4.jpg',
        includes: ['Diagnóstico del color', 'Color balancing con Elumen, sin amoníaco'],
        tiers: [{ id: 'base', items: ['balancing'] }],
        extras: ['corte', 'peinado_liso', 'peinado_express', 'lavado_masaje'],
      },

      corte: {
        title: 'Corte', lead: 'Diseño de corte a medida.', img: 'img/w/backstage-1.jpg',
        includes: ['Diagnóstico de forma y textura', 'Corte'],
        tiers: [
          { id: 'base', label: 'Corte', items: ['corte'] },
          { id: 'fleq', label: 'Flequillo', items: ['flequillo'] },
          { id: 'rapado', label: 'Rapado', items: ['rapado'] },
        ],
        extras: ['peinado_liso', 'peinado_express', 'lavado_masaje'],
      },
      cover: {
        title: 'Cover chicos', lead: 'Cobertura de canas.', img: 'img/w/backstage-1.jpg',
        includes: ['Color en raíz'],
        tiers: [{ id: 'base', items: ['cover_chicos'] }], extras: ['corte', 'lavado_masaje'],
      },
      peinado: {
        title: 'Peinado', lead: 'Liso, ondas o recogido, a tu medida.', img: 'img/w/novia-4.jpg',
        includes: ['Peinado'],
        tiers: [
          { id: 'liso', label: 'Liso', items: ['peinado_liso'] },
          { id: 'surf', label: 'Ondas surferas', items: ['ondas_surf'] },
          { id: 'hollywood', label: 'Ondas Hollywood', items: ['ondas_hollywood'] },
          { id: 'recogido', label: 'Recogido', items: ['recogido_salon'], desc: 'De 75 a 80 € según el peinado' },
        ],
        extras: ['lavado_masaje'],
      },
      express: {
        title: 'Peinado express', lead: 'Un acabado rápido.', img: 'img/w/novia-4.jpg',
        includes: ['Peinado express'],
        tiers: [{ id: 'base', items: ['peinado_express'] }], extras: ['lavado_masaje'],
      },
      'glam-salon': {
        title: 'Evento en el studio', lead: 'Maquillaje y peinado para tu evento.', img: 'img/w/novia-1.jpg',
        includes: ['Maquillaje', 'Peinado'],
        tiers: [{ id: 'base', items: ['maq_salon'] }],
      },
      'glam-fuera': {
        title: 'Evento a domicilio', lead: 'Voy yo: a tu casa, hotel o localización.', img: 'img/w/glam-1.jpg',
        includes: ['Desplazamiento a tu ubicación'],
        notes: ['Si sois varias, el peinado de evento es por invitada.'],
        tiers: [
          { id: 'maq', label: 'Maquillaje y peinado', items: ['maq_casa'] },
          { id: 'recogido', label: 'Recogido', items: ['recogido_casa'] },
          { id: 'invitada', label: 'Peinado de evento', items: ['evento_fuera'], desc: 'Por invitada' },
        ],
      },
      novia: {
        title: 'Novias', lead: 'Para el día que importa, con todo el tiempo que haga falta.', img: 'img/w/novia-1.jpg',
        includes: ['Conversación previa', 'Prueba antes de la boda', 'Peluquería el día de la boda'],
        notes: ['Te propongo una prueba unas semanas antes para dejarlo todo decidido.'],
        tiers: [
          { id: 'pelo', label: 'Peluquería', items: ['novia_pelo'] },
          { id: 'maq', label: 'Peluquería y maquillaje', items: ['novia_pelo_maq'] },
        ],
      },
      'trat-cabello': {
        title: 'Tratamiento de cabello', lead: 'Hidratación, nutrición o reconstrucción, a medida.', img: 'img/w/color-2.jpg',
        includes: ['Diagnóstico de la fibra', 'Tratamiento personalizado'],
        tiers: [{ id: 'base', items: ['trat_cabello'] }], extras: ['peinado_liso', 'peinado_express', 'lavado_masaje'],
      },
      'trat-cuero': {
        title: 'Tratamiento de cuero cabelludo', lead: 'Equilibrar el cuero cabelludo, la base de todo.', img: 'img/w/color-2.jpg',
        includes: ['Diagnóstico del cuero cabelludo', 'Tratamiento personalizado'],
        tiers: [{ id: 'base', items: ['trat_cuero'] }], extras: ['peinado_liso', 'peinado_express', 'lavado_masaje'],
      },
      bond: {
        title: 'Tratamiento Bond Pro', lead: 'Reconstrucción de la fibra desde dentro.', img: 'img/w/color-2.jpg',
        includes: ['Diagnóstico de la fibra', 'Tratamiento Bond Pro'],
        tiers: [{ id: 'base', items: ['bond_pro'] }], extras: ['peinado_liso', 'peinado_express', 'lavado_masaje'],
      },
      keratina: {
        title: 'Alisado de keratina', lead: 'Menos encrespamiento, más brillo y un pelo más fácil de peinar.', img: 'img/w/color-2.jpg',
        includes: ['Diagnóstico', 'Alisado de keratina'],
        tiers: [{ id: 'base', items: ['keratina'] }],
      },
      lavado: {
        title: 'Lavado con masaje', lead: 'Un rato para ti.', img: 'img/w/color-2.jpg',
        includes: ['Lavado', 'Masaje capilar'],
        tiers: [{ id: 'base', items: ['lavado_masaje'] }], extras: ['peinado_express'],
      },

      consulta: {
        title: 'Lo vemos juntos',
        lead: 'Tu caso merece una conversación antes que una cifra.',
        consult: true,
        includes: ['Cuéntame qué tienes en mente', 'Mándame una foto con luz natural', 'Te digo qué se puede hacer, en cuánto tiempo y por cuánto'],
      },
    },
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = DATA;
  else root.AP_CITA_DATA = DATA;
})(typeof window !== 'undefined' ? window : globalThis);
