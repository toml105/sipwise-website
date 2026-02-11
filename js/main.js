/* ============================================
   SipWise Landing Page — Main JavaScript
   Vanilla JS, zero dependencies
   ============================================ */

(function () {
  'use strict';

  // --- Deep Link Handler ---
  function initDeepLinkHandler() {
    var path = window.location.pathname;
    var joinMatch = path.match(/^\/join\/([A-Za-z0-9]+)$/);
    var liveMatch = path.match(/^\/live\/([A-Za-z0-9]+)$/);

    if (joinMatch || liveMatch) {
      var type = joinMatch ? 'join' : 'live';
      var code = (joinMatch || liveMatch)[1];

      // Try native app scheme
      window.location.href = 'sipwise://' + type + '/' + code;

      // Fallback: after 2s, scroll to download section
      setTimeout(function () {
        var dl = document.getElementById('download');
        if (dl) dl.scrollIntoView({ behavior: 'smooth' });
      }, 2000);
    }
  }

  // --- Navbar scroll effect ---
  function initNavbar() {
    var navbar = document.getElementById('navbar');
    if (!navbar) return;

    var scrolled = false;
    function onScroll() {
      var shouldBeScrolled = window.scrollY > 80;
      if (shouldBeScrolled !== scrolled) {
        scrolled = shouldBeScrolled;
        navbar.classList.toggle('scrolled', scrolled);
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // --- Smooth scroll for nav links ---
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        var targetId = this.getAttribute('href');
        if (targetId === '#') return;
        var target = document.querySelector(targetId);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  // --- Scroll-triggered animations ---
  function initScrollAnimations() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var elements = document.querySelectorAll('[data-animate], [data-animate-stagger]');
    if (!elements.length) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px'
    });

    elements.forEach(function (el) {
      observer.observe(el);
    });
  }

  // --- Animated counters ---
  function initCounterAnimation() {
    var counters = document.querySelectorAll('[data-count]');
    if (!counters.length) return;

    var animated = false;

    function easeOutExpo(t) {
      return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    }

    function animateCounters() {
      if (animated) return;
      animated = true;

      counters.forEach(function (el) {
        var target = parseInt(el.getAttribute('data-count'), 10);
        var duration = 2000;
        var start = performance.now();

        function update(now) {
          var elapsed = now - start;
          var progress = Math.min(elapsed / duration, 1);
          var value = Math.floor(easeOutExpo(progress) * target);

          el.textContent = value.toLocaleString() + '+';

          if (progress < 1) {
            requestAnimationFrame(update);
          } else {
            el.textContent = target.toLocaleString() + '+';
          }
        }

        requestAnimationFrame(update);
      });
    }

    var statsSection = document.getElementById('stats');
    if (!statsSection) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCounters();
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });

    observer.observe(statsSection);
  }

  // --- Glass Carousel ---
  function initGlassCarousel() {
    var carousel = document.getElementById('glassCarousel');
    if (!carousel) return;

    var dots = carousel.querySelectorAll('.glass-dot');
    var current = 0;
    var total = 5;
    var autoTimer = null;
    var isTransitioning = false;

    // Glow colors per glass type
    var glowColors = [
      'radial-gradient(circle, rgba(255,179,71,0.18), rgba(45,212,191,0.08), transparent 70%)',   // pint - amber
      'radial-gradient(circle, rgba(139,0,0,0.2), rgba(255,107,157,0.08), transparent 70%)',      // wine - deep red
      'radial-gradient(circle, rgba(255,215,0,0.2), rgba(45,212,191,0.08), transparent 70%)',     // stein - gold
      'radial-gradient(circle, rgba(157,78,221,0.2), rgba(255,107,157,0.1), transparent 70%)',    // cocktail - purple
      'radial-gradient(circle, rgba(255,230,128,0.2), rgba(255,215,0,0.1), transparent 70%)'     // champagne - pale gold
    ];

    // Dashboard data per drink — simulates a live session
    var dashData = [
      { bac: '0.042', peak: '0.042', sober: '2h 15m', units: '3.2', spend: '£18.50', drinks: '4', status: 'SAFE',         statusColor: '#10B981' },  // pint
      { bac: '0.061', peak: '0.061', sober: '3h 40m', units: '4.8', spend: '£32.00', drinks: '5', status: 'MILD',         statusColor: '#FCD34D' },  // wine
      { bac: '0.085', peak: '0.089', sober: '5h 10m', units: '7.1', spend: '£28.50', drinks: '6', status: 'INTOXICATED', statusColor: '#FB923C' },  // stein
      { bac: '0.025', peak: '0.025', sober: '1h 20m', units: '1.5', spend: '£12.00', drinks: '2', status: 'SAFE',         statusColor: '#10B981' },  // cocktail
      { bac: '0.048', peak: '0.052', sober: '2h 50m', units: '3.8', spend: '£42.00', drinks: '4', status: 'MILD',         statusColor: '#FCD34D' },  // champagne
    ];

    // Dashboard DOM refs
    var bacNumber = document.getElementById('bacNumber');
    var bacStatusPill = document.getElementById('bacStatusPill');
    var bacStatusDot = bacStatusPill ? bacStatusPill.querySelector('.bac-status-dot') : null;
    var bacStatusText = bacStatusPill ? bacStatusPill.querySelector('.bac-status-text') : null;
    var dashPeak = document.getElementById('dashPeak');
    var dashSober = document.getElementById('dashSober');
    var dashUnits = document.getElementById('dashUnits');
    var dashSpend = document.getElementById('dashSpend');
    var dashDrinks = document.getElementById('dashDrinks');

    function updateDashboard(index) {
      var data = dashData[index];
      if (bacNumber) bacNumber.textContent = data.bac;
      if (bacStatusText) bacStatusText.textContent = data.status;
      if (bacStatusDot) {
        bacStatusDot.style.background = data.statusColor;
        bacStatusDot.style.boxShadow = '0 0 6px ' + data.statusColor;
      }
      if (dashPeak) dashPeak.textContent = data.peak;
      if (dashSober) dashSober.textContent = data.sober;
      if (dashUnits) dashUnits.textContent = data.units;
      if (dashSpend) dashSpend.textContent = data.spend;
      if (dashDrinks) dashDrinks.textContent = data.drinks;
    }

    var transitionTimeout = null;

    function goTo(index, force) {
      if (index === current) return;
      if (force && isTransitioning) {
        clearTimeout(transitionTimeout);
        isTransitioning = false;
      }
      if (isTransitioning) return;
      isTransitioning = true;

      // Update dots
      dots[current].classList.remove('active');
      dots[index].classList.add('active');

      // Update glow
      var glow = carousel.querySelector('.glass-carousel-glow');
      if (glow) glow.style.background = glowColors[index];

      // Update orbit labels
      var orbitLabels = carousel.querySelectorAll('.orbit-label');
      orbitLabels.forEach(function (lbl) {
        var drinkIdx = parseInt(lbl.getAttribute('data-drink'), 10);
        lbl.classList.toggle('is-active', drinkIdx === index);
      });

      // Tell Three.js to swap the glass model
      if (window.sipwiseGlass && window.sipwiseGlass.swapGlass) {
        window.sipwiseGlass.swapGlass(index);
      }

      // Update dashboard data after transition
      transitionTimeout = setTimeout(function () {
        updateDashboard(index);
        current = index;
        isTransitioning = false;
      }, 500);
    }

    function next() {
      goTo((current + 1) % total);
    }

    function startAuto() {
      stopAuto();
      autoTimer = setInterval(next, 4000);
    }

    function stopAuto() {
      if (autoTimer) {
        clearInterval(autoTimer);
        autoTimer = null;
      }
    }

    // Dot click handlers
    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        var idx = parseInt(this.getAttribute('data-index'), 10);
        stopAuto();
        goTo(idx, true);
        startAuto();
      });
    });

    // Touch swipe support
    var touchStartX = 0;
    var touchEndX = 0;

    carousel.addEventListener('touchstart', function (e) {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    carousel.addEventListener('touchend', function (e) {
      touchEndX = e.changedTouches[0].screenX;
      var diff = touchStartX - touchEndX;
      if (Math.abs(diff) > 50) {
        stopAuto();
        if (diff > 0) {
          goTo((current + 1) % total);
        } else {
          goTo((current - 1 + total) % total);
        }
        startAuto();
      }
    }, { passive: true });

    // Pause on hover
    carousel.addEventListener('mouseenter', stopAuto);
    carousel.addEventListener('mouseleave', startAuto);

    // Respect reduced motion
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      startAuto();
    }

    // Initialize dashboard for first drink
    requestAnimationFrame(function () { updateDashboard(0); });
  }

  // --- Init all ---
  function init() {
    initDeepLinkHandler();
    initNavbar();
    initSmoothScroll();
    initScrollAnimations();
    initCounterAnimation();
    initGlassCarousel();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
