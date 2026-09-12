import EmblaCarousel, { type EmblaCarouselType } from 'embla-carousel';
import Autoplay, { type AutoplayType } from 'embla-carousel-autoplay';

const AUTOPLAY_DELAY = 10000;

function initGundemVitrini(kok: HTMLElement): void {
  // Tek initialization guard
  if (kok.classList.contains('gv-ready')) return;

  const mainNode = kok.querySelector<HTMLElement>('#gv-main-embla');
  if (!mainNode) return;

  const thumbsNode = kok.querySelector<HTMLElement>('#gv-thumbs-embla');
  const playPauseBtn = kok.querySelector<HTMLButtonElement>('#gv-play-pause');
  const dialog = kok.querySelector<HTMLDialogElement>('#gv-dialog');
  const dialogImg = kok.querySelector<HTMLImageElement>('#gv-dialog-img');
  const ariaLive = kok.querySelector<HTMLElement>('#gv-aria-live');
  const prevBtn = kok.querySelector<HTMLButtonElement>('.gv-prev');
  const nextBtn = kok.querySelector<HTMLButtonElement>('.gv-next');
  const afisButtons = kok.querySelectorAll<HTMLElement>('.gv-afis-btn');

  const slides = Array.from(mainNode.querySelectorAll<HTMLElement>('.gv-sahne__slide'));
  const thumbs = thumbsNode
    ? Array.from(thumbsNode.querySelectorAll<HTMLElement>('.gv-thumb'))
    : [];

  const belge = document.documentElement;
  const azaltMedia = window.matchMedia('(prefers-reduced-motion: reduce)');

  const shouldJump = (): boolean => azaltMedia.matches;

  let userWantsPlay = false;
  let isHovered = false;
  let hoverOverridden = false;
  let isKeyboardPaused = false;
  let isDialogPaused = false;
  let isDocumentHidden = document.visibilityState === 'hidden';
  let isIntersecting = true;
  let isManualSelect = false;
  let isPointerActive = false;
  let focusPauseRaf: number | null = null;
  let lastDialogTrigger: HTMLElement | null = null;
  let rafId: number | null = null;
  let isDispatchingHareket = false;

  try {
    const saved = localStorage.getItem('uluCamiiHareket');
    if (saved === 'acik') {
      userWantsPlay = true;
    } else if (saved === 'durdu') {
      userWantsPlay = false;
    } else {
      userWantsPlay = azaltMedia.matches ? false : belge.dataset.hareket !== 'durdu';
    }
  } catch {
    userWantsPlay = !azaltMedia.matches;
  }
  belge.dataset.hareket = userWantsPlay ? 'acik' : 'durdu';

  const autoplayPlugin: AutoplayType = Autoplay({
    delay: AUTOPLAY_DELAY,
    playOnInit: false,
    stopOnInteraction: true,
    stopOnMouseEnter: false,
    stopOnFocusIn: false,
  });

  const mainApi: EmblaCarouselType = EmblaCarousel(
    mainNode,
    { loop: true, align: 'start', skipSnaps: false },
    [autoplayPlugin]
  );

  let thumbsApi: EmblaCarouselType | null = null;
  if (thumbsNode) {
    thumbsApi = EmblaCarousel(thumbsNode, { containScroll: 'keepSnaps', dragFree: true });
  }

  function broadcastHareket(duruyor: boolean) {
    isDispatchingHareket = true;
    try {
      document.dispatchEvent(new CustomEvent('ulucamii:hareket', { detail: { duruyor } }));
    } finally {
      isDispatchingHareket = false;
    }
  }

  function updatePlayPauseUI(isPlaying: boolean) {
    if (!playPauseBtn) return;
    playPauseBtn.removeAttribute('aria-pressed');
    const label = isPlaying ? playPauseBtn.dataset.durdur : playPauseBtn.dataset.oynat;
    if (label) {
      playPauseBtn.setAttribute('aria-label', label);
      playPauseBtn.title = label;
    }
    const pauseIcon = playPauseBtn.querySelector<HTMLElement>('.gv-icon-pause');
    const playIcon = playPauseBtn.querySelector<HTMLElement>('.gv-icon-play');
    if (pauseIcon) pauseIcon.style.display = isPlaying ? '' : 'none';
    if (playIcon) playIcon.style.display = isPlaying ? 'none' : '';
  }

  function updateProgress(progressVal: number) {
    const activeIndex = mainApi.selectedScrollSnap();
    thumbs.forEach((thumb, idx) => {
      const cizgi = thumb.querySelector<HTMLElement>('.gv-thumb-cizgi');
      const valStr = idx === activeIndex ? progressVal.toFixed(4) : '0';
      thumb.style.setProperty('--gv-progress', valStr);
      if (cizgi) cizgi.style.setProperty('--gv-progress', valStr);
    });
  }

  function startProgressLoop() {
    if (rafId !== null) return;
    const loop = () => {
      const remaining = autoplayPlugin.timeUntilNext();
      if (remaining === null) {
        stopProgressLoop(true);
        return;
      }
      const elapsed = Math.max(0, AUTOPLAY_DELAY - remaining);
      updateProgress(Math.min(1, Math.max(0, elapsed / AUTOPLAY_DELAY)));
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
  }

  function stopProgressLoop(reset: boolean = true) {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    if (reset) updateProgress(0);
  }

  function syncThumbsScroll(index: number) {
    if (!thumbsApi) return;
    const snaps = thumbsApi.scrollSnapList();
    if (snaps.length <= 1 || thumbsApi.slidesInView().includes(index)) return;

    try {
      const registry = thumbsApi.internalEngine().slideRegistry;
      const snapIndex = registry.findIndex((group) => group.includes(index));
      thumbsApi.scrollTo(snapIndex !== -1 ? snapIndex : Math.min(index, snaps.length - 1), shouldJump());
    } catch {
      thumbsApi.scrollTo(Math.min(index, snaps.length - 1), shouldJump());
    }
  }

  function syncUI(index: number) {
    slides.forEach((slide, i) => {
      const active = i === index;
      slide.setAttribute('aria-hidden', active ? 'false' : 'true');
      if (active) slide.removeAttribute('inert');
      else slide.setAttribute('inert', '');
    });

    thumbs.forEach((thumb, i) => {
      const active = i === index;
      if (active) thumb.setAttribute('aria-current', 'true');
      else thumb.removeAttribute('aria-current');
      thumb.removeAttribute('aria-selected');
    });

    syncThumbsScroll(index);

    const img = slides[index]?.querySelector<HTMLImageElement>('img');
    // Fade slaytları aynı görüş alanındadır: loading=lazy tek başına indirmeyi ertelemez.
    // Büyük afiş ve bulanık arka plan yalnız slayt seçilince etkinleşir.
    if (img?.dataset.afisSrc) {
      img.loading = 'eager';
      img.fetchPriority = 'high';
      img.src = img.dataset.afisSrc;
      delete img.dataset.afisSrc;
      img.closest<HTMLElement>('.gv-gorsel-kutu')?.style.setProperty('--gv-afis-bg', `url(${JSON.stringify(img.src)})`);
    }
    if (img && img.loading !== 'eager') img.loading = 'eager';
  }

  function evaluateAutoplay() {
    const effectiveHover = isHovered && !hoverOverridden;
    const canPlay =
      userWantsPlay &&
      !effectiveHover &&
      !isKeyboardPaused &&
      !isDialogPaused &&
      !isDocumentHidden &&
      isIntersecting;

    if (canPlay) {
      if (!autoplayPlugin.isPlaying()) {
        autoplayPlugin.play(shouldJump());
      }
    } else {
      if (autoplayPlugin.isPlaying()) {
        autoplayPlugin.stop();
      }
    }
  }

  function cancelPendingFocusPause() {
    if (focusPauseRaf !== null) {
      cancelAnimationFrame(focusPauseRaf);
      focusPauseRaf = null;
    }
  }

  function scheduleKeyboardFocusPause() {
    cancelPendingFocusPause();
    focusPauseRaf = requestAnimationFrame(() => {
      focusPauseRaf = null;
      // Fare/touch aktivasyonu odağı tıklamadan önce taşıyabilir. Bu durumda
      // kontrolü odaklanır odaklanmaz durdurmak, tıklamanın tersine çevrilmesine
      // yol açar; gerçek klavye odağında ise hareketi güvenle durdururuz.
      if (!isPointerActive) {
        isKeyboardPaused = true;
        evaluateAutoplay();
      }
    });
  }

  const onManualNav = (navigate: () => void) => {
    isManualSelect = true;
    navigate();
    if (userWantsPlay) autoplayPlugin.reset();
  };

  thumbs.forEach((thumb, index) => {
    thumb.setAttribute('role', 'button');
    thumb.removeAttribute('aria-selected');
    if (thumb instanceof HTMLAnchorElement && !thumb.hasAttribute('tabindex')) {
      thumb.tabIndex = 0;
    }

    thumb.addEventListener('click', (e) => {
      cancelPendingFocusPause();
      e.preventDefault();
      onManualNav(() => mainApi.scrollTo(index, shouldJump()));
    });

    thumb.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        onManualNav(() => mainApi.scrollTo(index, shouldJump()));
        return;
      }
      let target = -1;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') target = (index - 1 + thumbs.length) % thumbs.length;
      else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') target = (index + 1) % thumbs.length;
      else if (e.key === 'Home') target = 0;
      else if (e.key === 'End') target = thumbs.length - 1;

      if (target !== -1) {
        e.preventDefault();
        thumbs[target]?.focus({ preventScroll: true });
        onManualNav(() => mainApi.scrollTo(target, shouldJump()));
      }
    });
  });

  if (prevBtn) prevBtn.addEventListener('pointerdown', cancelPendingFocusPause, { capture: true });
  if (nextBtn) {
    nextBtn.addEventListener('pointerdown', cancelPendingFocusPause, { capture: true });
    nextBtn.addEventListener('click', () => {
      cancelPendingFocusPause();
      onManualNav(() => mainApi.scrollNext(shouldJump()));
    });
  }
  if (prevBtn) prevBtn.addEventListener('click', () => {
    cancelPendingFocusPause();
    onManualNav(() => mainApi.scrollPrev(shouldJump()));
  });

  mainApi.on('select', () => {
    const index = mainApi.selectedScrollSnap();
    syncUI(index);

    if (isManualSelect && ariaLive) {
      isManualSelect = false;
      const baslik = slides[index]?.querySelector('.gv-baslik')?.textContent?.trim() || '';
      ariaLive.textContent = `${index + 1} / ${slides.length}${baslik ? `: ${baslik}` : ''}`;
    }
  });

  mainApi.on('reInit', () => {
    syncUI(mainApi.selectedScrollSnap());
    evaluateAutoplay();
  });

  mainApi.on('pointerDown', () => {
    isManualSelect = true;
    if (autoplayPlugin.isPlaying()) {
      autoplayPlugin.stop();
    }
  });

  mainApi.on('pointerUp', () => {
    evaluateAutoplay();
  });

  mainApi.on('settle', () => {
    isManualSelect = false;
  });

  mainApi.on('autoplay:timerset', () => startProgressLoop());
  mainApi.on('autoplay:timerstopped', () => stopProgressLoop(true));
  mainApi.on('autoplay:play', () => updatePlayPauseUI(true));
  mainApi.on('autoplay:stop', () => {
    // Hover, görünürlük veya klavye odağı oynatıcıyı geçici olarak durdurabilir.
    // Düğme etiketi bu anlık durumu değil, ziyaretçinin seçtiği tercihi göstermeli;
    // aksi hâlde fareyle düğmeye tıklamak “oynat” komutuna dönüşür.
    updatePlayPauseUI(userWantsPlay && !isKeyboardPaused);
    stopProgressLoop(true);
  });

  if (playPauseBtn) {
    playPauseBtn.addEventListener('pointerdown', cancelPendingFocusPause, { capture: true });
    playPauseBtn.addEventListener('click', () => {
      cancelPendingFocusPause();
      const isCurrentlyPlaying = userWantsPlay && !isKeyboardPaused;
      if (isCurrentlyPlaying) {
        userWantsPlay = false;
        hoverOverridden = false;
        belge.dataset.hareket = 'durdu';
        try {
          localStorage.setItem('uluCamiiHareket', 'durdu');
        } catch {}
        broadcastHareket(true);
        updatePlayPauseUI(false);
      } else {
        userWantsPlay = true;
        isKeyboardPaused = false;
        hoverOverridden = true;
        isDialogPaused = false;
        belge.dataset.hareket = 'acik';
        try {
          localStorage.setItem('uluCamiiHareket', 'acik');
        } catch {}
        broadcastHareket(false);
        updatePlayPauseUI(true);
      }
      evaluateAutoplay();
    });
  }

  const onHareketEvent = (e: Event) => {
    if (isDispatchingHareket) return;
    const cust = e as CustomEvent<{ duruyor?: boolean }>;
    if (cust.detail && typeof cust.detail.duruyor === 'boolean') {
      const duruyor = cust.detail.duruyor;
      userWantsPlay = !duruyor;
      isKeyboardPaused = false;
      hoverOverridden = false;
      isDialogPaused = false;
      belge.dataset.hareket = duruyor ? 'durdu' : 'acik';
      evaluateAutoplay();
    }
  };
  document.addEventListener('ulucamii:hareket', onHareketEvent);

  const hasDialogSupport = !!(
    dialog &&
    typeof HTMLDialogElement === 'function' &&
    typeof dialog.showModal === 'function'
  );

  if (hasDialogSupport && dialog) {
    afisButtons.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const url = btn.getAttribute('data-afis-url') || (btn instanceof HTMLAnchorElement ? btn.getAttribute('href') : null);
        if (!url) return;

        const slide = btn.closest('.gv-sahne__slide');
        const altText = slide?.querySelector<HTMLImageElement>('img')?.getAttribute('alt') || slide?.querySelector('.gv-baslik')?.textContent?.trim() || '';

        if (dialogImg) {
          dialogImg.src = url;
          dialogImg.alt = altText;
        }

        lastDialogTrigger = btn;
        isDialogPaused = true;
        evaluateAutoplay();
        dialog.showModal();
      });
    });

    dialog.addEventListener('close', () => {
      if (lastDialogTrigger && typeof lastDialogTrigger.focus === 'function') {
        lastDialogTrigger.focus({ preventScroll: true });
      }
      evaluateAutoplay();
    });

    dialog.addEventListener('click', (e: MouseEvent) => {
      if (e.target === dialog) {
        const rect = dialog.getBoundingClientRect();
        const inside =
          rect.top <= e.clientY &&
          e.clientY <= rect.top + rect.height &&
          rect.left <= e.clientX &&
          e.clientX <= rect.left + rect.width;
        if (!inside) dialog.close();
      }
    });

    dialog.querySelector<HTMLButtonElement>('.gv-kapat-btn')?.addEventListener('click', (e) => {
      e.preventDefault();
      dialog.close();
    });
  }

  kok.addEventListener('mouseenter', () => {
    isHovered = true;
    hoverOverridden = false;
    evaluateAutoplay();
  });

  kok.addEventListener('mouseleave', () => {
    isHovered = false;
    hoverOverridden = false;
    evaluateAutoplay();
  });

  kok.addEventListener('pointerdown', () => { isPointerActive = true; }, { capture: true });
  window.addEventListener('pointerup', () => { setTimeout(() => { isPointerActive = false; }, 0); }, { capture: true });

  kok.addEventListener('focusin', () => {
    if (isPointerActive) return;
    scheduleKeyboardFocusPause();
  });

  document.addEventListener('visibilitychange', () => {
    isDocumentHidden = document.visibilityState === 'hidden';
    evaluateAutoplay();
  });

  if (typeof IntersectionObserver === 'function') {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.target === kok) {
            isIntersecting = entry.isIntersecting;
            evaluateAutoplay();
          }
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(kok);
  }

  const onReduceChange = (e: MediaQueryListEvent) => {
    if (e.matches) {
      userWantsPlay = false;
      isKeyboardPaused = false;
      hoverOverridden = false;
      belge.dataset.hareket = 'durdu';
      try {
        if (localStorage.getItem('uluCamiiHareket') === 'acik') {
          localStorage.removeItem('uluCamiiHareket');
        }
      } catch {}
      broadcastHareket(true);
    } else {
      try {
        const stored = localStorage.getItem('uluCamiiHareket');
        if (stored === 'durdu') {
          userWantsPlay = false;
          belge.dataset.hareket = 'durdu';
          broadcastHareket(true);
        } else {
          userWantsPlay = true;
          belge.dataset.hareket = 'acik';
          broadcastHareket(false);
        }
      } catch {
        userWantsPlay = true;
        belge.dataset.hareket = 'acik';
        broadcastHareket(false);
      }
    }
    evaluateAutoplay();
  };
  azaltMedia.addEventListener('change', onReduceChange);

  window.addEventListener('pagehide', () => {
    if (autoplayPlugin.isPlaying()) {
      autoplayPlugin.stop();
    }
    stopProgressLoop(true);
  });

  window.addEventListener('pageshow', () => {
    evaluateAutoplay();
  });

  syncUI(mainApi.selectedScrollSnap());
  updatePlayPauseUI(autoplayPlugin.isPlaying());
  evaluateAutoplay();

  kok.classList.add('gv-ready');
}

// DOM hazır olduğunda başlat
function setup() {
  const containers = document.querySelectorAll<HTMLElement>('.gv-kapsayici');
  containers.forEach((kok) => initGundemVitrini(kok));
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setup);
} else {
  setup();
}
