/**
 * Vile Tempest Official — Search & Filtering Engine
 * Handles live keyword filtering, section visibility, initial DOM order restoration,
 * and navigation scroll handlers.
 */
document.addEventListener("DOMContentLoaded", function () {
  const searchBtn = document.querySelector(".icon-btn[aria-label='Search']");
  const siteHeader = document.querySelector(".site-header");
  const mainContent = document.querySelector(".main-content");

  // Create sticky top search bar container
  const searchBarContainer = document.createElement("div");
  searchBarContainer.className = "sticky-search-bar-wrapper hidden-content";
  searchBarContainer.innerHTML = `
    <div class="search-bar-inner">
      <div class="search-input-wrapper">
        <i class="fa-solid fa-magnifying-glass"></i>
        <input type="text" id="site-search-input" placeholder="Search current view (e.g. codm test server)..." autocomplete="off" />
        <button class="search-close-btn" aria-label="Close Search">&times;</button>
      </div>
    </div>
  `;

  // Create professional "No Results Found" message container
  const noResultsElem = document.createElement("div");
  noResultsElem.className = "search-no-results hidden-content";
  noResultsElem.innerHTML = `
    <div class="no-results-card">
      <i class="fa-solid fa-face-confused"></i>
      <h3>No Results Found</h3>
      <p>We couldn't find anything matching your search. Try checking your spelling or searching for another keyword.</p>
    </div>
  `;

  // Insert search bar right after the site header, and no-results inside main content
  if (siteHeader) {
    siteHeader.insertAdjacentElement("afterend", searchBarContainer);
  }
  if (mainContent) {
    mainContent.appendChild(noResultsElem);
  }

  const searchInput = searchBarContainer.querySelector("#site-search-input");
  const closeSearchBtn = searchBarContainer.querySelector(".search-close-btn");
  const filterButtons = document.querySelectorAll(".nav-filter-btn");

  // Store the pristine initial HTML order of cards on page load to prevent shuffling bugs
  const initialCardOrder = mainContent
    ? Array.from(
        mainContent.querySelectorAll(
          ".welcome-hero, .services-section, .contact-section, .videos-section, .utilities-section, .community-section",
        ),
      )
    : [];

  function openSearch() {
    searchBarContainer.classList.remove("hidden-content");
    setTimeout(() => searchInput.focus(), 50);
  }

  // Closes search bar AND fully restores page results back to original default sequence
  function closeAndResetSearch() {
    searchBarContainer.classList.add("hidden-content");
    searchInput.value = "";
    searchInput.blur();
    applyCurrentViewFilter();

    // Clear query parameter from URL without reloading page
    if (history.replaceState) {
      const cleanUrl =
        window.location.protocol +
        "//" +
        window.location.host +
        window.location.pathname;
      history.replaceState({ path: cleanUrl }, "", cleanUrl);
    }
  }

  function applyCurrentViewFilter() {
    const activeBtn = document.querySelector(".nav-filter-btn.active");
    const filterType = activeBtn
      ? activeBtn.getAttribute("data-filter")
      : "home";

    const heroSections = document.querySelectorAll(".welcome-hero");
    const servicesSections = document.querySelectorAll(".services-section");
    const contactSections = document.querySelectorAll(".contact-section");
    const videoSections = document.querySelectorAll(".videos-section");
    const utilitySections = document.querySelectorAll(".utilities-section");
    const communitySections = document.querySelectorAll(".community-section");

    const allCards = [
      ...heroSections,
      ...servicesSections,
      ...contactSections,
      ...videoSections,
      ...utilitySections,
      ...communitySections,
    ];

    // Restore cards to their exact original DOM sequence before showing/hiding
    if (mainContent) {
      initialCardOrder.forEach((card) => {
        mainContent.appendChild(card);
      });
      // Ensure noResultsElem stays at the very bottom
      mainContent.appendChild(noResultsElem);
    }

    allCards.forEach((card) => {
      card.classList.remove("hidden-content");
    });

    noResultsElem.classList.add("hidden-content");

    // When viewing Utilities only, hide Hero, Services, Contact, Videos, AND Community cards
    if (filterType === "utilities") {
      heroSections.forEach((el) => el.classList.add("hidden-content"));
      servicesSections.forEach((el) => el.classList.add("hidden-content"));
      contactSections.forEach((el) => el.classList.add("hidden-content"));
      videoSections.forEach((el) => el.classList.add("hidden-content"));
      communitySections.forEach((el) => el.classList.add("hidden-content"));
    }
  }

  // Core Search & Filtering Execution Function
  function executeSearch(rawQuery) {
    const keywords = rawQuery.toLowerCase().trim().split(/\s+/).filter(Boolean);

    const activeBtn = document.querySelector(".nav-filter-btn.active");
    const currentScope = activeBtn
      ? activeBtn.getAttribute("data-filter")
      : "home";

    let targetCards;
    if (currentScope === "utilities") {
      targetCards = Array.from(document.querySelectorAll(".utilities-section"));
    } else {
      targetCards = Array.from(
        document.querySelectorAll(
          ".welcome-hero, .services-section, .contact-section, .videos-section, .utilities-section, .community-section",
        ),
      );
    }

    if (keywords.length === 0) {
      applyCurrentViewFilter();
      return;
    }

    const scoredCards = targetCards.map((card) => {
      const text = card.textContent.toLowerCase();
      const titleElem = card.querySelector(
        ".utility-title, .playlist-title, .hero-title, .services-title, .contact-title",
      );
      const titleText = titleElem ? titleElem.textContent.toLowerCase() : "";

      let score = 0;
      let matchedCount = 0;

      keywords.forEach((kw) => {
        if (text.includes(kw)) {
          matchedCount++;
          if (titleText.includes(kw)) {
            score += 10;
          } else {
            score += 2;
          }
        }
      });

      return {
        card: card,
        score: score,
        matchedCount: matchedCount,
      };
    });

    scoredCards.sort((a, b) => b.score - a.score);

    let activeMatches = 0;
    let firstMatchedCard = null;

    scoredCards.forEach((item) => {
      if (item.matchedCount > 0) {
        activeMatches++;
        item.card.classList.remove("hidden-content");
        // Re-append matching cards dynamically during active search
        if (mainContent) {
          mainContent.appendChild(item.card);
        }
        if (!firstMatchedCard) {
          firstMatchedCard = item.card;
        }
      } else {
        item.card.classList.add("hidden-content");
      }
    });

    // Ensure noResultsElem remains at the end of the container
    if (mainContent && noResultsElem) {
      mainContent.appendChild(noResultsElem);
    }

    if (activeMatches === 0) {
      noResultsElem.classList.remove("hidden-content");
    } else {
      noResultsElem.classList.add("hidden-content");

      if (firstMatchedCard) {
        const headerOffset = 130;
        const elementPosition = firstMatchedCard.getBoundingClientRect().top;
        const offsetPosition =
          elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });
      }
    }
  }

  searchBtn.addEventListener("click", function (e) {
    e.preventDefault();
    if (searchBarContainer.classList.contains("hidden-content")) {
      openSearch();
    } else {
      closeAndResetSearch();
    }
  });

  closeSearchBtn.addEventListener("click", function () {
    closeAndResetSearch();
  });

  searchInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      searchBarContainer.classList.add("hidden-content");
      searchInput.blur();
    }
  });

  searchInput.addEventListener("input", function (e) {
    executeSearch(e.target.value);
  });

  // Bottom Navigation & Hero Filter Handler
  filterButtons.forEach((button) => {
    button.addEventListener("click", function (e) {
      e.preventDefault();
      const targetFilter = this.getAttribute("data-filter");

      filterButtons.forEach((btn) => {
        if (btn.getAttribute("data-filter") === targetFilter) {
          btn.classList.add("active");
        } else {
          btn.classList.remove("active");
        }
      });

      searchInput.value = "";
      applyCurrentViewFilter();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  // ==========================================
  // HEADER CONTACT BUTTON HANDLER
  // ==========================================
  const headerContactBtn = document.querySelector(
    ".site-header .icon-btn[aria-label='Contact']",
  );
  if (headerContactBtn) {
    headerContactBtn.addEventListener("click", function (e) {
      e.preventDefault();
      const homeFilterBtn = document.querySelector(
        ".nav-filter-btn[data-filter='home']",
      );
      if (homeFilterBtn && !homeFilterBtn.classList.contains("active")) {
        homeFilterBtn.click();
      }
      setTimeout(() => {
        const contactElem = document.getElementById("contact");
        if (contactElem) {
          const headerOffset = 90;
          const elementPosition = contactElem.getBoundingClientRect().top;
          const offsetPosition =
            elementPosition + window.pageYOffset - headerOffset;
          window.scrollTo({ top: offsetPosition, behavior: "smooth" });
        }
      }, 50);
    });
  }

  // ==========================================
  // BOTTOM NAV SERVICES BUTTON HANDLER
  // ==========================================
  const bottomNavServicesBtn = document.querySelector(
    ".bottom-nav .nav-item[href='#services']",
  );
  if (bottomNavServicesBtn) {
    bottomNavServicesBtn.addEventListener("click", function (e) {
      e.preventDefault();

      // 1. Keep the highlight on Home, do NOT highlight Services in bottom nav
      const allNavItems = document.querySelectorAll(".bottom-nav .nav-item");
      allNavItems.forEach((item) => item.classList.remove("active"));
      const homeNavItem = document.querySelector(
        ".bottom-nav .nav-item[aria-label='Home']",
      );
      if (homeNavItem) homeNavItem.classList.add("active");

      // 2. Switch filter button state and unhide all sections
      const homeBtn = document.querySelector(
        ".nav-filter-btn[data-filter='home']",
      );
      const utilBtn = document.querySelector(
        ".nav-filter-btn[data-filter='utilities']",
      );
      if (homeBtn && utilBtn) {
        homeBtn.classList.add("active");
        utilBtn.classList.remove("active");
      }
      const allHiddenSections = document.querySelectorAll(
        ".welcome-hero, .services-section, .contact-section, .videos-section, .community-section",
      );
      allHiddenSections.forEach((el) => el.classList.remove("hidden-content"));

      // 3. Smooth scroll directly to services section
      const servicesElem = document.getElementById("services");
      if (servicesElem) {
        const headerOffset = 90;
        const elementPosition = servicesElem.getBoundingClientRect().top;
        const offsetPosition =
          elementPosition + window.pageYOffset - headerOffset;
        window.scrollTo({ top: offsetPosition, behavior: "smooth" });
      }
    });
  }

  // ==========================================
  // URL SEARCH PARAMETER HANDLER (ON LOAD)
  // ==========================================
  const urlParams = new URLSearchParams(window.location.search);
  const sharedQuery = urlParams.get("search") || urlParams.get("q");

  if (sharedQuery) {
    openSearch();
    searchInput.value = sharedQuery;
    executeSearch(sharedQuery);
  }
});
