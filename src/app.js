import './experience.js';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Reveal the story like broadcast chapters entering frame.
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.14 });
document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));

// Match progress indicator and restrained image parallax.
const progress = document.getElementById('scrollProgress');
const parallaxImages = [...document.querySelectorAll('.parallax-image')];
function onScroll() {
  const maximum = document.documentElement.scrollHeight - innerHeight;
  progress.style.width = `${maximum > 0 ? (scrollY / maximum) * 100 : 0}%`;
  if (reducedMotion) return;
  parallaxImages.forEach((image) => {
    const panel = image.parentElement.getBoundingClientRect();
    if (panel.bottom > 0 && panel.top < innerHeight) {
      const offset = (panel.top / innerHeight) * -3;
      image.style.transform = `translate3d(0, ${offset}%, 0) scale(1.04)`;
    }
  });
}
addEventListener('scroll', onScroll, { passive: true });
onScroll();

// Draggable broadcast player card: accessible faux-3D presentation.
const card = document.getElementById('playerCard');
let dragging = false;
let startX = 0;
let rotationY = 0;
let rotationX = 0;
function renderPlayer() {
  card.style.transform = `rotateY(${rotationY}deg) rotateX(${rotationX}deg)`;
}
card.addEventListener('pointerdown', (event) => {
  dragging = true;
  startX = event.clientX;
  card.setPointerCapture(event.pointerId);
});
card.addEventListener('pointermove', (event) => {
  if (!dragging) return;
  const delta = event.clientX - startX;
  startX = event.clientX;
  rotationY = Math.max(-42, Math.min(42, rotationY + delta * .22));
  rotationX = Math.max(-8, Math.min(8, -event.movementY * .08));
  renderPlayer();
});
card.addEventListener('pointerup', () => { dragging = false; rotationX = 0; renderPlayer(); });
card.addEventListener('pointercancel', () => { dragging = false; });
card.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowLeft') rotationY = Math.max(-42, rotationY - 6);
  else if (event.key === 'ArrowRight') rotationY = Math.min(42, rotationY + 6);
  else return;
  event.preventDefault();
  renderPlayer();
});
renderPlayer();

// Count up the four headline match statistics when the goal lands.
const countObserver = new IntersectionObserver((entries) => {
  if (!entries.some((entry) => entry.isIntersecting)) return;
  document.querySelectorAll('[data-count]').forEach((element) => {
    const target = Number(element.dataset.count);
    const suffix = element.dataset.suffix || '';
    if (reducedMotion) { element.textContent = `${target}${suffix}`; return; }
    const start = performance.now();
    const duration = 1200;
    function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      element.textContent = `${Math.round(target * eased).toLocaleString()}${suffix}`;
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
  countObserver.disconnect();
}, { threshold: .45 });
countObserver.observe(document.querySelector('.impact-strip'));

