/* =============================================================
   IRIO — Main JavaScript
   ============================================================= */

(function () {
  'use strict';

  // ─── Cached DOM ────────────────────────────────────────────
  const nav         = document.getElementById('nav');
  const progress    = document.getElementById('scroll-progress');
  const hamburger   = document.getElementById('hamburger');
  const mobileNav   = document.getElementById('mobileNav');
  const recipeGrid  = document.getElementById('recipeGrid');
  const tabs        = document.querySelectorAll('.recipe-tab');
  const statNums    = document.querySelectorAll('.stat-num[data-target]');
  const mobileLinks = document.querySelectorAll('.mobile-link, .mobile-cta');

  // ─── Scroll progress bar ───────────────────────────────────
  function updateProgress() {
    const scrolled = window.scrollY;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const pct = maxScroll > 0 ? (scrolled / maxScroll) * 100 : 0;
    progress.style.width = pct + '%';
  }

  // ─── Nav background on scroll ──────────────────────────────
  function updateNav() {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }

  // ─── Scroll reveal (IntersectionObserver) ─────────────────
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target); // fire once
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );
  document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

  // ─── Animated stat counters ────────────────────────────────
  function animateCounter(el) {
    const target = parseInt(el.dataset.target, 10);
    const suffix = el.dataset.suffix || '';
    const duration = 1800;
    const startTime = performance.now();

    function step(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.floor(eased * target);
      el.textContent = value + suffix;
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );
  statNums.forEach((el) => counterObserver.observe(el));

  // ─── Recipe filter ─────────────────────────────────────────
  function filterRecipes(type) {
    const cards = recipeGrid.querySelectorAll('.recipe-card');
    let delay = 0;

    cards.forEach((card) => {
      const matches = type === 'all' || card.dataset.type === type;
      card.classList.remove('active');
      card.style.removeProperty('--ci-delay');

      if (matches) {
        card.style.setProperty('--ci-delay', delay + 's');
        // Tiny timeout lets the browser remove .active before re-adding it
        // so the animation re-fires
        setTimeout(() => card.classList.add('active'), 10);
        delay += 0.06;
      }
    });
  }

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      filterRecipes(tab.dataset.filter);
    });
  });

  // ─── Mobile menu ───────────────────────────────────────────
  hamburger.addEventListener('click', () => {
    const open = mobileNav.classList.toggle('open');
    hamburger.classList.toggle('open', open);
  });

  mobileLinks.forEach((link) => {
    link.addEventListener('click', () => {
      mobileNav.classList.remove('open');
      hamburger.classList.remove('open');
    });
  });

  // Close mobile menu on outside click
  document.addEventListener('click', (e) => {
    if (!nav.contains(e.target) && !mobileNav.contains(e.target)) {
      mobileNav.classList.remove('open');
      hamburger.classList.remove('open');
    }
  });

  // ─── Parallax on hero logo ─────────────────────────────────
  const heroLogo = document.getElementById('heroLogo');
  function updateParallax() {
    if (!heroLogo) return;
    const scrollY = window.scrollY;
    const hero    = document.getElementById('hero');
    if (!hero) return;
    const heroH = hero.offsetHeight;
    if (scrollY < heroH) {
      heroLogo.style.transform = `translateY(${scrollY * 0.18}px)`;
    }
  }

  // ─── Smooth scroll for anchor links ────────────────────────
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const offset = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h'), 10) || 70;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  // ─── Unified scroll handler ────────────────────────────────
  function onScroll() {
    updateProgress();
    updateNav();
    updateParallax();
  }

  window.addEventListener('scroll', onScroll, { passive: true });

  // ─── Full-page particles + food easter eggs ───────────────
  (function initParticles() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const canvas = document.getElementById('hero-particles');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const COLORS      = ['232,93,38', '245,200,66', '45,155,111', '255,200,140'];
    const FOOD_EMOJIS = ['🍚','🥘','🥬','🍖','🧄','🥭','🍍','🍋','🥑','🌽','🫓','🫚','🍵','🧅','🌶️'];
    const DOT_COUNT   = 90;
    const MAX_FOOD    = 8;

    let dots      = [];
    let foodItems = [];
    let raf;
    let frame = 0;

    function resize() {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    function Dot() {
      this.reset = function () {
        this.x     = Math.random() * canvas.width;
        this.y     = canvas.height + Math.random() * 100;
        this.r     = Math.random() * 1.6 + 0.4;
        this.vy    = Math.random() * 0.7 + 0.3;
        this.vx    = (Math.random() - 0.5) * 0.35;
        this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
      };
      this.reset();
      this.y = Math.random() * canvas.height; // seed across full height
    }

    function FoodItem(cx, cy) {
      this.emoji    = FOOD_EMOJIS[Math.floor(Math.random() * FOOD_EMOJIS.length)];
      this.x        = cx !== undefined ? cx : Math.random() * canvas.width;
      this.y        = cy !== undefined ? cy : canvas.height + 20;
      this.size     = Math.random() * 12 + 18;
      this.vy       = Math.random() * 0.35 + 0.12;
      this.vx       = (Math.random() - 0.5) * 0.4;
      this.wobble   = Math.random() * Math.PI * 2;
      this.wSpeed   = Math.random() * 0.025 + 0.008;
      this.wAmp     = Math.random() * 1.2 + 0.4;
      this.rot      = (Math.random() - 0.5) * 0.4;
      this.rotSpeed = (Math.random() - 0.5) * 0.006;
      this.alpha    = 0;
      this.life     = 0;
      this.maxLife  = Math.random() * 320 + 220;
    }

    function spawnFood(cx, cy) {
      if (foodItems.length >= MAX_FOOD) foodItems.shift();
      foodItems.push(new FoodItem(cx, cy));
    }

    function spawnDots() {
      dots = [];
      for (var i = 0; i < DOT_COUNT; i++) dots.push(new Dot());
    }

    function tick() {
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Passively drift in a food emoji every ~3 seconds (180 frames @ 60fps)
      if (frame % 180 === 0 && foodItems.length < MAX_FOOD) spawnFood();

      // Draw dots — position-based fade so they travel the full height
      dots.forEach(function (p) {
        p.y -= p.vy;
        p.x += p.vx;
        var fadeIn  = Math.min(1, (canvas.height - p.y) / 120);
        var fadeOut = Math.min(1, Math.max(0, p.y / 80));
        p.alpha = fadeIn * fadeOut * 0.6;
        if (p.y < -10) p.reset();
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.shadowBlur  = 7;
        ctx.shadowColor = 'rgb(' + p.color + ')';
        ctx.fillStyle   = 'rgb(' + p.color + ')';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Draw food easter eggs
      foodItems = foodItems.filter(function (f) {
        f.life++;
        f.y      -= f.vy;
        f.wobble += f.wSpeed;
        f.x      += Math.sin(f.wobble) * f.wAmp * 0.35;
        f.rot    += f.rotSpeed;
        f.alpha   = f.life < 30
          ? f.life / 30
          : f.life > f.maxLife - 40
            ? (f.maxLife - f.life) / 40
            : 1;
        ctx.save();
        ctx.globalAlpha  = f.alpha * 0.88;
        ctx.font         = f.size + 'px serif';
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.translate(f.x, f.y);
        ctx.rotate(f.rot);
        ctx.fillText(f.emoji, 0, 0);
        ctx.restore();
        return f.life < f.maxLife && f.y > -80;
      });

      raf = requestAnimationFrame(tick);
    }

    resize();
    spawnDots();
    tick();

    window.addEventListener('resize', function () {
      cancelAnimationFrame(raf);
      resize();
      spawnDots();
      tick();
    }, { passive: true });

    // Easter egg: click anywhere (not on a link/button) to pop a food emoji
    document.addEventListener('click', function (e) {
      if (e.target.closest('a, button')) return;
      spawnFood(e.clientX, e.clientY);
    });
  })();

  // ─── Init ──────────────────────────────────────────────────
  updateNav();
  updateProgress();

  // Stagger recipe card entrance on first load
  const allCards = recipeGrid.querySelectorAll('.recipe-card.active');
  allCards.forEach((card, i) => {
    card.style.setProperty('--ci-delay', i * 0.06 + 's');
  });

})();
