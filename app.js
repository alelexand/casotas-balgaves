// Casotas Balgaves — filtros da galeria, lightbox e vídeos ao toque
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  // Borda no topo ao rolar
  const topo = $('#topo');
  const marcar = () => topo.classList.toggle('rolou', scrollY > 8);
  addEventListener('scroll', marcar, { passive: true }); marcar();

  // Filtros
  const fotos = $$('.foto');
  $$('.chip').forEach(chip => chip.addEventListener('click', () => {
    $$('.chip').forEach(c => { c.classList.toggle('ativo', c === chip); c.setAttribute('aria-pressed', c === chip); });
    const f = chip.dataset.f;
    fotos.forEach(el => el.hidden = !(f === 'todos' || el.dataset.cat === f));
  }));

  // Lightbox
  const lb = $('#lightbox'), lbImg = $('img', lb), lbCap = $('figcaption', lb);
  let atual = 0;
  const visiveis = () => fotos.filter(f => !f.hidden);
  const mostrar = i => {
    const v = visiveis(); atual = (i + v.length) % v.length;
    const el = v[atual];
    lbImg.src = el.dataset.grande; lbImg.alt = el.querySelector('img').alt; lbCap.textContent = lbImg.alt;
  };
  fotos.forEach(el => el.addEventListener('click', () => { mostrar(visiveis().indexOf(el)); lb.showModal(); }));
  $('.lb-fechar').onclick = () => lb.close();
  $('.lb-ant').onclick = () => mostrar(atual - 1);
  $('.lb-seg').onclick = () => mostrar(atual + 1);
  lb.addEventListener('click', e => { if (e.target === lb) lb.close(); });
  addEventListener('keydown', e => {
    if (!lb.open) return;
    if (e.key === 'ArrowLeft') mostrar(atual - 1);
    if (e.key === 'ArrowRight') mostrar(atual + 1);
  });
  let x0 = null;
  lb.addEventListener('touchstart', e => x0 = e.touches[0].clientX, { passive: true });
  lb.addEventListener('touchend', e => {
    if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 50) mostrar(atual + (dx < 0 ? 1 : -1)); x0 = null;
  });

  // Vídeos: só carregam quando a pessoa toca (poupa dados no telemóvel)
  const leve = matchMedia('(max-width: 640px)').matches || (navigator.connection && navigator.connection.saveData);
  $$('.video').forEach(fig => {
    const btn = $('.video-btn', fig);
    btn.addEventListener('click', () => {
      if (fig.classList.contains('tocando')) return;
      const v = document.createElement('video');
      v.src = leve ? fig.dataset.leve : fig.dataset.src;
      v.poster = $('img', btn).src;
      v.muted = true; v.controls = true; v.playsInline = true; v.autoplay = true; v.loop = true;
      $('img', btn).replaceWith(v);
      fig.classList.add('tocando');
      v.play().catch(() => {});
    });
  });

  // Vídeo do topo: pausa fora do ecrã e respeita "reduzir movimento"
  const hero = $('.hero-media video');
  if (hero) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) hero.pause();
    else new IntersectionObserver(([e]) => e.isIntersecting ? hero.play().catch(() => {}) : hero.pause()).observe(hero);
  }
  // Agenda de encomendas: lê a planilha Google publicada (CSV) ou, se falhar, agenda.json.
  const ag = $('#agenda');
  if (ag) {
    const MESES = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
    const norm = t => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
    const estado = t => { t = norm(t);
      if (/pouc|ultim|quase/.test(t)) return 'poucas';
      if (/chei|fech|esgot|lotad|ocupad/.test(t)) return 'cheio';
      if (/dispon|livre|abert|vaga/.test(t)) return 'livre'; return null; };
    const hoje = new Date(), hk = hoje.getFullYear() * 12 + hoje.getMonth();
    const mes = t => { t = norm(t); const ano = t.match(/20\d\d/); let m = null;
      MESES.forEach((n, i) => { if (m === null && t.includes(norm(n).slice(0, 3))) m = i + 1; });
      if (m === null) { const ns = (t.match(/\d+/g) || []).filter(x => x.length <= 2).map(Number);
        if (!ns.length) return null; m = ns[ns.length - 1] <= 12 ? ns[ns.length - 1] : ns[0]; if (m > 12) return null; }
      const y = ano ? +ano[0] : (m - 1 >= hoje.getMonth() ? hoje.getFullYear() : hoje.getFullYear() + 1);
      return y * 12 + (m - 1); };
    const csv = txt => txt.split(/\r?\n/).map(l => { const out = []; let cur = '', q = false;
      for (let i = 0; i < l.length; i++) { const c = l[i];
        if (q) { if (c === '"' && l[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') q = false; else cur += c; }
        else if (c === '"') q = true; else if (c === ',') { out.push(cur); cur = ''; } else cur += c; }
      out.push(cur); return out; });
    const ROT = { livre: 'Disponível', poucas: 'Poucas vagas', cheio: 'Agenda cheia' };
    const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const desenhar = linhas => {
      let nota = ''; const map = new Map();
      linhas.forEach(([a, b]) => { if (!a || !String(a).trim()) return;
        if (/^(nota|aviso)/.test(norm(a))) { nota = String(b || '').trim(); return; }
        const k = mes(a), e = estado(b); if (k !== null && e && k >= hk) map.set(k, e); });
      const ms = [...map].sort((x, y) => x[0] - y[0]).slice(0, 6);
      const nome = k => `${MESES[k % 12]} de ${Math.floor(k / 12)}`;
      const prox = (ms.find(([, e]) => e !== 'cheio') || [])[0];
      let tit, res;
      if (!ms.length) { tit = 'Fale connosco sobre prazos'; res = 'Consulte a disponibilidade'; nota = nota || 'Envie-nos uma mensagem para saber quando conseguimos entregar a sua casota.'; }
      else if (prox === undefined) { tit = 'Agenda cheia nos próximos meses'; res = 'Agenda cheia: fale connosco'; }
      else if (prox === hk) { tit = 'Temos vagas para este mês'; res = 'Vagas disponíveis este mês'; }
      else { tit = `Próximas entregas a partir de ${nome(prox)}`; res = `Próximas entregas: ${nome(prox)}`; }
      $('[data-agenda-titulo]').textContent = tit;
      $('[data-agenda-nota]').textContent = nota;
      $$('[data-agenda-resumo]').forEach(el => el.innerHTML = '<span class="ponto"></span>' + esc(res));
      $('[data-agenda-meses]').innerHTML = ms.map(([k, e]) => { const n = MESES[k % 12];
        return `<li class="mes ${e}"><b>${n[0].toUpperCase() + n.slice(1)}</b><span>${Math.floor(k / 12)}</span><em>${ROT[e]}</em></li>`; }).join('');
    };
    const url = ag.dataset.planilha;
    const deJson = () => fetch('agenda.json', { cache: 'no-cache' }).then(r => r.json()).then(j => desenhar(j.linhas));
    (url ? fetch(url, { cache: 'no-store' }).then(r => { if (!r.ok) throw 0; return r.text(); })
            .then(t => { const l = csv(t); if (l.length < 2) throw 0; desenhar(l.slice(1)); })
         : Promise.reject()).catch(() => deJson().catch(() => {}));
  }

  $('#ano').textContent = new Date().getFullYear();
})();
