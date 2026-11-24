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
  $('#ano').textContent = new Date().getFullYear();
})();
