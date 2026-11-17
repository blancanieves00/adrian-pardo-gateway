/*
 * Cuestionario de cita — lógica pura (sin DOM)
 * Se usa en el navegador (cita.js, cita-mapa.html) y en los tests de Node.
 */
(function (root) {
  const isResult = (next) => typeof next === 'string' && next.startsWith('r:');
  const resultId = (next) => next.slice(2);

  /** Recorre las respuestas y devuelve dónde estamos. */
  function walk(data, serviceId, choices) {
    const service = data.services.find((s) => s.id === serviceId);
    if (!service) return { service: null, steps: [], nodeId: null, resultId: null };
    if (!service.active) return { service, steps: [], nodeId: null, resultId: 'consulta' };

    const steps = [];
    let nodeId = service.start;
    for (let k = 0; k < choices.length; k++) {
      const idx = choices[k];
      const node = data.nodes[nodeId];
      const option = node && node.options[idx];
      if (!option) break;
      steps.push({ nodeId, index: idx, option });
      if (isResult(option.next)) {
        const rid = resultId(option.next);
        // ¿hay que preguntar por el último color en la raíz?
        if (asksRoot(data, rid, steps)) {
          const a = data.nodes.raiz.options[choices[k + 1]];
          if (!a) return { service, steps, nodeId: 'raiz', resultId: null, pending: rid };
          steps.push({ nodeId: 'raiz', index: choices[k + 1], option: a });
        }
        return { service, steps, nodeId: null, resultId: rid };
      }
      nodeId = option.next;
    }
    return { service, steps, nodeId, resultId: null };
  }

  /* ── Prueba de alergia ─────────────────────────────── */
  /** ¿El resultado incluye algo que toca la raíz (y la piel)? */
  function touchesScalp(data, rid) {
    const r = data.results[rid];
    return !!(r && r.tiers && r.tiers.some((t) => t.items.some((id) => data.menu[id] && data.menu[id].scalp)));
  }
  /** Lo que sabemos del último color en raíz: true (< 3 meses), false (> 3 meses o nunca), undefined. */
  function rootRecent(steps) {
    let v;
    for (const s of steps) if (typeof s.option.rootRecent === 'boolean') v = s.option.rootRecent;
    return v;
  }
  const asksRoot = (data, rid, steps) => !!data.nodes.raiz && touchesScalp(data, rid) && rootRecent(steps) === undefined;
  /** ¿Necesita prueba de alergia? */
  function needsAllergy(data, rid, steps) {
    return !!data.allergyTest && touchesScalp(data, rid) && rootRecent(steps) === false;
  }

  /** ¿El resultado necesita saber el largo? (todo lo que tiene precio) */
  const needsLength = (data, rid) => !!(data.results[rid] && data.results[rid].tiers);

  /** Máximo de preguntas que quedan desde un nodo (incluido el largo). */
  function remaining(data, nodeId, seen = new Set()) {
    if (!nodeId || seen.has(nodeId)) return 0;
    seen.add(nodeId);
    const node = data.nodes[nodeId];
    let best = 0;
    for (const o of node.options) {
      if (!o.next) continue;
      const after = isResult(o.next)
        ? (needsLength(data, resultId(o.next)) ? 1 : 0) + (touchesScalp(data, resultId(o.next)) ? 1 : 0)
        : remaining(data, o.next, new Set(seen));
      best = Math.max(best, after);
    }
    return 1 + best;
  }

  /* ── Carta → estimación ───────────────────────────────── */
  function itemHours(item, lengthId) {
    let h = item.h ?? 0;
    if (h === 'var') return [0, 0];
    if (h && typeof h === 'object' && !Array.isArray(h)) h = h[lengthId] ?? h.medio;
    return Array.isArray(h) ? h : [h, h];
  }
  /** Precio por tramo de largo: número fijo o { corto, medio, largo, extra }. */
  function itemEur(data, item, lengthId) {
    const e = item.eur;
    return typeof e === 'object' ? (e[lengthId] ?? e.corto) : e;
  }

  /** Opciones (Estándar / Premium / …) de un resultado, con su etiqueta. */
  function tiersOf(data, rid) {
    const r = data.results[rid];
    if (!r || !r.tiers) return [];
    return r.tiers.map((t) => ({ ...t, label: t.label || (data.tiers[t.id] || {}).label || t.id, desc: t.desc || '' }));
  }
  /** Extras válidos para un resultado (sin repetir lo que ya va incluido). */
  function extrasOf(data, rid, tierId) {
    const r = data.results[rid];
    if (!r || !r.extras) return [];
    const t = tiersOf(data, rid).find((x) => x.id === tierId) || tiersOf(data, rid)[0];
    return r.extras.filter((id) => data.menu[id] && !(t && t.items.includes(id)));
  }

  /**
   * Estimación completa.
   * st: { service, choices, length, tier, extras[] }
   * → { tier, items[], extras[], h:[a,b], eur, min, pending }
   */
  function estimate(data, rid, lengthId, tierId, extras = []) {
    const r = data.results[rid];
    if (!r || !r.tiers || !lengthId) return null;
    const tiers = tiersOf(data, rid);
    const tier = tiers.find((t) => t.id === tierId) || tiers[0];
    const valid = extrasOf(data, rid, tier.id);
    const ex = (extras || []).filter((x) => valid.includes(x));
    const base = tier.items.map((id) => data.menu[id]);
    const add = ex.map((id) => data.menu[id]);
    let h = r.h ? [...r.h] : base.reduce((a, it) => { const x = itemHours(it, lengthId); return [a[0] + x[0], a[1] + x[1]]; }, [0, 0]);
    for (const it of add) { const x = itemHours(it, lengthId); h = [h[0] + x[0], h[1] + x[1]]; }
    const all = [...base, ...add];
    const eur = all.reduce((a, it) => a + itemEur(data, it, lengthId), 0);
    return {
      tier, items: tier.items, extras: ex, h, eur,
      min: base.some((it) => it.min),
      pending: [...new Set(all.map((it) => it.pending).filter(Boolean))].join(' y '),
      from: all.some((it) => it.from),
      variable: base.some((it) => it.h === 'var'),
    };
  }

  /** "3–4 h" · "1 h 15 – 1 h 30" */
  function fmtHoursShort([a, b]) {
    const whole = Number.isInteger(a) && Number.isInteger(b);
    if (whole) return a === b ? `${a} h` : `${a}–${b} h`;
    const f = (h) => {
      const hh = Math.floor(h), mm = Math.round((h - hh) * 60);
      if (!hh) return `${mm} min`;
      return mm ? `${hh} h ${String(mm).padStart(2, '0')}` : `${hh} h`;
    };
    if (a < 1 && b < 1) return a === b ? f(a) : `${Math.round(a * 60)}–${Math.round(b * 60)} min`;
    return a === b ? f(a) : `${f(a)} – ${f(b)}`;
  }
  const fmtEur = (v) => (Array.isArray(v) ? (v[0] === v[1] ? `${v[0]} €` : `${v[0]}–${v[1]} €`) : `${v} €`);
  /** Tiempo con «mín.» cuando corresponde. */
  const fmtTime = (est) => (est.variable ? 'Variable' : est.min ? `${fmtHoursShort([est.h[0], est.h[0]])} mín.` : fmtHoursShort(est.h));
  /** Precio de carta: «29 €», «desde 365 €», «30–45 €». */
  const menuPrice = (data, id) => {
    const it = data.menu[id], e = it.eur;
    if (typeof e === 'object') { const v = Object.values(e); return `${Math.min(...v)}–${Math.max(...v)} €`; }
    return `${it.from ? 'desde ' : ''}${e} €`;
  };
  const menuTime = (data, id) => {
    const it = data.menu[id];
    if (it.h && typeof it.h === 'object' && !Array.isArray(it.h)) {
      const v = Object.values(it.h); return fmtHoursShort([Math.min(...v), Math.max(...v)]);
    }
    if (it.h == null) return '';
    if (it.h === 'var') return 'Variable';
    const x = itemHours(it); return it.min ? `${fmtHoursShort([x[0], x[0]])} mín.` : fmtHoursShort(x);
  };

  /** Avisos automáticos según duración. */
  function fitNotes(data, est) {
    if (est && est.min && est.h[1] >= 6) return [
      'Los sábados solo abro de 10:00 a 13:30, así que este servicio encaja mejor de martes a viernes.',
      'Es un día de estudio: ven sin prisa, con algo de comer, y con la tarde libre.'];
    if (!est) return [];
    const out = [];
    const max = est.h[1];
    if (max > data.schedule.saturdayMaxHours) out.push('Los sábados solo abro de 10:00 a 13:30, así que este servicio encaja mejor de martes a viernes.');
    if (max >= 6) out.push('Es un día de estudio: ven sin prisa, con algo de comer, y con la tarde libre.');
    return out;
  }

  /** ¿Se ofrece partirlo en dos sesiones? */
  const canSplit = (data, est) => !!(data.split && est && est.h[0] >= data.split.minHours);
  /** Avisos de diagnóstico (henna, tinte de supermercado…) */
  const diagOf = (steps) => steps.map((s) => s.option.diag).filter(Boolean);
  /** ¿Aplica señal/depósito? (desactivado por defecto) */
  const depositApplies = (data, est) => !!(data.deposit && data.deposit.enabled && est && est.h[0] >= data.deposit.minHours);

  function labelOf(list, id) {
    const x = list.find((i) => i.id === id);
    return x ? x.label : '';
  }

  /** Mensaje de WhatsApp con todo lo que Adrián necesita. */
  function buildMessage(data, st) {
    const w = walk(data, st.service, st.choices);
    const r = data.results[w.resultId] || {};
    const est = estimate(data, w.resultId, st.length, st.tier, st.extras);
    const len = data.lengths.find((l) => l.id === st.length);
    const days = (st.days || [])
      .map((d) => (data.schedule.days.find((x) => x.id === d) || {}).long)
      .filter(Boolean);
    const L = [];
    L.push(`Hola Adrián, soy ${st.name ? st.name.trim() : '—'}. Vengo del cuestionario de tu web y me gustaría pedir cita.`);
    L.push('');
    L.push(`*Servicio:* ${w.service ? w.service.label : ''}${r.consult ? '' : ` · ${r.title || ''}`}`);
    const tags = w.steps.map((s) => s.option.tag).filter(Boolean);
    if (tags.length) L.push(`*Mis respuestas:* ${tags.join(' → ')}`);
    if (len) L.push(`*Largo:* ${len.label} (${len.hint.toLowerCase()})`);
    if (est && tiersOf(data, w.resultId).length > 1) L.push(`*Opción:* ${est.tier.label}`);
    if (est && est.extras.length) L.push(`*Añadir:* ${est.extras.map((id) => data.menu[id].label.toLowerCase()).join(', ')}`);
    if (est) L.push(`*Estimación de la web:* ${fmtTime(est)} · ${est.from ? 'desde ' : ''}${fmtEur(est.eur)}${st.regular && data.loyalty ? ' (precio de nueva clienta)' : ''}`);
    if (est && canSplit(data, est) && st.split) L.push(`*Sesiones:* ${labelOf(data.split.options, st.split).toLowerCase()}`);
    if (needsAllergy(data, w.resultId, w.steps)) L.push(`*⚠️ Prueba de alergia:* sí — reservar al menos 48 h antes (último color en raíz hace más de 3 meses o nunca)`);
    const dg = diagOf(w.steps);
    if (dg.length) L.push(`*⚠️ Para el diagnóstico:* ${dg.join(', ')}`);
    if (depositApplies(data, est)) L.push(`*Señal:* aplica a este servicio`);
    if (days.length || st.slot) {
      const slot = st.slot ? labelOf(data.schedule.slots, st.slot).toLowerCase() : '';
      L.push(`*Disponibilidad:* ${days.length ? days.join(', ') : 'cualquier día'}${slot ? ` · ${slot}` : ''}`);
    }
    if (st.regular && data.loyalty) L.push(data.loyalty.msg);
    if (st.notes && st.notes.trim()) L.push(`*Notas:* ${st.notes.trim()}`);
    L.push('');
    L.push('Te mando una foto de mi pelo con luz natural. ¿Qué huecos tienes?');
    L.push(`— ref. cuestionario v${data.version}`);
    return L.join('\n');
  }

  const waLink = (data, text) => `https://wa.me/${data.whatsapp}?text=${encodeURIComponent(text)}`;

  /** Estado ↔ hash de URL, para poder compartir y recargar un camino. */
  function toHash(st) {
    const p = new URLSearchParams();
    if (st.service) p.set('s', st.service);
    if (st.choices && st.choices.length) p.set('p', st.choices.join('.'));
    if (st.length) p.set('l', st.length);
    if (st.tier) p.set('t', st.tier);
    if (st.extras && st.extras.length) p.set('x', st.extras.join('.'));
    if (st.split) p.set('d', st.split);
    if (st.after) p.set('a', st.after);
    return p.toString();
  }
  function fromHash(hash) {
    const p = new URLSearchParams((hash || '').replace(/^#/, ''));
    const choices = (p.get('p') || '').split('.').filter((x) => x !== '').map(Number).filter((n) => Number.isInteger(n) && n >= 0);
    const after = ['foto', 'ok'].includes(p.get('a')) ? p.get('a') : null;
    const tier = /^[a-z]{2,12}$/.test(p.get('t') || '') ? p.get('t') : null;
    const extras = (p.get('x') || '').split('.').filter((x) => /^[a-z_]{2,24}$/.test(x));
    const split = ['una', 'dos'].includes(p.get('d')) ? p.get('d') : null;
    return { service: p.get('s') || null, choices, length: p.get('l') || null, tier, extras, split, after };
  }

  /** Todos los caminos posibles del flujo (para el mapa y los tests). */
  function enumerate(data) {
    const out = [];
    for (const s of data.services) {
      if (!s.active) { out.push({ service: s.id, choices: [], resultId: 'consulta', tags: [] }); continue; }
      const go = (nodeId, choices, tags, rr, seen) => {
        if (seen.has(nodeId)) throw new Error(`Ciclo en el flujo: ${nodeId}`);
        const node = data.nodes[nodeId];
        if (!node) throw new Error(`Nodo inexistente: ${nodeId}`);
        node.options.forEach((o, i) => {
          const c = [...choices, i], t = [...tags, o.tag];
          const known = typeof o.rootRecent === 'boolean' ? o.rootRecent : rr;
          if (isResult(o.next)) {
            const rid = resultId(o.next);
            if (data.nodes.raiz && touchesScalp(data, rid) && known === undefined) {
              data.nodes.raiz.options.forEach((a, j) => out.push({ service: s.id, choices: [...c, j], resultId: rid, tags: [...t, a.tag], allergy: a.rootRecent === false }));
            } else out.push({ service: s.id, choices: c, resultId: rid, tags: t, allergy: touchesScalp(data, rid) && known === false });
          } else go(o.next, c, t, known, new Set([...seen, nodeId]));
        });
      };
      go(s.start, [], [], undefined, new Set());
    }
    return out;
  }

  /** Plataforma para enseñar el botón de adjuntar correcto. */
  function platform(ua) {
    if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
    if (/Android/i.test(ua)) return 'android';
    return 'desktop';
  }

  const API = { walk, touchesScalp, needsAllergy, canSplit, diagOf, depositApplies, needsLength, remaining, estimate, tiersOf, extrasOf, fmtHoursShort, fmtEur, fmtTime, menuPrice, menuTime, fitNotes, buildMessage, waLink, toHash, fromHash, enumerate, isResult, platform };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else root.AP_CITA = API;
})(typeof window !== 'undefined' ? window : globalThis);
