/**
 * Aime SERGE MUSERUKA | Portfolio
 *
 *  0. Helpers (play, splitText)
 *  1. Mobile menu
 *  2. Nav: scroll progress, shadow, hide on scroll down
 *  3. Highlight the current section in the nav
 *  4. Hero intro (letters, photo, logo glow) + typing effect + photo per role
 *  5. Scroll animations (reveal, headings, skill bars)
 *  6. Photo tilt that follows the mouse
 *  7. Portfolio lightbox
 *  8. Start everything
 */
(() => {
  'use strict';

  /* =========================================================
     0. HELPERS
     ========================================================= */
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const root = document.documentElement;
  const motionOK = root.classList.contains('anim'); // set in <head> unless "reduced motion"
  const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';    // fast start, soft landing

  /**
   * Animate one element with the Web Animations API.
   * - fill: 'backwards' holds the first keyframe during the delay (no flash).
   * - Elements start hidden in CSS, so we also write the final opacity
   *   (and anything listed in `keep`) to the element, so it stays visible.
   */
  function play(el, keyframes, { delay = 0, duration = 900, easing = EASE, keep = [], iterations = 1 } = {}) {
    const last = keyframes[keyframes.length - 1];
    ['opacity', ...keep].forEach((prop) => {
      if (prop in last) el.style[prop] = last[prop];
    });
    return el.animate(keyframes, { delay, duration, easing, iterations, fill: 'backwards' });
  }

  /**
   * Split an element's text into words and letters so each piece can be animated.
   * by: 'chars' -> every letter is a <span class="char">
   * by: 'words' -> every word is wrapped in a mask: <span class="word"><span class="word__inner">
   * Keeps nested tags (like the orange <span class="accent">) and adds an aria-label
   * so screen readers still read the heading normally.
   */
  function splitText(el, { by = 'chars' } = {}) {
    el.setAttribute('aria-label', el.textContent.trim().replace(/\s+/g, ' '));
    const pieces = [];

    const walk = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === Node.ELEMENT_NODE) {
          walk(child);
          return;
        }
        if (child.nodeType !== Node.TEXT_NODE) return;

        const fragment = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach((token) => {
          if (!token) return;
          if (/^\s+$/.test(token)) {
            fragment.append(' ');
            return;
          }

          const word = document.createElement('span');
          word.className = 'word';
          word.setAttribute('aria-hidden', 'true');

          if (by === 'chars') {
            [...token].forEach((letter) => {
              const char = document.createElement('span');
              char.className = 'char';
              char.textContent = letter;
              word.append(char);
              pieces.push(char);
            });
          } else {
            const inner = document.createElement('span');
            inner.className = 'word__inner';
            inner.textContent = token;
            word.append(inner);
            pieces.push(inner);
          }
          fragment.append(word);
        });
        child.replaceWith(fragment);
      });
    };

    walk(el);
    return pieces;
  }

  /* =========================================================
     1. MOBILE MENU
     ========================================================= */
  const toggle = $('.nav__toggle');
  const menu = $('#menu');

  function setMenu(open) {
    menu.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }

  function initMenu() {
    toggle.addEventListener('click', () => {
      setMenu(toggle.getAttribute('aria-expanded') !== 'true');
    });
    $$('a', menu).forEach((link) => link.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') setMenu(false);
    });
  }

  /* =========================================================
     2. NAV: progress bar, shadow, hide on scroll down
     ========================================================= */
  function initScrollEffects() {
    const nav = $('.nav');
    const bar = $('.progress');
    let lastY = window.scrollY;
    let ticking = false;

    const update = () => {
      const y = window.scrollY;
      const max = root.scrollHeight - window.innerHeight;

      bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
      nav.classList.toggle('nav--scrolled', y > 10);

      const goingDown = y > lastY + 6;
      const goingUp = y < lastY - 6;
      const menuOpen = menu.classList.contains('is-open');

      if (goingDown && y > 240 && !menuOpen) nav.classList.add('nav--hidden');
      if (goingUp || y < 240) nav.classList.remove('nav--hidden');

      if (goingDown || goingUp) lastY = y;
      ticking = false;
    };

    // requestAnimationFrame: run at most once per screen refresh (smooth and cheap)
    window.addEventListener('scroll', () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }, { passive: true });

    // Keyboard users: never leave focus on a hidden nav
    nav.addEventListener('focusin', () => nav.classList.remove('nav--hidden'));
    update();
  }

  /* =========================================================
     3. HIGHLIGHT THE CURRENT SECTION
     ========================================================= */
  function initActiveLink() {
    const links = $$('.nav__links a');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((link) => {
          link.classList.toggle('is-active', link.getAttribute('href') === `#${entry.target.id}`);
        });
      });
    }, { rootMargin: '-40% 0px -55% 0px' });

    $$('main section[id]').forEach((section) => observer.observe(section));
  }

  /* =========================================================
     4. HERO INTRO + TYPING EFFECT
     ========================================================= */
  async function runIntro() {
    // Wait for the web font so the letters don't jump when it loads
    await Promise.race([document.fonts.ready, sleep(1500)]);

    const rise = (distance = 28) => [
      { opacity: 0, transform: `translateY(${distance}px)` },
      { opacity: 1, transform: 'none' },
    ];

    // Nav slides down
    play($('.nav'), [
      { opacity: 0, transform: 'translateY(-100%)' },
      { opacity: 1, transform: 'none' },
    ], { duration: 800 });

    // Logo: two soft orange pulses right after the nav arrives
    const glow = (blur1, blur2, alpha) =>
      `drop-shadow(0 0 ${blur1}px rgba(242, 104, 60, ${alpha})) drop-shadow(0 0 ${blur2}px rgba(242, 104, 60, ${alpha * 0.65}))`;
    play($('.nav__logo'), [
      { filter: glow(0, 0, 0) },
      { filter: glow(12, 34, 1) },
      { filter: glow(0, 0, 0) },
    ], { delay: 800, duration: 1800, easing: 'ease-in-out', iterations: 2 });

    // Photo: glow fades in, arch is "unveiled" from the bottom, image zooms out
    play($('.hero__glow'), [{ opacity: 0 }, { opacity: 0.3 }], { delay: 100, duration: 1400 });

    play($('.hero__frame'), [
      { opacity: 1, clipPath: 'inset(100% 0 0 0)' },
      { opacity: 1, clipPath: 'inset(0 0 0 0)' },
    ], { delay: 150, duration: 1300, easing: 'cubic-bezier(0.77, 0, 0.18, 1)' });

    play($('.hero__frame img'), [
      { transform: 'scale(1.35)' },
      { transform: 'scale(1)' },
    ], { delay: 150, duration: 1800 });

    // Orange outline slides out from behind the photo
    const outline = $('.hero__outline');
    const offset = getComputedStyle($('.hero__photo')).getPropertyValue('--off').trim() || '24px';
    play(outline, [
      { opacity: 0, transform: 'translate(0, 0)' },
      { opacity: 1, transform: `translate(${offset}, ${offset})` },
    ], { delay: 900, duration: 900 });

    // H1: split into letters, each one fades, rises and un-blurs in turn
    const h1 = $('.hero h1');
    const letters = splitText(h1, { by: 'chars' });
    h1.style.opacity = '1';
    const step = Math.min(45, 1100 / letters.length);   // long headline -> faster letters
    letters.forEach((letter, i) => {
      play(letter, [
        { opacity: 0, transform: 'translateY(0.7em) rotate(8deg)', filter: 'blur(10px)' },
        { opacity: 1, transform: 'none', filter: 'blur(0px)' },
      ], { delay: 350 + i * step, duration: 900 });
    });

    // The rest of the hero follows once the headline is nearly done
    const next = 350 + letters.length * step + 250;
    play($('.hero h2'), rise(), { delay: next });
    play($('.hero p'), rise(), { delay: next + 150 });
    $$('.hero__buttons .btn').forEach((btn, i) => play(btn, rise(), { delay: next + 300 + i * 120 }));
    play($('.social'), rise(20), { delay: next + 550 });
    play($('.badge'), [
      { opacity: 0, transform: 'scale(0.6) translateY(20px)' },
      { opacity: 1, transform: 'none' },
    ], { delay: next + 700, duration: 800, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' });

    await sleep(next + 1500);
  }

  // Load AND decode a photo ahead of time, so showing it later is instant.
  // If the file is missing, tell us in the console instead of failing silently.
  async function probeImage(src) {
    if (!src) return null;
    const img = new Image();
    img.src = src;
    try {
      await img.decode();
      return src;
    } catch {
      console.warn(`Photo not found or broken: ${src}`);
      return null;
    }
  }

  // Swap the hero photo right now, with a quick 0.3s fade-in
  let currentPhoto = null;

  function swapPhoto(src, roleName) {
    const img = $('.hero__frame img');
    if (!src || src === currentPhoto) return;

    img.src = src;
    img.alt = `Portrait of Aime SERGE MUSERUKA, ${roleName}`;
    currentPhoto = src;

    img.animate(
      [{ opacity: 0.4, transform: 'scale(1.05)' }, { opacity: 1, transform: 'scale(1)' }],
      { duration: 300, easing: EASE }
    );
  }

  // The five lines have different lengths (some wrap to two lines on small screens).
  // Measure them all and keep the tallest height, so the page never jumps while typing.
  function reserveRoleHeight(el, roles) {
    const heading = el.closest('h2');
    const measure = () => {
      const shown = el.textContent;
      heading.style.minHeight = '';
      let tallest = 0;
      roles.forEach((role) => {
        el.textContent = role;
        tallest = Math.max(tallest, heading.offsetHeight);
      });
      el.textContent = shown;
      heading.style.minHeight = `${tallest}px`;
    };

    let timer;
    measure();
    window.addEventListener('resize', () => {
      clearTimeout(timer);
      timer = setTimeout(measure, 200);
    });
  }

  // Types each role. The photo changes to match. Clicking the photo jumps to the next role at once.
  async function typeRoles() {
    const el = $('.typed');
    const roles = el.dataset.roles.split('|');
    const files = (el.dataset.photos || '').split('|');

    reserveRoleHeight(el, roles);
    currentPhoto = $('.hero__frame img').getAttribute('src');
    const found = await Promise.all(files.map(probeImage));
    const photoFor = (i) => found[i] || currentPhoto; // missing file -> keep the current photo

    let index = 0;
    let run = 0;          // a click starts a new "run" and cancels the old typing
    let lastChange = 0;

    // Typing version (used by the automatic cycle)
    async function typeTo(next) {
      const myRun = ++run;
      index = next;
      swapPhoto(photoFor(next), roles[next]);

      while (el.textContent.length > 0) {
        if (myRun !== run) return;
        el.textContent = el.textContent.slice(0, -1);
        await sleep(25);
      }
      for (const letter of roles[next]) {
        if (myRun !== run) return;
        el.textContent += letter;
        await sleep(45);
      }
    }

    // Instant version (used when you click)
    function jumpTo(next) {
      run++;
      index = next;
      lastChange = Date.now();
      el.textContent = roles[next];
      swapPhoto(photoFor(next), roles[next]);
    }

    $('.hero__photo').addEventListener('click', () => {
      jumpTo((index + 1) % roles.length);
    });

    while (true) {
      await sleep(2600);
      while (document.hidden) await sleep(500); // pause while the tab is in the background
      if (Date.now() - lastChange < 2600) continue; // just clicked, give it time
      await typeTo((index + 1) % roles.length);
    }
  }

  // Logo glows on hover and focus (CSS). On touch screens it also pulses when tapped.
  function initLogoGlow() {
    const logo = $('.nav__logo');
    logo.addEventListener('pointerdown', (event) => {
      if (event.pointerType === 'mouse') return;
      logo.classList.add('is-glowing');
      setTimeout(() => logo.classList.remove('is-glowing'), 800);
    });
  }

  /* =========================================================
     5. SCROLL ANIMATIONS
     ========================================================= */
  function initReveal() {
    const observer = new IntersectionObserver((entries) => {
      // Items that appear together get a small stagger
      entries.filter((e) => e.isIntersecting).forEach((entry, i) => {
        play(entry.target, [
          { opacity: 0, transform: 'translateY(32px)' },
          { opacity: 1, transform: 'none' },
        ], { delay: i * 110 });
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -5% 0px' });

    $$('.reveal').forEach((el) => observer.observe(el));
  }

  function initTitles() {
    const words = new WeakMap();
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        words.get(entry.target).forEach((word, i) => {
          play(word, [
            { transform: 'translateY(115%)' },
            { transform: 'translateY(0)' },
          ], { delay: i * 90, keep: ['transform'] });
        });
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.6 });

    $$('.section__title').forEach((title) => {
      words.set(title, splitText(title, { by: 'words' }));
      observer.observe(title);
    });
  }

  // Shows 0% -> 80% in step with the bar. getComputedTiming().progress is the
  // animation's real progress (after easing), so the number always matches the bar.
  function countUp(label, target, animation) {
    const tick = () => {
      if (animation.playState === 'finished') {
        label.textContent = `${target}%`;
        return;
      }
      const progress = animation.effect.getComputedTiming().progress ?? 0;
      label.textContent = `${Math.round(target * progress)}%`;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  function initSkills() {
    const group = $('.skills');
    $$('.skill__value', group).forEach((label) => { label.textContent = '0%'; });

    const observer = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) return;
      $$('.skill', group).forEach((skill, i) => {
        const bar = $('.bar span', skill);
        const label = $('.skill__value', skill);
        const level = bar.style.getPropertyValue('--level').trim();   // e.g. "80%"

        const animation = play(bar, [{ width: '0%' }, { width: level }], {
          delay: i * 120, duration: 1400, keep: ['width'],
        });
        countUp(label, parseInt(level, 10), animation);
      });
      observer.disconnect();
    }, { threshold: 0.3 });

    observer.observe(group);
  }

  /* =========================================================
     6. PHOTO TILT (mouse only, not on touch screens)
     ========================================================= */
  function initTilt() {
    const photo = $('.hero__photo');
    const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!canHover || !motionOK) return;

    const MAX_DEGREES = 6;
    let frame;

    photo.addEventListener('pointermove', (event) => {
      const box = photo.getBoundingClientRect();
      const x = (event.clientX - box.left) / box.width - 0.5;   // -0.5 to 0.5
      const y = (event.clientY - box.top) / box.height - 0.5;

      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        photo.style.setProperty('--ry', `${x * MAX_DEGREES * 2}deg`);
        photo.style.setProperty('--rx', `${-y * MAX_DEGREES * 2}deg`);
        photo.style.setProperty('--mx', x);
        photo.style.setProperty('--my', y);
      });
    });

    photo.addEventListener('pointerleave', () => {
      ['--rx', '--ry', '--mx', '--my'].forEach((prop) => photo.style.removeProperty(prop));
    });
  }

  /* =========================================================
     7. PORTFOLIO LIGHTBOX
     ========================================================= */
  function initLightbox() {
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.innerHTML = `
      <div class="lightbox__content">
        <button class="lightbox__close" aria-label="Close lightbox">&times;</button>
        <img src="" alt="Enlarged portfolio view">
        <p class="lightbox__caption"></p>
      </div>
    `;
    document.body.appendChild(lightbox);

    Object.assign(lightbox.style, {
      position: 'fixed',
      inset: '0',
      background: 'rgba(3, 13, 24, 0.9)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '1000',
      opacity: '0',
      visibility: 'hidden',
      transition: 'opacity 0.4s ease, visibility 0.4s ease',
    });

    const imgBox = $('img', lightbox);
    const captionBox = $('.lightbox__caption', lightbox);
    const closeBtn = $('.lightbox__close', lightbox);

    // Make every project card clickable
    $$('.project').forEach((project) => {
      project.style.cursor = 'pointer';
      project.addEventListener('click', (e) => {
        e.preventDefault();
        const imgDiv = $('[class*="project__img"]', project);
        const title = $('h3', project).textContent;
        const desc = $('p', project).textContent;
        if (!imgDiv) return;

        // Pull the URL out of: url("photo.jpg")
        const bgImage = window.getComputedStyle(imgDiv).backgroundImage;
        const urlMatch = bgImage.match(/url\(["']?(.*?)["']?\)/);

        if (urlMatch && urlMatch[1]) {
          imgBox.src = urlMatch[1];
          captionBox.innerHTML = `<strong>${title}</strong> — ${desc}`;
          lightbox.style.opacity = '1';
          lightbox.style.visibility = 'visible';
        }
      });
    });

    const closeLightbox = () => {
      lightbox.style.opacity = '0';
      lightbox.style.visibility = 'hidden';
    };

    closeBtn.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeLightbox();
    });
  }

  /* =========================================================
     8. START
     ========================================================= */
  $('#year').textContent = new Date().getFullYear();

  initMenu();
  initLogoGlow();
  initScrollEffects();
  initActiveLink();
  initLightbox();

  if (motionOK) {
    initReveal();
    initTitles();
    initSkills();
    initTilt();

    runIntro()
      .then(typeRoles)
      .catch((error) => {
        // If anything fails, show the page normally instead of leaving it hidden
        console.error(error);
        root.classList.remove('anim');
      });
  }
})();