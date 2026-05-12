/* ================================================================
   AMOR V2 — Cinematic Resort
   ================================================================ */

let ROOMS = [];
let AVAIL = [];
let RESERVED = [];
let current = { room: null, index: 0 };

/* ------------- INIT ------------- */

async function init() {
  try {
    const res = await fetch('rooms.json');
    ROOMS = await res.json();
  } catch (e) {
    console.error('Failed to load rooms.json', e);
    return;
  }

  AVAIL = ROOMS.filter(r => !r.taken_by);
  RESERVED = ROOMS.filter(r =>  r.taken_by);

  setHeroImage();
  setPlaceImage();
  renderVillas();
  renderReserved();
  bindLightbox();
  bindNav();
  bindReveal();
  bindScrollProgress();
}

/* ------------- HEROES ------------- */

function setHeroImage() {
  // Hero: Romance villa — your villa, dramatic ocean view
  const romance = ROOMS.find(r => r.name === 'Romance');
  const img = document.getElementById('hero-img');
  if (!romance || !romance.images.length) return;
  // Pick a wide ocean-view image — index 0 is usually the hero shot
  const candidate = romance.images[0];
  img.src = candidate;
  img.addEventListener('load', () => img.classList.add('is-loaded'));
  if (img.complete) img.classList.add('is-loaded');
}

function setPlaceImage() {
  // Place: Cascadas — sweeping shot with palms + ocean — feels like Sayulita
  const cascadas = ROOMS.find(r => r.name === 'Cascadas');
  const sirenita = ROOMS.find(r => r.name === 'Sirenita');
  const fallback = ROOMS.find(r => r.name === 'Mañana');
  const pick = cascadas || sirenita || fallback;
  if (!pick || !pick.images.length) return;
  const img = document.getElementById('place-img');
  img.src = pick.images[0];
}

/* ------------- VILLAS ------------- */

function renderVillas() {
  const list = document.getElementById('villas-list');
  list.innerHTML = '';

  AVAIL.forEach((room, i) => {
    const idx = String(i + 1).padStart(2, '0');
    const article = document.createElement('article');
    article.className = 'villa reveal';
    article.dataset.name = room.name;

    article.innerHTML = `
      <div class="villa-number" aria-hidden="true">${idx}</div>
      <figure class="villa-image">
        <img loading="lazy" src="${room.images[0]}" alt="${escapeHtml(room.name)} — ${escapeHtml(room.type)}" />
        ${room.images.length > 1 ? `<span class="villa-photo-count">${room.images.length} · photos</span>` : ''}
      </figure>
      <div class="villa-info">
        <span class="villa-num-label">No. ${idx}</span>
        <h3 class="villa-name">${escapeHtml(room.name)}</h3>
        <p class="villa-type">${escapeHtml(room.type)}</p>
        <p class="villa-desc">${shortenDesc(room.description, 180)}</p>
        <div class="villa-foot">
          <span class="villa-rate">$${room.rate}<span class="villa-rate-unit">per night</span></span>
          <span class="villa-cta">
            <span class="villa-cta-line"></span>
            Step inside
          </span>
        </div>
      </div>
    `;
    article.addEventListener('click', () => openLightbox(room));
    list.appendChild(article);
  });
}

function renderReserved() {
  const grid = document.getElementById('reserved-grid');
  grid.innerHTML = '';
  RESERVED.forEach(room => {
    const card = document.createElement('article');
    card.className = 'reserved-card reveal';
    card.innerHTML = `
      <div class="reserved-card-image">
        <img loading="lazy" src="${room.images[0]}" alt="${escapeHtml(room.name)}" />
        <div class="reserved-card-overlay">
          <span class="reserved-tag">Reserved</span>
          <div>
            <h3 class="reserved-name">${escapeHtml(room.name)}</h3>
            <p class="reserved-type">${escapeHtml(room.type)}</p>
          </div>
        </div>
      </div>
    `;
    card.addEventListener('click', () => openLightbox(room));
    grid.appendChild(card);
  });
}

/* ------------- LIGHTBOX ------------- */

function openLightbox(room) {
  current.room = room;
  current.index = 0;

  const eyebrow = document.getElementById('lb-eyebrow');
  eyebrow.textContent = room.taken_by ? 'Reserved' : 'Available';

  // Number — find in AVAIL order (or "Reserved" for booked)
  const numEl = document.getElementById('lb-num');
  if (room.taken_by) {
    numEl.textContent = '';
  } else {
    const i = AVAIL.indexOf(room);
    numEl.textContent = i >= 0 ? `No. ${String(i + 1).padStart(2, '0')}` : '';
  }

  document.getElementById('lb-title').textContent = room.name;
  document.getElementById('lb-type').textContent  = room.type;
  document.getElementById('lb-rate').textContent  = '$' + room.rate;
  document.getElementById('lb-desc').textContent  = room.description || '';
  document.getElementById('lb-access').textContent= room.access || '';
  document.getElementById('lb-link').href         = room.url;

  // Thumbs
  const thumbs = document.getElementById('lb-thumbs');
  thumbs.innerHTML = '';
  room.images.slice(0, 8).forEach((src, i) => {
    const btn = document.createElement('button');
    btn.className = 'lb-thumb' + (i === 0 ? ' is-active' : '');
    btn.innerHTML = `<img loading="lazy" src="${src}" alt="" />`;
    btn.addEventListener('click', () => showImage(i));
    thumbs.appendChild(btn);
  });

  showImage(0);

  const lb = document.getElementById('lb');
  lb.setAttribute('aria-hidden', 'false');
  document.body.classList.add('no-scroll');
}

function closeLightbox() {
  const lb = document.getElementById('lb');
  lb.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('no-scroll');
  current.room = null;
}

function showImage(i) {
  if (!current.room) return;
  const n = current.room.images.length;
  current.index = ((i % n) + n) % n;
  const src = current.room.images[current.index];

  const img = document.getElementById('lb-image');
  // Cross-fade by setting background-image
  img.style.backgroundImage = `url("${src}")`;

  // Counter
  document.getElementById('lb-counter').textContent =
    `${String(current.index + 1).padStart(2, '0')} · ${String(n).padStart(2, '0')}`;

  // Active thumb
  document.querySelectorAll('.lb-thumb').forEach((t, idx) => {
    t.classList.toggle('is-active', idx === current.index);
  });
}

function bindLightbox() {
  document.querySelectorAll('[data-close]').forEach(el => {
    el.addEventListener('click', closeLightbox);
  });
  document.querySelector('.lb-prev').addEventListener('click', () => showImage(current.index - 1));
  document.querySelector('.lb-next').addEventListener('click', () => showImage(current.index + 1));

  document.addEventListener('keydown', (e) => {
    const open = document.getElementById('lb').getAttribute('aria-hidden') === 'false';
    if (!open) return;
    if (e.key === 'Escape')     closeLightbox();
    if (e.key === 'ArrowLeft')  showImage(current.index - 1);
    if (e.key === 'ArrowRight') showImage(current.index + 1);
  });

  // Touch swipe
  let startX = null;
  const wrap = document.querySelector('.lb-image-wrap');
  wrap.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
  wrap.addEventListener('touchend', (e) => {
    if (startX === null) return;
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 50) showImage(current.index + (dx < 0 ? 1 : -1));
    startX = null;
  });
}

/* ------------- NAV ------------- */

function bindNav() {
  const nav = document.querySelector('.nav');
  let lastY = window.scrollY;
  let ticking = false;

  function update() {
    const y = window.scrollY;
    nav.classList.toggle('is-scrolled', y > 60);
    if (y > 200 && y > lastY + 4) {
      nav.classList.add('is-hidden');
    } else if (y < lastY - 4 || y < 200) {
      nav.classList.remove('is-hidden');
    }
    lastY = y;
    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(update); ticking = true; }
  }, { passive: true });
}

/* ------------- REVEAL on scroll ------------- */

function bindReveal() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) {
    document.querySelectorAll('.reveal, .villa, .place, .prelude').forEach(el => {
      el.classList.add('is-visible', 'is-revealed');
    });
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        en.target.classList.add('is-visible');
        if (en.target.classList.contains('prelude')) {
          en.target.classList.add('is-revealed');
        }
        io.unobserve(en.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

  document.querySelectorAll('.reveal, .villa, .place, .prelude').forEach(el => io.observe(el));
}

/* ------------- SCROLL PROGRESS ------------- */

function bindScrollProgress() {
  const bar = document.querySelector('.scroll-progress');
  function update() {
    const h = document.documentElement.scrollHeight - window.innerHeight;
    const pct = h > 0 ? (window.scrollY / h) * 100 : 0;
    bar.style.width = pct + '%';
  }
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
}

/* ------------- UTILS ------------- */

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function shortenDesc(s, max) {
  s = String(s || '').trim();
  if (s.length <= max) return escapeHtml(s);
  const cut = s.lastIndexOf(' ', max);
  return escapeHtml(s.slice(0, cut > 0 ? cut : max)) + '…';
}

document.addEventListener('DOMContentLoaded', init);
