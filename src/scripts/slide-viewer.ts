const SWIPE_THRESHOLD_PX = 40;

/** Arrow buttons, keyboard arrows, swipe, and full screen for one slide deck. */
export function initSlideViewer(root: HTMLElement): void {
  const slides = [...root.querySelectorAll<HTMLImageElement>('.slide')];
  const stage = root.querySelector<HTMLElement>('.stage');
  const prev = root.querySelector<HTMLButtonElement>('[data-prev]');
  const next = root.querySelector<HTMLButtonElement>('[data-next]');
  const current = root.querySelector<HTMLElement>('[data-current]');
  const progress = root.querySelector<HTMLElement>('[data-progress]');
  const fullscreen = root.querySelector<HTMLButtonElement>('[data-fullscreen]');
  if (!stage || !prev || !next || !current || !progress || slides.length === 0) return;

  let index = 0;

  const show = (target: number) => {
    index = Math.max(0, Math.min(slides.length - 1, target));
    slides.forEach((slide, i) => slide.classList.toggle('is-current', i === index));
    // Warm the next slide so it's ready before the click.
    slides[index + 1]?.setAttribute('loading', 'eager');
    current.textContent = String(index + 1);
    progress.style.width = `${((index + 1) / slides.length) * 100}%`;
    prev.disabled = index === 0;
    next.disabled = index === slides.length - 1;
  };

  prev.addEventListener('click', () => show(index - 1));
  next.addEventListener('click', () => show(index + 1));

  root.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight' || event.key === 'PageDown') show(index + 1);
    else if (event.key === 'ArrowLeft' || event.key === 'PageUp') show(index - 1);
    else return;
    event.preventDefault();
  });

  let startX: number | null = null;
  stage.addEventListener('pointerdown', (event) => {
    startX = event.clientX;
  });
  stage.addEventListener('pointerup', (event) => {
    if (startX === null) return;
    const delta = event.clientX - startX;
    startX = null;
    if (Math.abs(delta) > SWIPE_THRESHOLD_PX) show(index + (delta < 0 ? 1 : -1));
  });

  if (fullscreen) {
    if (!document.fullscreenEnabled) fullscreen.hidden = true;
    fullscreen.addEventListener('click', () => {
      if (document.fullscreenElement) void document.exitFullscreen();
      else void root.requestFullscreen().then(() => stage.focus());
    });
    document.addEventListener('fullscreenchange', () => {
      fullscreen.textContent = document.fullscreenElement === root ? 'Exit full screen' : 'Full screen';
    });
  }

  show(0);
}
