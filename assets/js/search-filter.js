/**
 * Vile Tempest Official — Search & Dynamic Filtering Engine
 * Handles live keyword filtering, dynamic filter dropdown, infinite scrolling quick link ticker bar,
 * section visibility, initial DOM order restoration, and navigation scroll handlers.
 * (Fully Future-Proof: Automatically indexes all main-content elements)
 */
document.addEventListener("DOMContentLoaded", function () {
  const searchBtn = document.querySelector(".icon-btn[aria-label='Search']");
  const filterBtn = document.querySelector(".icon-btn[aria-label='Filter']");
  const headerContactBtn = document.querySelector(
    ".site-header .icon-btn[aria-label='Contact']",
  );
  const siteHeader = document.querySelector(".site-header");
  const mainContent = document.querySelector(".main-content");
  const headerActions = document.querySelector(".header-actions");

  // Create sticky top search bar container
  const searchBarContainer = document.createElement("div");
  searchBarContainer.className = "sticky-search-bar-wrapper hidden-content";
  searchBarContainer.innerHTML = `
    <div class="search-bar-inner">
      <div class="search-input-wrapper">
        <i class="fa-solid fa-magnifying-glass"></i>
        <input type="text" id="site-search-input" placeholder="Search current view (e.g. codm test server)..." autocomplete="off" />
        <button class="search-close-btn" aria-label="Close Search">×</button>
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

  if (siteHeader) {
    siteHeader.insertAdjacentElement("afterend", searchBarContainer);
  }
  if (mainContent) {
    mainContent.appendChild(noResultsElem);
  }

  const searchInput = searchBarContainer.querySelector("#site-search-input");
  const closeSearchBtn = searchBarContainer.querySelector(".search-close-btn");
  const filterButtons = document.querySelectorAll(".nav-filter-btn");

  // Automatically store initial pristine sequence of ALL elements inside main-content (Future-Proof)
  const initialCardOrder = mainContent ? Array.from(mainContent.children) : [];

  // ==========================================================================
  // DYNAMIC QUICK LINK TICKER BAR (Infinite Leftward Scroll)
  // ==========================================================================
  let tickerBar = null;

  function buildQuickTickerBar() {
    if (!siteHeader) return;

    tickerBar = document.createElement("div");
    tickerBar.className = "quick-ticker-bar";

    const titleElements = document.querySelectorAll(
      ".utility-title, .playlist-title, .services-title, .service-header-row h3, .intel-item-title, .contact-title, .section-main-title, .category-title",
    );

    const extractedTopics = new Set();
    titleElements.forEach((el) => {
      let text = el.textContent.trim().replace(/\|.*$/, "").trim();
      if (text.length > 0 && text.length < 45) {
        extractedTopics.add(text);
      }
    });

    const topicsArray = Array.from(extractedTopics);
    if (topicsArray.length === 0) return;

    let trackInner = "";
    const buildSet = () => {
      topicsArray.forEach((topic) => {
        trackInner += `
          <button type="button" class="ticker-chip" data-keyword="${topic}">
            <i class="fa-solid fa-bolt"></i>
            <span>${topic}</span>
          </button>
        `;
      });
    };

    buildSet();
    buildSet();

    tickerBar.innerHTML = `<div class="quick-ticker-track">${trackInner}</div>`;
    siteHeader.insertAdjacentElement("afterend", tickerBar);

    tickerBar.querySelectorAll(".ticker-chip").forEach((chip) => {
      chip.addEventListener("click", function () {
        const keyword = this.getAttribute("data-keyword");
        const homeBtn = document.querySelector(
          ".nav-filter-btn[data-filter='home']",
        );
        if (homeBtn && !homeBtn.classList.contains("active")) {
          homeBtn.click();
        } else {
          resetPageToOriginalState();
        }

        searchBarContainer.classList.add("hidden-content");
        if (searchInput) {
          searchInput.value = keyword;
          searchInput.blur();
        }
        executeSearch(keyword);
      });
    });
  }

  buildQuickTickerBar();

  // ==========================================================================
  // DYNAMIC FILTER DROPDOWN GENERATOR
  // ==========================================================================
  let filterDropdownMenu = null;

  function buildDynamicFilterDropdown() {
    if (!headerActions) return;

    filterDropdownMenu = document.createElement("div");
    filterDropdownMenu.className = "filter-dropdown-menu";

    const titleElements = document.querySelectorAll(
      ".utility-title, .playlist-title, .services-title, .service-header-row h3, .intel-item-title, .contact-title, .section-main-title, .category-title",
    );

    const extractedTopics = new Set();
    extractedTopics.add("Show All Content");

    titleElements.forEach((el) => {
      let text = el.textContent.trim().replace(/\|.*$/, "").trim();
      if (text.length > 0 && text.length < 45) {
        extractedTopics.add(text);
      }
    });

    let dropdownHtml = `
      <div class="filter-dropdown-header">Quick View Filters</div>
      <ul class="filter-dropdown-list">
    `;

    extractedTopics.forEach((topic) => {
      const isAll = topic === "Show All Content";
      dropdownHtml += `
        <li class="filter-dropdown-item ${isAll ? "active" : ""}" data-keyword="${isAll ? "" : topic}">
          <span>${topic}</span>
          <i class="fa-solid fa-check"></i>
        </li>
      `;
    });

    dropdownHtml += `</ul>`;
    filterDropdownMenu.innerHTML = dropdownHtml;
    headerActions.appendChild(filterDropdownMenu);

    filterDropdownMenu
      .querySelectorAll(".filter-dropdown-item")
      .forEach((item) => {
        item.addEventListener("click", function () {
          const keyword = this.getAttribute("data-keyword");

          filterDropdownMenu
            .querySelectorAll(".filter-dropdown-item")
            .forEach((i) => {
              i.classList.remove("active");
            });
          this.classList.add("active");

          const homeBtn = document.querySelector(
            ".nav-filter-btn[data-filter='home']",
          );
          if (homeBtn && !homeBtn.classList.contains("active")) {
            homeBtn.click();
          } else {
            resetPageToOriginalState();
          }

          if (!keyword) {
            resetPageToOriginalState();
          } else {
            searchBarContainer.classList.add("hidden-content");
            if (searchInput) {
              searchInput.value = keyword;
              searchInput.blur();
            }
            executeSearch(keyword);
          }

          filterDropdownMenu.classList.remove("active");
        });
      });
  }

  buildDynamicFilterDropdown();

  if (filterBtn) {
    filterBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      if (filterDropdownMenu) {
        filterDropdownMenu.classList.toggle("active");
      }
    });
  }

  document.addEventListener("click", function (e) {
    if (
      filterDropdownMenu &&
      filterDropdownMenu.classList.contains("active") &&
      !filterDropdownMenu.contains(e.target) &&
      !filterBtn.contains(e.target)
    ) {
      filterDropdownMenu.classList.remove("active");
    }
  });

  function openSearch() {
    searchBarContainer.classList.remove("hidden-content");
    setTimeout(() => searchInput.focus(), 50);
  }

  function resetPageToOriginalState() {
    searchBarContainer.classList.add("hidden-content");
    if (searchInput) {
      searchInput.value = "";
      searchInput.blur();
    }

    filterButtons.forEach((btn) => {
      if (btn.getAttribute("data-filter") === "home") {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    if (tickerBar) {
      tickerBar.classList.remove("hidden-content");
    }

    if (mainContent) {
      initialCardOrder.forEach((card) => {
        mainContent.appendChild(card);
      });
    }

    if (mainContent) {
      Array.from(mainContent.children).forEach((card) => {
        card.classList.remove("hidden-content");
      });
    }

    if (noResultsElem) {
      noResultsElem.classList.add("hidden-content");
    }

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

    if (!mainContent) return;
    const allCards = Array.from(mainContent.children);

    initialCardOrder.forEach((card) => {
      mainContent.appendChild(card);
    });
    if (noResultsElem) {
      mainContent.appendChild(noResultsElem);
    }

    allCards.forEach((card) => {
      card.classList.remove("hidden-content");
    });

    if (noResultsElem) {
      noResultsElem.classList.add("hidden-content");
    }

    if (filterType === "home") {
      if (tickerBar) tickerBar.classList.remove("hidden-content");
    } else {
      if (tickerBar) tickerBar.classList.add("hidden-content");
    }

    if (filterType === "utilities") {
      allCards.forEach((card) => {
        if (!card.classList.contains("utilities-section")) {
          card.classList.add("hidden-content");
        }
      });
    }
  }

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
      targetCards = mainContent ? Array.from(mainContent.children) : [];
    }

    if (keywords.length === 0) {
      applyCurrentViewFilter();
      return;
    }

    const scoredCards = targetCards.map((card) => {
      const text = card.textContent.toLowerCase();
      const titleElem = card.querySelector(
        ".utility-title, .playlist-title, .hero-title, .services-title, .contact-title, .intel-item-title, .section-main-title, .category-title",
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

    if (mainContent && noResultsElem) {
      mainContent.appendChild(noResultsElem);
    }

    if (activeMatches === 0) {
      if (noResultsElem) noResultsElem.classList.remove("hidden-content");
    } else {
      if (noResultsElem) noResultsElem.classList.add("hidden-content");

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

  function navigateToSection(targetId) {
    const homeBtn = document.querySelector(
      ".nav-filter-btn[data-filter='home']",
    );
    if (homeBtn && !homeBtn.classList.contains("active")) {
      homeBtn.click();
    } else {
      resetPageToOriginalState();
    }

    setTimeout(() => {
      const targetElem = document.getElementById(targetId);
      if (targetElem) {
        const headerOffset = 90;
        const elementPosition = targetElem.getBoundingClientRect().top;
        const offsetPosition =
          elementPosition + window.pageYOffset - headerOffset;
        window.scrollTo({ top: offsetPosition, behavior: "smooth" });
      }
    }, 50);
  }

  if (headerContactBtn) {
    headerContactBtn.addEventListener("click", function (e) {
      e.preventDefault();
      navigateToSection("contact");
    });
  }

  const bottomNavServicesBtn = document.querySelector(
    ".bottom-nav .nav-item[href='#services']",
  );
  if (bottomNavServicesBtn) {
    bottomNavServicesBtn.addEventListener("click", function (e) {
      e.preventDefault();
      navigateToSection("services");
    });
  }

  if (searchBtn) {
    searchBtn.addEventListener("click", function (e) {
      e.preventDefault();
      if (searchBarContainer.classList.contains("hidden-content")) {
        openSearch();
      } else {
        resetPageToOriginalState();
      }
    });
  }

  if (closeSearchBtn) {
    closeSearchBtn.addEventListener("click", function () {
      resetPageToOriginalState();
    });
  }

  if (searchInput) {
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
  }

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

      if (searchInput) searchInput.value = "";

      if (targetFilter === "home") {
        resetPageToOriginalState();
      } else {
        applyCurrentViewFilter();
      }

      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  const urlParams = new URLSearchParams(window.location.search);
  const sharedQuery = urlParams.get("search") || urlParams.get("q");

  if (sharedQuery) {
    openSearch();
    if (searchInput) searchInput.value = sharedQuery;
    executeSearch(sharedQuery);
  }
});
