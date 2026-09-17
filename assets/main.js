// Main application initialization & Hero Rotator
(function () {
  function initHeroRotator() {
    const textElement = document.getElementById("hero-rotator-text");
    const container = document.getElementById("hero-rotator");
    if (!textElement || !container) return;

    const phrases = [
      "Heavy Fleet & Mining Operations ERPs",
      "ZATCA Phase 2 FinTech & Billing SaaS",
      "Real-Time Telematics & Diesel Tracking",
      "Enterprise Real Estate & Vault ERPs",
      "Sub-50ms High-Throughput APIs",
      "Publishing Microservices & AI Newsrooms",
      "Full-Stack Architecture (Laravel + React.js)",
      "High-Availability Multi-Tenant Databases",
      "Redis In-Memory Caching & Queue Brokers"
    ];

    // Check for reduced motion preference
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      let currentIdx = 0;
      setInterval(() => {
        currentIdx = (currentIdx + 1) % phrases.length;
        textElement.textContent = phrases[currentIdx];
      }, 4000);
      return;
    }

    let phraseIndex = 0;
    let charIndex = phrases[0].length;
    let isDeleting = false;
    let isPaused = false;
    let timeoutId = null;

    const typeSpeed = 38;
    const deleteSpeed = 20;
    const holdDelay = 2200;
    const nextDelay = 350;

    function tick() {
      if (isPaused) {
        timeoutId = setTimeout(tick, 200);
        return;
      }

      const currentPhrase = phrases[phraseIndex];

      if (isDeleting) {
        charIndex--;
        textElement.textContent = currentPhrase.substring(0, charIndex);
        if (charIndex === 0) {
          isDeleting = false;
          phraseIndex = (phraseIndex + 1) % phrases.length;
          timeoutId = setTimeout(tick, nextDelay);
          return;
        }
        timeoutId = setTimeout(tick, deleteSpeed);
      } else {
        charIndex++;
        textElement.textContent = currentPhrase.substring(0, charIndex);
        if (charIndex === currentPhrase.length) {
          isDeleting = true;
          timeoutId = setTimeout(tick, holdDelay);
          return;
        }
        timeoutId = setTimeout(tick, typeSpeed);
      }
    }

    // Hover pauses typing so user can comfortably read
    container.addEventListener("mouseenter", () => {
      isPaused = true;
    });

    container.addEventListener("mouseleave", () => {
      isPaused = false;
    });

    // Click cycles immediately to next domain
    container.addEventListener("click", () => {
      clearTimeout(timeoutId);
      isDeleting = false;
      phraseIndex = (phraseIndex + 1) % phrases.length;
      textElement.textContent = phrases[phraseIndex];
      charIndex = phrases[phraseIndex].length;
      isDeleting = true;
      timeoutId = setTimeout(tick, holdDelay);
    });

    // Start typing cycle after initial display of the default text
    timeoutId = setTimeout(() => {
      isDeleting = true;
      tick();
    }, holdDelay);
  }

  function initApp() {
    initHeroRotator();
    if (typeof projectSlider !== "undefined" && projectSlider.init) {
      projectSlider.init();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp);
  } else {
    initApp();
  }
})();
