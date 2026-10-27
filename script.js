(() => {
  const $ = (s, el = document) => el.querySelector(s);

  /* ---------- Mobile menu ---------- */
  const burger = $('.burger'), links = $('.links');
  burger.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    burger.setAttribute('aria-expanded', open);
  });
  links.addEventListener('click', e => {
    if (e.target.tagName === 'A') { links.classList.remove('open'); burger.setAttribute('aria-expanded', false); }
  });

  /* ---------- Portfolio chart ---------- */
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const VALUES = [430000,436000,433000,441000,452000,447000,458000,463000,461000,470000,476000,482230];
  const chart = $('#chart'), tip = $('#tip');
  const fmt = n => '$' + n.toLocaleString('en-US');

  function drawChart(n) {
    const vals = VALUES.slice(-n), names = MONTHS.slice(-n);
    const W = 440, H = 150, pad = 10;
    const min = Math.min(...vals) - 5000, max = Math.max(...vals) + 3000;
    const pts = vals.map((v, i) => [
      (i / (vals.length - 1)) * W,
      H - pad - ((v - min) / (max - min)) * (H - pad * 2)
    ]);
    // smooth curve
    let d = `M${pts[0][0]},${pts[0][1]}`;
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], cx = (x0 + x1) / 2;
      d += ` C${cx},${y0} ${cx},${y1} ${x1},${y1}`;
    }
    const last = pts[pts.length - 1];
    chart.innerHTML =
      `<defs><linearGradient id="fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8ff0dc" stop-opacity=".35"/><stop offset="1" stop-color="#8ff0dc" stop-opacity="0"/></linearGradient></defs>` +
      `<path d="${d} L${W},${H} L0,${H}Z" fill="url(#fill)" stroke="none"/>` +
      `<path class="line" pathLength="1" d="${d}"/>` +
      `<circle id="dot" cx="${last[0]}" cy="${last[1]}" r="5" fill="#fff" stroke="none"/>` +
      `<rect width="${W}" height="${H}" fill="transparent" stroke="none" id="hit"/>`;

    $('#months').innerHTML = names.map(m => `<span>${m}</span>`).join('');

    const first = vals[0], lastV = vals[vals.length - 1];
    const pct = ((lastV - first) / first * 100).toFixed(1);
    $('#pValue').textContent = fmt(lastV);
    $('#pChange').textContent = `↑ ${pct}%`;
    $('#mGrowth').textContent = `+${pct}%`;
    $('#pSub').textContent = n === 12 ? 'vs. last quarter' : `over ${n} months`;

    const dot = $('#dot'), hit = $('#hit');
    hit.addEventListener('mousemove', e => {
      const r = chart.getBoundingClientRect();
      const i = Math.round(((e.clientX - r.left) / r.width) * (vals.length - 1));
      const p = pts[Math.max(0, Math.min(i, vals.length - 1))];
      dot.setAttribute('cx', p[0]); dot.setAttribute('cy', p[1]);
      tip.textContent = `${names[i]}: ${fmt(vals[i])}`;
      tip.style.left = (p[0] / W * 100) + '%';
      tip.style.top = (p[1] / H * 100) + '%';
      tip.style.opacity = 1;
    });
    hit.addEventListener('mouseleave', () => {
      tip.style.opacity = 0;
      dot.setAttribute('cx', last[0]); dot.setAttribute('cy', last[1]);
    });
  }
  drawChart(12);
  $('#range').addEventListener('change', e => drawChart(+e.target.value));

  /* ---------- Testimonials ---------- */
  const quotes = [
    ['Novara gave us clarity, confidence, and a plan that actually makes sense. We finally feel in control of our future.', 'James T.'],
    ['They explained every option in plain language and never pushed us. Retirement feels achievable now.', 'Priya & Arun S.'],
    ['Our business and personal finances finally work together. The advice has been honest and practical.', 'Marcus L.']
  ];
  let idx = 0, timer;
  const qText = $('#qText'), qName = $('#qName'), dots = $('#dots');
  dots.innerHTML = quotes.map(() => '<i></i>').join('');

  function show(i) {
    idx = (i + quotes.length) % quotes.length;
    qText.classList.add('fade'); qName.classList.add('fade');
    setTimeout(() => {
      qText.textContent = `“${quotes[idx][0]}”`;
      qName.textContent = `— ${quotes[idx][1]}`;
      qText.classList.remove('fade'); qName.classList.remove('fade');
      [...dots.children].forEach((d, k) => d.classList.toggle('on', k === idx));
    }, 200);
  }
  const auto = () => { clearInterval(timer); timer = setInterval(() => show(idx + 1), 6000); };
  $('#next').addEventListener('click', () => { show(idx + 1); auto(); });
  $('#prev').addEventListener('click', () => { show(idx - 1); auto(); });
  show(0); auto();

  /* ---------- Stats counter ---------- */
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const counters = document.querySelectorAll('[data-count]');
  const render = (el, v) => {
    const dec = +el.dataset.dec || 0;
    el.textContent = (el.dataset.prefix || '') + (dec ? v.toFixed(dec) : Math.round(v).toLocaleString('en-US')) + (el.dataset.suffix || '');
  };
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      const el = en.target, end = +el.dataset.count;
      io.unobserve(el);
      if (reduce) return render(el, end);
      const t0 = performance.now(), dur = 1400;
      (function step(t) {
        const p = Math.min((t - t0) / dur, 1);
        render(el, end * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(step);
      })(t0);
    });
  }, { threshold: .4 });
  counters.forEach(c => { render(c, 0); io.observe(c); });

  /* ---------- Nav highlight on scroll ---------- */
  const sections = ['home', 'services', 'about', 'resources', 'contact'].map(id => document.getElementById(id));
  const navLinks = document.querySelectorAll('.links a');
  addEventListener('scroll', () => {
    let cur = 'home';
    sections.forEach(s => { if (s.getBoundingClientRect().top < innerHeight * .4) cur = s.id; });
    navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + cur));
  }, { passive: true });

  /* ---------- Video modal ---------- */
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = '<div><h3>Intro video</h3><p>Add your video here. Replace this box with a YouTube or Vimeo embed.</p><button class="btn btn-mint" id="closeM">Close</button></div>';
  document.body.appendChild(modal);
  $('#watchBtn').addEventListener('click', () => modal.classList.add('open'));
  modal.addEventListener('click', e => { if (e.target === modal || e.target.id === 'closeM') modal.classList.remove('open'); });
  addEventListener('keydown', e => { if (e.key === 'Escape') modal.classList.remove('open'); });

  $('#year').textContent = new Date().getFullYear();
})();
