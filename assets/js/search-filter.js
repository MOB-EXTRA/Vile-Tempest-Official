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

  function openSearch() {
    searchBarContainer.classList.remove("hidden-content");
    setTimeout(() => searchInput.focus(), 50);
  }

  function closeSearch() {
    searchBarContainer.classList.add("hidden-content");
    searchInput.value = "";
    noResultsElem.classList.add("hidden-content");
    applyCurrentViewFilter();
  }

  function applyCurrentViewFilter() {
    const activeBtn = document.querySelector(".nav-filter-btn.active");
    const filterType = activeBtn
      ? activeBtn.getAttribute("data-filter")
      : "home";

    const heroSections = document.querySelectorAll(".welcome-hero");
    const videoSections = document.querySelectorAll(".videos-section");
    const utilitySections = document.querySelectorAll(".utilities-section");

    const allCards = [...heroSections, ...videoSections, ...utilitySections];
    allCards.forEach((card) => {
      card.classList.remove("hidden-content");
    });

    noResultsElem.classList.add("hidden-content");

    if (filterType === "utilities") {
      heroSections.forEach((el) => el.classList.add("hidden-content"));
      videoSections.forEach((el) => el.classList.add("hidden-content"));
    }
  }

  searchBtn.addEventListener("click", function (e) {
    e.preventDefault();
    if (searchBarContainer.classList.contains("hidden-content")) {
      openSearch();
    } else {
      closeSearch();
    }
  });

  closeSearchBtn.addEventListener("click", closeSearch);

  // ==========================================
  // SMART KEYWORD RANKING & NO-RESULTS ENGINE
  // ==========================================
  searchInput.addEventListener("input", function (e) {
    const rawQuery = e.target.value.toLowerCase().trim();
    const keywords = rawQuery.split(/\s+/).filter(Boolean);

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
          ".welcome-hero, .videos-section, .utilities-section",
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
        ".utility-title, .playlist-title, .hero-title",
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
    scoredCards.forEach((item) => {
      if (item.matchedCount > 0) {
        activeMatches++;
        item.card.classList.remove("hidden-content");
        if (mainContent) {
          mainContent.insertBefore(item.card, noResultsElem); // Keep cards above the no-results message
        }
      } else {
        item.card.classList.add("hidden-content");
      }
    });

    // Show or hide professional "No Results Found" message
    if (activeMatches === 0) {
      noResultsElem.classList.remove("hidden-content");
    } else {
      noResultsElem.classList.add("hidden-content");
    }
  });

  // Bottom Navigation Filter Handler
  filterButtons.forEach((button) => {
    button.addEventListener("click", function (e) {
      e.preventDefault();
      filterButtons.forEach((btn) => btn.classList.remove("active"));
      this.classList.add("active");

      searchInput.value = "";
      applyCurrentViewFilter();
    });
  });
});
