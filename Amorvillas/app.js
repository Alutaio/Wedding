/* ============================================================
   Amor Hotel Room Options — gallery + modal logic
   ============================================================ */

let ROOMS = [];
let currentRoom = null;
let currentIndex = 0;

// ------------- INIT -------------

async function init() {
  try {
    const res = await fetch('rooms.json');
    ROOMS = await res.json();
  } catch (e) {
    console.error('Failed to load rooms.json', e);
    return;
  }

  const available = ROOMS.filter(r => !r.taken_by);
  const booked    = ROOMS.filter(r => r.taken_by);

  renderGrid(document.getElementById('available-grid'), available, false);
  renderGrid(document.getElementById('booked-grid'),    booked,    true);

  bindModal();
}

// ------------- RENDER -------------

function renderGrid(container, rooms, isBooked) {
  container.innerHTML = '';
  rooms.forEach((room, i) => {
    const card = document.createElement('article');
    card.className = 'card' + (isBooked ? ' card--booked' : '');
    card.dataset.name = room.name;

    const cover = room.images[0] || '';

    card.innerHTML = `
      <div class="card-image">
        ${isBooked ? `<span class="card-badge">Reserved</span>` : ''}
        <img loading="lazy" src="${cover}" alt="${room.name} — ${room.type}" />
        ${room.images.length > 1
          ? `<span class="card-image-count">${room.images.length} photos</span>`
          : ''
        }
      </div>
      <div class="card-body">
        <h3 class="card-name">${escapeHtml(room.name)}</h3>
        <p class="card-type">${escapeHtml(room.type)}</p>
        <div class="card-foot">
          <span class="card-price">$${room.rate}<span class="card-price-unit"> / night</span></span>
          <span class="card-cta">View →</span>
        </div>
      </div>
    `;
    card.addEventListener('click', () => openModal(room));
    container.appendChild(card);
  });
}

// ------------- MODAL -------------

function openModal(room) {
  currentRoom = room;
  currentIndex = 0;

  // Eyebrow: booked tag or just type-line
  const eyebrow = document.getElementById('modal-eyebrow');
  if (room.taken_by) {
    eyebrow.innerHTML = `<span class="modal-booked-tag">Reserved</span>`;
  } else {
    eyebrow.textContent = 'Available';
  }

  document.getElementById('modal-title').textContent  = room.name;
  document.getElementById('modal-type').textContent   = room.type;
  document.getElementById('modal-price').textContent  = '$' + room.rate;
  document.getElementById('modal-desc').textContent   = room.description || '';
  document.getElementById('modal-access').textContent = room.access || '';

  const linkEl = document.getElementById('modal-link');
  linkEl.href = room.url;

  // Thumbnails
  const thumbs = document.getElementById('modal-thumbs');
  thumbs.innerHTML = '';
  room.images.forEach((src, i) => {
    const btn = document.createElement('button');
    btn.className = 'thumb' + (i === 0 ? ' active' : '');
    btn.innerHTML = `<img src="${src}" alt="" loading="lazy" />`;
    btn.addEventListener('click', () => showImage(i));
    thumbs.appendChild(btn);
  });

  showImage(0);

  const modal = document.getElementById('modal');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('no-scroll');
}

function closeModal() {
  const modal = document.getElementById('modal');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('no-scroll');
  currentRoom = null;
}

function showImage(idx) {
  if (!currentRoom) return;
  const n = currentRoom.images.length;
  currentIndex = (idx + n) % n;
  const src = currentRoom.images[currentIndex];

  const img = document.getElementById('gallery-img');
  img.src = src;
  img.alt = `${currentRoom.name} — photo ${currentIndex + 1} of ${n}`;

  document.getElementById('gallery-counter').textContent =
    `${currentIndex + 1} / ${n}`;

  // Active thumb
  document.querySelectorAll('.thumb').forEach((t, i) => {
    t.classList.toggle('active', i === currentIndex);
    if (i === currentIndex) {
      t.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  });
}

function bindModal() {
  // Close handlers
  document.querySelectorAll('[data-close]').forEach(el => {
    el.addEventListener('click', closeModal);
  });

  // Nav
  document.querySelector('.gallery-prev').addEventListener('click', () => showImage(currentIndex - 1));
  document.querySelector('.gallery-next').addEventListener('click', () => showImage(currentIndex + 1));

  // Keyboard
  document.addEventListener('keydown', (e) => {
    if (document.getElementById('modal').getAttribute('aria-hidden') === 'true') return;
    if (e.key === 'Escape')      closeModal();
    if (e.key === 'ArrowLeft')   showImage(currentIndex - 1);
    if (e.key === 'ArrowRight')  showImage(currentIndex + 1);
  });

  // Touch swipe on gallery
  let startX = null;
  const gallery = document.querySelector('.modal-gallery');
  gallery.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
  }, { passive: true });
  gallery.addEventListener('touchend', (e) => {
    if (startX === null) return;
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 50) {
      showImage(currentIndex + (dx < 0 ? 1 : -1));
    }
    startX = null;
  });
}

// ------------- UTIL -------------

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

document.addEventListener('DOMContentLoaded', init);
