/* ==========================================================================
   Vile Tempest Official — Animation Engine Mapped to HTML Structure
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  /* ==========================================================================
     1. WELCOME HERO SECTION & BUTTONS (.welcome-hero)
     - Handles initial page load entrance animation states for hero action buttons.
     ========================================================================== */
  const heroActionsContainer = document.querySelector(".hero-actions");
  if (heroActionsContainer) {
    setTimeout(() => {
      heroActionsContainer.classList.add("is-visible");
      const buttons = heroActionsContainer.querySelectorAll(":scope > *");
      buttons.forEach((btn) => btn.classList.add("is-visible"));
    }, 50);
  }

  /* ==========================================================================
     2. HERO IMAGE FLOATING ICONS & SERVICES FLIGHT ENGINE (.welcome-hero to #services)
     - Clones service card icons into floating hero badges, handles responsive mobile
       scaling, and manages scroll trajectory and opacities between hero and services.
     ========================================================================== */
  const heroImageWrapper = document.querySelector(".hero-image-wrapper");
  const serviceBoxes = document.querySelectorAll(".services-grid .service-box");
  const servicesSection = document.getElementById("services");

  if (heroImageWrapper && serviceBoxes.length > 0) {
    // Create container for floating badges across viewport
    const iconsContainer = document.createElement("div");
    iconsContainer.className = "hero-image-icons-container";

    // Configuration offsets for surrounding the hero banner image
    const badgeData = [
      { baseOffsetX: -140, baseOffsetY: -120, color: "#38bdf8" }, // Web Dev
      { baseOffsetX: 130, baseOffsetY: -140, color: "#ffffff" }, // C++
      { baseOffsetX: -180, baseOffsetY: 10, color: "#38bdf8" }, // Flowcharts
      { baseOffsetX: 160, baseOffsetY: 30, color: "#22c55e" }, // Excel VBA
      { baseOffsetX: -100, baseOffsetY: 140, color: "#f59e0b" }, // SketchUp
      { baseOffsetX: 110, baseOffsetY: 160, color: "#a855f7" }, // AutoCAD
    ];

    const flightBadges = [];

    // Build floating badge clones from service card icons
    serviceBoxes.forEach((box, index) => {
      const realIconWrapper = box.querySelector(".service-icon-wrapper");
      if (!realIconWrapper) return;

      const iconElem = realIconWrapper.querySelector("i");
      if (!iconElem) return;

      // Assign an ID to each service card if it doesn't already have one
      if (!box.id) {
        box.id = `service-card-${index + 1}`;
      }

      const badge = document.createElement("div");
      badge.className = "hero-floating-badge is-hovering";
      const data = badgeData[index % badgeData.length];
      badge.style.color = data.color;
      badge.style.cursor = "pointer";
      badge.style.pointerEvents = "auto"; // Enables click events on individual badges

      const clonedIcon = iconElem.cloneNode(true);
      badge.appendChild(clonedIcon);
      iconsContainer.appendChild(badge);

      // --- SMOOTH AUTO-SCROLL CLICK LISTENER ---
      badge.addEventListener("click", () => {
        box.scrollIntoView({
          behavior: "smooth",
          block: "center", // Centers the service card cleanly in the viewport
        });
      });

      flightBadges.push({
        element: badge,
        realIcon: realIconWrapper,
        baseOffsetX: data.baseOffsetX,
        baseOffsetY: data.baseOffsetY,
      });
    });

    document.body.appendChild(iconsContainer);

    // Scroll calculation loop for icon positioning and hand-off opacity
    function updateIconsFlight() {
      if (!heroImageWrapper || !servicesSection || !iconsContainer) return;

      const servicesRect = servicesSection.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Check if the services section or hero section has been hidden/filtered out of view
      const servicesBoxHidden =
        servicesRect.width === 0 && servicesRect.height === 0;
      const heroRect = heroImageWrapper.getBoundingClientRect();
      const heroHidden = heroRect.width === 0 && heroRect.height === 0;

      // Forcefully hide floating container if scrolled past, filtered out, or on non-home views
      if (servicesRect.bottom < 0 || servicesBoxHidden || heroHidden) {
        iconsContainer.style.display = "none";
        return;
      } else {
        iconsContainer.style.display = "block";
      }

      const heroCenterX = heroRect.left + heroRect.width / 2;
      const heroCenterY = heroRect.top + heroRect.height / 2;

      // Check for mobile layout breakpoints to prevent off-screen floating
      const isMobile = window.innerWidth < 768;
      const mobileScale = isMobile ? 0.55 : 1.0;

      // Calculate scroll progress from Hero Image down to Services section
      let progress = (windowHeight - servicesRect.top) / (windowHeight * 0.7);
      progress = Math.max(0, Math.min(1, progress));
      const eased = 1 - Math.pow(1 - progress, 3); // Smooth cubic ease-out curve

      flightBadges.forEach(
        ({ element, realIcon, baseOffsetX, baseOffsetY }) => {
          // 1. Starting Hero Hover Position (Adjusted for mobile scale)
          const startX = heroCenterX + baseOffsetX * mobileScale - 20;
          const startY = heroCenterY + baseOffsetY * mobileScale - 20;

          // 2. Target Service Card Icon Position (Dynamic screen coordinates)
          const targetRect = realIcon.getBoundingClientRect();
          const targetX = targetRect.left;
          const targetY = targetRect.top;

          // 3. Interpolate position from hero hover spot directly to card destination
          const currentX = startX + (targetX - startX) * eased;
          const currentY = startY + (targetY - startY) * eased;

          // 4. Strict Clone Fade-out (Disappears cleanly right as it arrives)
          let cloneOpacity = 1;
          if (progress > 0.85) {
            cloneOpacity = 1 - (progress - 0.85) / 0.15;
          }
          cloneOpacity = Math.max(0, Math.min(1, cloneOpacity));

          element.style.left = `${currentX}px`;
          element.style.top = `${currentY}px`;
          element.style.opacity = cloneOpacity;

          if (cloneOpacity <= 0.001) {
            element.style.visibility = "hidden";
          } else {
            element.style.visibility = "visible";
          }

          // 5. Strict Original Icon Hand-off: Stays completely 0 opacity UNTIL clone is 100% invisible
          let realIconOpacity = 0;
          if (progress >= 1.0 || cloneOpacity <= 0.001) {
            realIconOpacity = 1;
          }
          realIcon.style.opacity = realIconOpacity;
        },
      );
    }

    // Attach optimized passive scroll and resize listeners
    window.addEventListener(
      "scroll",
      () => {
        window.requestAnimationFrame(updateIconsFlight);
      },
      { passive: true },
    );

    window.addEventListener("resize", updateIconsFlight);

    // Also listen for filter button clicks, ticker clicks, and search input events to hide icons instantly
    document
      .querySelectorAll(
        ".nav-filter-btn, .ticker-chip, .filter-dropdown-item, .icon-btn[aria-label='Search']",
      )
      .forEach((trigger) => {
        trigger.addEventListener("click", () => {
          setTimeout(updateIconsFlight, 50);
        });
      });

    const searchInputElem = document.getElementById("site-search-input");
    if (searchInputElem) {
      searchInputElem.addEventListener("input", () => {
        iconsContainer.style.display = "none";
      });
    }

    // Initial positioning run on load
    updateIconsFlight();
  }

  /* ==========================================================================
     3. GENERAL SECTIONS & UTILITIES SCROLL ANIMATION OBSERVER SETUP
     - Automatically flags remaining sections (#contact, #utilities, .community-intel-section)
       to animate in smoothly as the user scrolls down the document.
     ========================================================================== */
  const targetSelectors = [
    ".welcome-hero .hero-content",
    ".welcome-hero .hero-image-wrapper",
    ".services-section",
    ".service-box",
    ".utilities-section",
    ".reviews-section",
    ".contact-section",
    ".community-intel-section",
  ];

  targetSelectors.forEach((selector) => {
    const elements = document.querySelectorAll(selector);
    elements.forEach((el, itemIndex) => {
      if (!el.classList.contains("animate-on-scroll")) {
        el.classList.add("animate-on-scroll");

        // Stagger entrance delays for grid items
        if (selector === ".service-box" || selector === ".utilities-section") {
          const delayClass = `delay-${((itemIndex % 3) + 1) * 100}`;
          el.classList.add(delayClass);
        }
      }
    });
  });

  /* ==========================================================================
     4. INTERSECTION OBSERVER INITIALIZATION
     - Triggers visibility classes and initiates review counters upon scroll.
     ========================================================================== */
  const observerOptions = {
    root: null,
    rootMargin: "0px 0px -40px 0px",
    threshold: 0.15,
  };

  const scrollObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        if (
          entry.target.classList.contains("play-store-summary-card") ||
          entry.target.contains(summaryCard)
        ) {
          runReviewAnimations();
        }
      } else {
        entry.target.classList.remove("is-visible");
        if (
          entry.target.classList.contains("play-store-summary-card") ||
          entry.target.contains(summaryCard)
        ) {
          resetReviewAnimations();
        }
      }
    });
  }, observerOptions);

  const animatedElements = document.querySelectorAll(
    ".animate-on-scroll, .animate-fade-left, .animate-fade-right, .animate-scale-up, .play-store-summary-card",
  );

  animatedElements.forEach((el) => {
    scrollObserver.observe(el);
  });

  /* ==========================================================================
     5. COMMUNITY REVIEWS & FEEDBACK SECTION (#reviews)
     - Manages counter increments and bar graph fills when the review summary card enters viewport.
     ========================================================================== */
  const summaryCard = document.querySelector(".play-store-summary-card");

  function runReviewAnimations() {
    const totalReviewsElem = document.getElementById(
      "play-store-total-reviews",
    );
    if (!totalReviewsElem) return;

    const targetCount = parseInt(
      totalReviewsElem.dataset.targetCount || "0",
      10,
    );

    let currentCount = 0;
    const duration = 3000;
    const stepTime = Math.max(Math.floor(duration / (targetCount || 1)), 20);

    const counterInterval = setInterval(() => {
      currentCount++;
      if (currentCount >= targetCount) {
        currentCount = targetCount;
        clearInterval(counterInterval);
      }
      totalReviewsElem.textContent = `${currentCount} review${
        currentCount === 1 ? "" : "s"
      }`;
    }, stepTime);

    for (let i = 1; i <= 5; i++) {
      const bar = document.getElementById(`bar-${i}`);
      if (bar) {
        const targetWidth = bar.dataset.targetWidth || "0";
        setTimeout(() => {
          bar.style.width = `${targetWidth}%`;
        }, 100);
      }
    }
  }

  function resetReviewAnimations() {
    const totalReviewsElem = document.getElementById(
      "play-store-total-reviews",
    );
    if (totalReviewsElem) {
      totalReviewsElem.textContent = "0 reviews";
    }
    for (let i = 1; i <= 5; i++) {
      const bar = document.getElementById(`bar-${i}`);
      if (bar) {
        bar.style.width = "0%";
      }
    }
  }

  /* ==========================================================================
     6. REUSABLE MULTI-PHRASE ROTATING TYPEWRITER ENGINE
     - Scans for any element with class ".js-typewriter" and rotates through 
       phrases defined inside hidden ".typing-phrases-source" elements.
     ========================================================================== */
  function initTypewriter(container) {
    const sourceContainer = container.querySelector(".typing-phrases-source");
    if (!sourceContainer) return;

    // Extract phrases from hidden child span elements
    const phrases = Array.from(sourceContainer.querySelectorAll("span"))
      .map((el) => el.textContent.trim())
      .filter((text) => text.length > 0);

    if (phrases.length === 0) return;

    // Preserve layout height to prevent layout shifts
    container.style.minHeight = "1.5em";
    container.style.display = "block";

    // Inject active typing elements (while hiding the source)
    const textSpan = document.createElement("span");
    textSpan.className = "js-typing-text";

    const cursorSpan = document.createElement("span");
    cursorSpan.className = "js-typing-cursor";
    cursorSpan.textContent = "|";
    cursorSpan.style.color = "#38bdf8";
    cursorSpan.style.fontWeight = "700";
    cursorSpan.style.marginLeft = "2px";
    cursorSpan.style.display = "inline-block";

    // Hide original source list and append active text/cursor
    sourceContainer.style.display = "none";
    container.appendChild(textSpan);
    container.appendChild(cursorSpan);

    // Blinking cursor loop
    setInterval(() => {
      cursorSpan.style.opacity = cursorSpan.style.opacity === "0" ? "1" : "0";
    }, 400);

    let phraseIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    function step() {
      const currentPhrase = phrases[phraseIndex];

      if (!isDeleting) {
        // Typing forward
        textSpan.textContent = currentPhrase.substring(0, charIndex + 1);
        charIndex++;

        if (charIndex === currentPhrase.length) {
          isDeleting = true;
          setTimeout(step, 2500); // Pause fully typed
          return;
        }
        setTimeout(step, 65); // Typing speed
      } else {
        // Backspacing backward
        textSpan.textContent = currentPhrase.substring(0, charIndex - 1);
        charIndex--;

        if (charIndex === 0) {
          isDeleting = false;
          phraseIndex = (phraseIndex + 1) % phrases.length;
          setTimeout(step, 500); // Pause empty before next phrase
          return;
        }
        setTimeout(step, 35); // Deleting speed
      }
    }

    step();
  }

  // Initialize all typewriter instances on the page
  document.querySelectorAll(".js-typewriter").forEach(initTypewriter);
});
