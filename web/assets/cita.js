/* Cuestionario de cita — interfaz */
(function () {
  const D = window.AP_CITA_DATA;
  const C = window.AP_CITA;
  const $ = (s, el = document) => el.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const stage = $('#stage'), bar = $('#bar i'), live = $('#live');
  const FORM_KEY = 'ap-cita-form';

  /* estado del camino (vive en la URL) + datos de contacto (sessionStorage) */
  let st = C.fromHash(location.hash);
  let form = { name: '', days: [], slot: '', notes: '', regular: false };
  try { Object.assign(form, JSON.parse(sessionStorage.getItem(FORM_KEY) || '{}')); } catch (e) {}
  const saveForm = () => { try { sessionStorage.setItem(FORM_KEY, JSON.stringify(form)); } catch (e) {} };

  function go(next, { replace = false } = {}) {
    st = next;
    const h = '#' + C.toHash(st);
    if (replace) history.replaceState(null, '', h); else history.pushState(null, '', h);
    render(true);
  }
  /* cambios en el resultado: sin animación ni salto de scroll */
  function tweak(next) {
    st = next;
    history.replaceState(null, '', '#' + C.toHash(st));
    const y = scrollY; render(false); scrollTo(0, y);
  }
  addEventListener('popstate', () => { st = C.fromHash(location.hash); render(true); });

  /* ── imágenes del panel lateral ─────────────────── */
  const side = $('#sideimgs');
  function setImage(src) {
    if (!side) return;
    let img = [...side.children].find((i) => i.dataset.src === src);
    if (!img) { img = new Image(); img.alt = ''; img.dataset.src = src; img.src = src; side.appendChild(img); }
    [...side.children].forEach((i) => i.classList.toggle('on', i === img));
  }

  /* ── piezas ──────────────────────────────────────── */
  const arrow = '<span class="arr" aria-hidden="true">→</span>';
  const opt = (attrs, label, hint, cls = '', extra = '') =>
    `<li><button class="opt ${cls}" ${attrs}><div><b>${esc(label)}${extra}</b>${hint ? `<span>${esc(hint)}</span>` : ''}</div>${arrow}</button></li>`;

  function silhouette(drop) {
    const y = Math.round(18 + drop * 56);
    return `<svg viewBox="0 0 44 80" aria-hidden="true" fill="none" stroke="#211C1A" stroke-width="1">
      <path d="M11 ${y} C9 ${y - 20} 8 26 9 20 C10 7 34 7 35 20 C36 26 35 ${y - 20} 33 ${y} Z" fill="#DBCBB8" stroke="none" opacity=".85"/>
      <circle cx="22" cy="22" r="9" fill="#FAF7F2"/>
      <path d="M4 79 C4 56 14 52 22 52 C30 52 40 56 40 79"/>
    </svg>`;
  }

  function crumbs(w) {
    if (!w.steps.length) return '';
    return `<nav class="crumbs" aria-label="Tus respuestas">` +
      `<button data-jump="-1" title="Cambiar servicio">${esc(w.service.label)}</button>` +
      w.steps.map((s, i) => `<button data-jump="${i}" title="Cambiar esta respuesta">${esc(s.option.tag)}</button>`).join('') +
      `</nav>`;
  }

  /* ── pantallas ───────────────────────────────────── */
  function screenIntro() {
    setImage('img/w/femme-1.jpg');
    return `
      <div class="eyebrow">Pide tu cita</div>
      <h1 class="q" tabindex="-1">Cuéntame qué buscas.</h1>
      <p class="lead">Unas pocas preguntas y te digo cuánto tiempo reservar y qué presupuesto calcular. Sin registros: al final me escribes por WhatsApp con todo ya contado.</p>
      <ul class="opts">${D.services.map((s) =>
        opt(`data-service="${s.id}"`, s.label, s.active ? s.hint : 'Aún sin cuestionario · escríbeme directamente', s.active ? '' : 'soon',
          s.active ? '' : '<span class="soon-tag">Pronto</span>')).join('')}
      </ul>`;
  }

  function screenQuestion(w) {
    const node = D.nodes[w.nodeId];
    setImage(node.img || 'img/w/backstage-2.jpg');
    const prev = C.fromHash(location.hash).choices[w.steps.length];
    return `
      ${crumbs(w)}
      <div class="eyebrow">${esc(w.service.label)} · Paso ${w.steps.length + 1}</div>
      <h1 class="q" tabindex="-1">${esc(node.q)}</h1>
      ${node.help ? `<p class="help">${esc(node.help)}</p>` : ''}
      <ul class="opts">${node.options.map((o, i) =>
        opt(`data-choice="${i}"`, o.label, o.hint, [o.quiet ? 'quiet' : '', prev === i ? 'was' : ''].join(' '))).join('')}
      </ul>
      <button class="back" data-back>← Atrás</button>`;
  }

  function screenLength(w) {
    setImage(D.results[w.resultId].img || 'img/w/backstage-2.jpg');
    return `
      ${crumbs(w)}
      <div class="eyebrow">${esc(w.service.label)} · Último paso</div>
      <h1 class="q" tabindex="-1">¿Qué largo tienes?</h1>
      <p class="help">El tiempo y el producto dependen mucho del largo. ${esc(D.lengthNote || '')}</p>
      <ul class="opts">${D.lengths.map((l) =>
        `<li><button class="opt len ${st.length === l.id ? 'was' : ''}" data-length="${l.id}">${silhouette(l.drop)}<div><b>${esc(l.label)}</b><span>${esc(l.hint)}</span></div>${arrow}</button></li>`).join('')}
      </ul>
      <button class="back" data-back>← Atrás</button>`;
  }

  function tierPicker(w, est) {
    const tiers = C.tiersOf(D, w.resultId);
    if (tiers.length < 2) return '';
    return `<div class="tiers" role="radiogroup" aria-label="Elige la opción">
      ${tiers.map((t) => {
        const e = C.estimate(D, w.resultId, st.length, t.id, []);
        const on = est.tier.id === t.id;
        return `<button class="tier ${on ? 'on' : ''}" role="radio" aria-checked="${on}" data-tier="${t.id}">
          <span class="tier-l">${esc(t.label)}</span>
          <span class="tier-p">${e.from ? 'desde ' : ''}${e.eur} €</span>
          <span class="tier-d">${esc(t.desc || (D.tiers[t.id] || {}).hint || '')}</span>
        </button>`;
      }).join('')}
    </div>`;
  }

  function extrasPicker(w, est) {
    const ids = C.extrasOf(D, w.resultId, est.tier.id);
    if (!ids.length) return '';
    return `<div class="extras">
      <div class="lab">Añadir al servicio <span class="opt-hint">el tiempo de color no incluye corte ni peinado</span></div>
      <div class="xchips">${ids.map((id) => {
        const it = D.menu[id], on = est.extras.includes(id);
        const h = C.fmtHoursShort((() => { const e1 = C.estimate(D, w.resultId, st.length, est.tier.id, [id]); return [e1.h[0] - C.estimate(D, w.resultId, st.length, est.tier.id, []).h[0], e1.h[1] - C.estimate(D, w.resultId, st.length, est.tier.id, []).h[1]]; })());
        const eur = C.estimate(D, w.resultId, st.length, est.tier.id, [id]).eur - C.estimate(D, w.resultId, st.length, est.tier.id, []).eur;
        return `<button class="xchip" data-extra="${id}" aria-pressed="${on}"><b>${on ? '✓ ' : '+ '}${esc(it.label)}</b><span>${h} · ${eur} €</span></button>`;
      }).join('')}</div>
    </div>`;
  }

  function splitPicker(est) {
    if (!C.canSplit(D, est)) return '';
    return `<div class="extras">
      <div class="lab">¿Una sesión o dos? <span class="opt-hint">es un servicio largo: tú eliges</span></div>
      <div class="xchips">${D.split.options.map((o) =>
        `<button class="xchip" data-split="${o.id}" aria-pressed="${st.split === o.id}"><b>${st.split === o.id ? '✓ ' : ''}${esc(o.label)}</b><span>${esc(o.hint)}</span></button>`).join('')}</div>
    </div>`;
  }

  function screenResult(w) {
    const r = D.results[w.resultId];
    setImage(r.img || 'img/w/color-1.jpg');
    const est = C.estimate(D, w.resultId, st.length, st.tier, st.extras);
    const len = D.lengths.find((l) => l.id === st.length);
    const notes = [...(r.notes || []), ...C.fitNotes(D, est)];
    const soon = !w.service.active;
    const days = D.schedule.days.map((d) => {
      const warn = d.id === 'sab' && est && est.h[1] > D.schedule.saturdayMaxHours;
      return `<button type="button" class="chip ${warn ? 'warn' : ''}" data-day="${d.id}" aria-pressed="${form.days.includes(d.id)}"${warn ? ' title="Los sábados cierro a las 13:30"' : ''}>${d.label}</button>`;
    }).join('');
    const slots = D.schedule.slots.map((s) =>
      `<button type="button" class="chip" data-slot="${s.id}" aria-pressed="${form.slot === s.id}">${s.label}</button>`).join('');

    return `
      ${crumbs(w)}
      <div class="eyebrow">${soon ? esc(w.service.label) : 'Tu estimación'}</div>
      <h1 class="q" tabindex="-1">${esc(soon ? 'Hablemos directamente.' : r.title)}</h1>
      <p class="lead">${esc(soon ? `El cuestionario de ${w.service.label.toLowerCase()} está en camino. Mientras tanto, cuéntamelo por WhatsApp y te respondo yo.` : r.lead)}</p>
      ${est ? `
        <div class="figs">
          <div class="fig"><small>Tiempo en el studio</small><strong>${C.fmtTime(est)}</strong></div>
          <div class="fig"><small>${est.from ? 'Precio desde' : 'Precio'}</small><strong>${C.fmtEur(est.eur)}</strong></div>
        </div>
        <p class="forlen">Para pelo <b>${esc(len.label.toLowerCase())}</b> · <button data-relength>cambiar largo</button></p>
        ${C.needsAllergy(D, w.resultId, w.steps) ? `
        <div class="allergy" role="note">
          <div class="allergy-h"><span class="allergy-i" aria-hidden="true">!</span>${esc(D.allergyTest.label)}</div>
          <p>${esc(D.allergyTest.text)}</p>
        </div>` : ''}
        ${C.diagOf(w.steps).length ? `
        <div class="allergy diag" role="note">
          <div class="allergy-h"><span class="allergy-i" aria-hidden="true">i</span>Para el diagnóstico</div>
          <p>${esc(D.diagnosisNote)}</p>
        </div>` : ''}
        ${tierPicker(w, est)}
        ${extrasPicker(w, est)}
        ${splitPicker(est)}
        ${C.depositApplies(D, est) ? `<p class="disc">${esc(D.deposit.text)}</p>` : ''}` : ''}
      ${r.includes && !soon ? `<ul class="inc">${r.includes.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>` : ''}
      ${notes.length ? `<ul class="notes">${notes.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>` : ''}
      ${est && D.loyalty ? `<p class="disc"><b>${esc(D.loyalty.result)}</b></p>` : ''}
      ${est ? `<p class="disc">Es una estimación por tramo de largo. El largo y el tipo de pelo los valoro en persona y ahí te confirmo el precio final — si algo cambia, te lo digo antes de empezar.</p>` : ''}
      ${est && D.provisional ? `<span class="prov">Versión de prueba · tramos por largo pendientes de validar</span>` : ''}

      <form class="book" id="book" novalidate>
        <h2>Pide tu cita</h2>
        <p>Se abrirá WhatsApp con todo esto ya escrito. Después te enseño cómo mandarme una foto de tu pelo.</p>
        <div class="fld">
          <label for="f-name">Tu nombre</label>
          <input id="f-name" name="name" autocomplete="given-name" placeholder="Cómo te llamas" value="${esc(form.name)}" required>
          <div class="err" id="f-err" aria-live="polite"></div>
        </div>
        <div class="fld" role="group" aria-labelledby="l-days">
          <span class="lab" id="l-days">Días que te vienen bien <span class="opt-hint">opcional</span></span>
          <div class="chips">${days}</div>
        </div>
        ${D.loyalty ? `<div class="fld"><div class="chips"><button type="button" class="chip" data-regular aria-pressed="${!!form.regular}">${form.regular ? '✓ ' : ''}${esc(D.loyalty.chip)}</button></div></div>` : ''}
        <div class="fld" role="group" aria-labelledby="l-slot">
          <span class="lab" id="l-slot">Franja <span class="opt-hint">opcional</span></span>
          <div class="chips">${slots}</div>
        </div>
        <div class="fld">
          <label for="f-notes">Algo más <span class="opt-hint">opcional</span></label>
          <textarea id="f-notes" name="notes" placeholder="Una fecha límite (boda, evento), alergias, cómo tienes el pelo ahora…">${esc(form.notes)}</textarea>
        </div>
        <a class="send" id="send" href="#" target="_blank" rel="noopener">
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.5 14.4c-.3-.2-1.7-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.7 1-.9 1.2-.2.2-.3.2-.6.1-.3-.2-1.2-.5-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6l.5-.5c.1-.2.2-.3.3-.5 0-.2 0-.4-.1-.5l-.9-2.1c-.2-.5-.4-.5-.6-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4s1.1 2.8 1.2 3c.2.2 2.1 3.2 5.1 4.4 1.9.8 2.6.9 3.5.7.6-.1 1.7-.7 1.9-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3z"/><path d="M12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.4 1.3 4.9L2 22l5.3-1.4c1.4.8 3 1.2 4.7 1.2 5.5 0 10-4.5 10-10S17.5 2 12 2zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3.1.8.8-3-.2-.3c-.8-1.3-1.3-2.9-1.3-4.5C3.6 7.4 7.4 3.6 12 3.6S20.4 7.4 20.4 12 16.6 20.2 12 20.2z"/></svg>
          Enviar por WhatsApp
        </a>
        <details class="preview"><summary>Ver el mensaje</summary><pre id="msg"></pre></details>
      </form>

      <button class="back restart" data-restart>↺ Empezar de nuevo</button>`;
  }


  /* ── después de enviar: la foto ───────────────────── */
  const ATTACH = {
    ios: {
      how: 'Toca el <b>+</b> a la izquierda del mensaje → <b>Fotos</b>, o <b>Cámara</b> para hacerla ahora.',
      svg: `<svg viewBox="0 0 320 64" aria-hidden="true"><rect x="0" y="0" width="320" height="64" fill="#F1EAE0"/>
        <circle cx="30" cy="32" r="19" fill="none" stroke="#8AA194" stroke-width="2.5"><animate attributeName="r" values="17;21;17" dur="1.8s" repeatCount="indefinite"/></circle>
        <path d="M30 23v18M21 32h18" stroke="#211C1A" stroke-width="2" stroke-linecap="round"/>
        <rect x="58" y="16" width="190" height="32" rx="16" fill="#fff" stroke="rgba(33,28,26,.15)"/>
        <rect x="264" y="22" width="22" height="18" rx="4" fill="none" stroke="#7C7168" stroke-width="1.6"/><circle cx="275" cy="31" r="4.5" fill="none" stroke="#7C7168" stroke-width="1.6"/>
        <path d="M303 22v10a4 4 0 0 0 8 0V22a4 4 0 0 0-8 0z" fill="none" stroke="#7C7168" stroke-width="1.6"/></svg>`,
    },
    android: {
      how: 'Toca el <b>clip 📎</b> dentro de la caja del mensaje → <b>Galería</b>, o la <b>cámara</b> para hacerla ahora.',
      svg: `<svg viewBox="0 0 320 64" aria-hidden="true"><rect x="0" y="0" width="320" height="64" fill="#F1EAE0"/>
        <rect x="10" y="12" width="246" height="40" rx="20" fill="#fff" stroke="rgba(33,28,26,.15)"/>
        <circle cx="32" cy="32" r="8" fill="none" stroke="#7C7168" stroke-width="1.6"/>
        <circle cx="196" cy="32" r="19" fill="none" stroke="#8AA194" stroke-width="2.5"><animate attributeName="r" values="17;21;17" dur="1.8s" repeatCount="indefinite"/></circle>
        <path d="M200 26l-9 9a3.5 3.5 0 0 0 5 5l10-10a6 6 0 0 0-8.5-8.5l-10 10a8.5 8.5 0 0 0 12 12l8-8" fill="none" stroke="#211C1A" stroke-width="1.8" stroke-linecap="round" transform="translate(-4 -4)"/>
        <rect x="222" y="24" width="20" height="16" rx="3.5" fill="none" stroke="#7C7168" stroke-width="1.6"/><circle cx="232" cy="32" r="4" fill="none" stroke="#7C7168" stroke-width="1.6"/>
        <circle cx="290" cy="32" r="20" fill="#8AA194"/><path d="M286 24v9a4 4 0 0 0 8 0v-9a4 4 0 0 0-8 0z" fill="none" stroke="#fff" stroke-width="1.6"/></svg>`,
    },
    desktop: {
      how: 'En WhatsApp Web o de escritorio, toca el <b>+</b> junto al mensaje → <b>Fotos y vídeos</b>. Si la foto está en tu móvil, mándala desde allí.',
      svg: `<svg viewBox="0 0 320 64" aria-hidden="true"><rect x="0" y="0" width="320" height="64" fill="#F1EAE0"/>
        <circle cx="30" cy="32" r="19" fill="none" stroke="#8AA194" stroke-width="2.5"><animate attributeName="r" values="17;21;17" dur="1.8s" repeatCount="indefinite"/></circle>
        <path d="M30 23v18M21 32h18" stroke="#211C1A" stroke-width="2" stroke-linecap="round"/>
        <circle cx="68" cy="32" r="8" fill="none" stroke="#7C7168" stroke-width="1.6"/>
        <rect x="88" y="16" width="190" height="32" rx="8" fill="#fff" stroke="rgba(33,28,26,.15)"/>
        <path d="M296 22v10a4 4 0 0 0 8 0V22a4 4 0 0 0-8 0z" fill="none" stroke="#7C7168" stroke-width="1.6"/></svg>`,
    },
  };

  function screenPhoto(w) {
    setImage('img/w/backstage-1.jpg');
    const a = ATTACH[C.platform(navigator.userAgent)];
    const text = C.buildMessage(D, { ...st, ...form });
    return `
      <div class="eyebrow">Último detalle</div>
      <h1 class="q" tabindex="-1">Ahora, la foto.</h1>
      <p class="lead">Tu mensaje ya está escrito en WhatsApp. Envíalo, y justo después mándame una foto de tu pelo: es lo que más me ayuda a darte un precio justo.</p>
      <ol class="how">
        <li><span class="n">1</span><div><b>Envía el mensaje</b> que se ha abierto en WhatsApp.</div></li>
        <li><span class="n">2</span><div><b>Adjunta la foto.</b> ${a.how}<figure class="attach">${a.svg}</figure></div></li>
        <li><span class="n">3</span><div><b>Mándala</b> en el mismo chat. Si quieres, añade otra de cómo te gustaría quedar.</div></li>
      </ol>
      <div class="photo-tips">
        <div class="lab">Para que la foto me sirva</div>
        <ul>
          <li>Luz natural, cerca de una ventana. Sin flash ni filtros.</li>
          <li>Pelo suelto y seco, sin recoger.</li>
          <li>Una de espaldas y otra de lado, si puedes.</li>
        </ul>
      </div>
      <div class="after-actions">
        <button class="btn-dark" data-after="ok">Ya la he enviado</button>
        <a class="btn-line" href="${esc(C.waLink(D, text))}" target="_blank" rel="noopener">Volver a abrir WhatsApp</a>
      </div>
      <button class="back" data-after="">← Volver a mi estimación</button>`;
  }

  function screenThanks() {
    setImage('img/w/adrian.jpg');
    const name = form.name.trim().split(/\s+/)[0];
    return `
      <div class="eyebrow">Hecho</div>
      <h1 class="q" tabindex="-1">Gracias${name ? `, ${esc(name)}` : ''}.</h1>
      <p class="lead">Te contesto yo en cuanto salga de la silla, con los huecos que tengo y lo que veo en tu foto.</p>
      <div class="after-actions">
        <a class="btn-dark" href="index.html#colecciones">Ver mi trabajo</a>
        <a class="btn-line" href="index.html">Volver a la web</a>
      </div>
      <button class="back" data-restart>↺ Hacer otra consulta</button>`;
  }

  /* ── render ──────────────────────────────────────── */
  function progress(w) {
    if (!w.service) return 0;
    if (w.resultId && (!C.needsLength(D, w.resultId) || D.lengths.some((l) => l.id === st.length))) return 1;
    const done = 1 + w.steps.length;
    const left = w.nodeId ? C.remaining(D, w.nodeId) : 1;
    return done / (done + left);
  }

  function render(animate) {
    const w = C.walk(D, st.service, st.choices);
    let html, title;
    if (!w.service) { html = screenIntro(); title = 'Pide tu cita'; }
    else if (w.nodeId) { html = screenQuestion(w); title = D.nodes[w.nodeId].q; }
    else if (C.needsLength(D, w.resultId) && !D.lengths.some((l) => l.id === st.length)) { html = screenLength(w); title = '¿Qué largo tienes?'; }
    else if (st.after === 'foto' && form.name.trim()) { html = screenPhoto(w); title = 'Ahora, la foto'; }
    else if (st.after === 'ok') { html = screenThanks(); title = 'Gracias'; }
    else { html = screenResult(w); title = 'Tu estimación'; }

    stage.innerHTML = `<div class="screen${animate ? ' enter' : ''}">${html}</div>`;
    bar.style.width = `${Math.round(progress(w) * 100)}%`;
    document.title = `${title} · Adrián Pardo`;
    live.textContent = title;
    if (animate) { const h = $('h1', stage); h && h.focus({ preventScroll: true }); scrollTo({ top: 0, behavior: 'smooth' }); }
    if ($('#book')) syncMessage();
  }

  function syncMessage() {
    const text = C.buildMessage(D, { ...st, ...form });
    $('#msg').textContent = text;
    const a = $('#send');
    a.href = C.waLink(D, text);
    a.setAttribute('aria-disabled', form.name.trim() ? 'false' : 'true');
  }

  /* ── eventos ─────────────────────────────────────── */
  stage.addEventListener('click', (e) => {
    const t = e.target.closest('button, a');
    if (!t) return;
    const d = t.dataset;
    if (d.service) return go({ service: d.service, choices: [], length: null, tier: null, extras: [], split: null, after: null });
    if (d.choice) {
      const choices = [...st.choices.slice(0, C.walk(D, st.service, st.choices).steps.length), Number(d.choice)];
      return go({ ...st, choices, tier: null, extras: [], split: null, after: null });
    }
    if (d.length) return go({ ...st, length: d.length, after: null });
    if (d.tier) return tweak({ ...st, tier: d.tier });
    if (d.split) return tweak({ ...st, split: st.split === d.split ? null : d.split });
    if (d.extra) {
      const x = st.extras || [];
      return tweak({ ...st, extras: x.includes(d.extra) ? x.filter((i) => i !== d.extra) : [...x, d.extra] });
    }
    if ('back' in d) return history.back();
    if ('relength' in d) return go({ ...st, length: null });
    if ('restart' in d) return go({ service: null, choices: [], length: null, after: null });
    if (d.jump) {
      const n = Number(d.jump);
      return go(n < 0 ? { service: null, choices: [], length: null } : { ...st, choices: st.choices.slice(0, n), length: null });
    }
    if (d.day) {
      form.days = form.days.includes(d.day) ? form.days.filter((x) => x !== d.day) : [...form.days, d.day];
      t.setAttribute('aria-pressed', form.days.includes(d.day)); saveForm(); return syncMessage();
    }
    if ('regular' in d) {
      form.regular = !form.regular; saveForm();
      t.setAttribute('aria-pressed', form.regular); t.textContent = (form.regular ? '✓ ' : '') + D.loyalty.chip;
      return syncMessage();
    }
    if (d.slot) {
      form.slot = form.slot === d.slot ? '' : d.slot;
      t.parentElement.querySelectorAll('[data-slot]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.slot === form.slot));
      saveForm(); return syncMessage();
    }
    if (t.id === 'send') {
      if (!form.name.trim()) {
        e.preventDefault(); $('#f-err').textContent = 'Dime tu nombre para que Adrián sepa quién eres.'; $('#f-name').focus(); return;
      }
      // el enlace abre WhatsApp en otra pestaña/app; aquí pasamos al paso de la foto
      return setTimeout(() => go({ ...st, after: 'foto' }), 60);
    }
    if ('after' in d) return go({ ...st, after: d.after || null });
  });
  stage.addEventListener('input', (e) => {
    if (e.target.name === 'name') { form.name = e.target.value; if (form.name.trim()) $('#f-err').textContent = ''; }
    if (e.target.name === 'notes') form.notes = e.target.value;
    saveForm(); syncMessage();
  });
  stage.addEventListener('submit', (e) => e.preventDefault());

  history.replaceState(null, '', location.hash || '#');
  render(false);
})();
