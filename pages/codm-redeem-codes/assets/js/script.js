document.addEventListener("DOMContentLoaded", () => {
  // =================================================================
  // 1. CONFIGURATIONS & REPOSITORIES FALLBACK ARRAY
  // =================================================================
  const repoConfigs = [
    { url: "https://mob-extra.github.io/MOBEXTRA.github.shared-data-repo.1/codm-redeem-code/redeem-codes.js", name: "Repository 1" },
    { url: "https://mob-extra.github.io/MOBEXTRA.github.shared-data-repo.2/codm-redeem-code/redeem-codes.js", name: "Repository 2" },
    { url: "https://mob-extra.github.io/MOBEXTRA.github.shared-data-repo.3/codm-redeem-code/redeem-codes.js", name: "Repository 3" }
  ];

  let currentIndex = 0;
  let activeRepoName = repoConfigs[0].name;

  // =================================================================
  // 2. DOM ELEMENT REFERENCES
  // =================================================================
  const toastEl = document.getElementById('toast');
  const tableBody = document.getElementById('codesTableBody');
  const searchInput = document.getElementById('codeInputSearch');
  const clearSearchBtn = document.getElementById('clearSearchBtn'); 
  const versionFilterSelect = document.getElementById('versionFilter');
  const rowsSelect = document.getElementById('rowsPerPage');
  const pageInfo = document.getElementById('pageInfo');
  const prevBtn = document.getElementById('prevPageBtn');
  const nextBtn = document.getElementById('nextPageBtn');
  const lastUpdatedEl = document.getElementById('last-updated-date');
  const dynamicHeadingDateEl = document.getElementById('dynamicHeadingDate');
  const pageSeoTitleEl = document.getElementById('page-seo-title');

  const appCard = document.querySelector('.app-card');
  let repoSourceContainer = document.getElementById('repoSourceContainer');
  if (!repoSourceContainer && appCard) {
    repoSourceContainer = document.createElement('div');
    repoSourceContainer.id = 'repoSourceContainer';
    const paginationWrapper = document.querySelector('.pagination-wrapper');
    if (paginationWrapper && paginationWrapper.parentNode) {
      paginationWrapper.parentNode.insertBefore(repoSourceContainer, paginationWrapper.nextSibling);
    } else {
      appCard.appendChild(repoSourceContainer);
    }
  }

  let parsedCodes = [];
  let filteredCodes = [];
  let currentPage = 1;
  let rowsPerPage = 30;

  // =================================================================
  // 3. FALLBACK DATA LOADER
  // =================================================================
  function loadSharedConfigWithFallback() {
    if (currentIndex >= repoConfigs.length) {
      console.error("Critical Error: All redeem code repositories failed.");
      if (tableBody) {
        tableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 2rem; color: #e74c3c;">
          <p style="font-weight: bold; font-size: 0.95rem; margin-bottom: 0.5rem;">All config sources failed!</p>
          <p style="color: var(--text-secondary); font-size: 0.82rem; margin-bottom: 1rem;">Please contact the site admin via YouTube to report this issue.</p>
          <a href="https://www.youtube.com/channel/UCbDtYZS08VvB6luAcyn08bQ" target="_blank" rel="noopener noreferrer" style="color: #fff; background: #FF0000; padding: 6px 12px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 0.78rem; display: inline-block;">
            Contact via YouTube
          </a>
        </td></tr>`;
      }
      return;
    }

    const currentRepo = repoConfigs[currentIndex];
    const script = document.createElement("script");
    script.src = currentRepo.url;
    script.async = true;

    script.onload = function() {
      activeRepoName = currentRepo.name;
      if (typeof redeemCodesData !== "undefined") {
        parsedCodes = parseRedeemCodesData(redeemCodesData);
        updateDynamicHeaders(parsedCodes);
        applyFilters();
        renderRepoSourceInfo();
      } else {
        currentIndex++;
        loadSharedConfigWithFallback();
      }
    };

    script.onerror = function() {
      currentIndex++;
      loadSharedConfigWithFallback();
    };

    document.head.appendChild(script);
  }

  function renderRepoSourceInfo() {
    if (!repoSourceContainer) return;
    repoSourceContainer.innerHTML = `
      <div class="meta-row" style="margin-top: 16px; border-top: 1px solid var(--border-color); padding-top: 12px; display: flex; align-items: center; justify-content: space-between; font-size: 0.78rem;">
        <p style="margin: 0; color: var(--text-secondary);"><strong>Repo Source:</strong> <span style="color: var(--accent-cyan); font-weight: 700;">${activeRepoName}</span></p>
        <span style="font-size: 0.7rem; color: var(--text-secondary); background: rgba(255,255,255,0.03); padding: 2px 6px; border-radius: 4px; border: 1px solid var(--border-color);">Synchronized</span>
      </div>
    `;
  }

  // =================================================================
  // 4. DATA PARSER FUNCTION (Supports Explicit Lock Flag)
  // =================================================================
  function parseRedeemCodesData(dataString) {
    if (typeof redeemCodesData === 'undefined') return [];
    
    const entries = dataString.trim().split(/\n\s*\n/);
    const result = [];

    entries.forEach(entry => {
      const codeMatch = entry.match(/r-code:\s*([^\n]+)/i);
      const versionMatch = entry.match(/version:\s*([^\n]+)/i);
      const dateMatch = entry.match(/data-added:\s*([^\n]+)/i);
      
      // Look for explicit lock flag (e.g. 'locked: 1' or a separate line containing '1')
      const lockedMatch = entry.match(/locked:\s*1/i) || entry.match(/^1\s*$/m);

      if (codeMatch) {
        const code = codeMatch[1].trim();
        const version = versionMatch ? versionMatch[1].trim() : "Unknown";
        const dateStr = dateMatch ? dateMatch[1].trim() : "Not available";
        const timestamp = new Date(dateStr).getTime() || 0;
        const isLockedFlag = Boolean(lockedMatch);

        result.push({
          code: code,
          version: version,
          date: dateStr,
          timestamp: timestamp,
          locked: isLockedFlag
        });
      }
    });

    return result.sort((a, b) => b.timestamp - a.timestamp);
  }

  // =================================================================
  // 5. DYNAMIC HEADERS & SEO TITLE UPDATER
  // =================================================================
  function updateDynamicHeaders(codes) {
    if (!codes || codes.length === 0) return;

    let latestDateStr = "Not available";
    let latestTimestamp = 0;

    for (const item of codes) {
      if (item.date && item.date.toLowerCase() !== "not available") {
        latestDateStr = item.date;
        latestTimestamp = item.timestamp;
        break;
      }
    }

    if (lastUpdatedEl) lastUpdatedEl.textContent = latestDateStr;

    if (latestTimestamp > 0) {
      const latestDateObj = new Date(latestTimestamp);
      const monthYearString = latestDateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

      if (dynamicHeadingDateEl) dynamicHeadingDateEl.textContent = `(${monthYearString})`;
      if (pageSeoTitleEl) pageSeoTitleEl.textContent = `Active CODM Redeem Codes ${monthYearString} — Global & Garena | SlimeSpace`;
    }
  }

  // =================================================================
  // 6. CLEAR SEARCH BUTTON & FILTER LOGIC
  // =================================================================
  function updateClearButtonVisibility() {
    if (clearSearchBtn && searchInput) {
      clearSearchBtn.style.display = searchInput.value.trim().length > 0 ? 'flex' : 'none';
    }
  }

  function applyFilters() {
    const searchQuery = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const selectedVersion = versionFilterSelect ? versionFilterSelect.value : 'All';

    filteredCodes = parsedCodes.filter(item => {
      const matchesSearch = item.code.toLowerCase().includes(searchQuery) || 
                            item.date.toLowerCase().includes(searchQuery) ||
                            item.version.toLowerCase().includes(searchQuery);

      const matchesVersion = (selectedVersion === 'All') || 
                             (item.version.toLowerCase() === selectedVersion.toLowerCase());

      return matchesSearch && matchesVersion;
    });

    currentPage = 1;
    renderTable();
  }

  function getVersionBadgeClass(versionStr) {
    const v = versionStr.toLowerCase();
    if (v.includes('global')) return 'global';
    if (v.includes('garena')) return 'garena';
    return 'unknown';
  }

  // =================================================================
  // 7. TIMEZONE-SAFE 3-DAY BUFFER CHECKER
  // =================================================================
  function isWithinLast3Days(dateStr) {
    if (!dateStr || dateStr.toLowerCase() === 'not available') return false;
    const codeDate = new Date(dateStr);
    if (isNaN(codeDate.getTime())) return false;

    // Normalize dates to midnight to compare day differences accurately
    const codeTime = new Date(codeDate.getFullYear(), codeDate.getMonth(), codeDate.getDate()).getTime();
    const today = new Date();
    const todayTime = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

    const diffTime = todayTime - codeTime;
    const diffDays = diffTime / (1000 * 60 * 60 * 24);

    // Returns true if added today (0), 1 day ago, or 2 days ago (within 3 days span)
    return diffDays >= 0 && diffDays < 3;
  }

  // =================================================================
  // 8. TABLE & PAGINATION RENDERER
  // =================================================================
  function renderTable() {
    if (!tableBody) return;
    tableBody.innerHTML = '';

    if (filteredCodes.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="4" class="no-results" style="text-align:center; padding:16px;">No codes found for this filter.</td></tr>`;
      pageInfo.textContent = 'Showing 0-0 of 0';
      prevBtn.disabled = true;
      nextBtn.disabled = true;
      return;
    }

    const totalItems = filteredCodes.length;
    const isAllRows = rowsPerPage === 'All';
    const totalPages = isAllRows ? 1 : Math.ceil(totalItems / rowsPerPage);

    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const startIndex = isAllRows ? 0 : (currentPage - 1) * rowsPerPage;
    const endIndex = isAllRows ? totalItems : Math.min(startIndex + rowsPerPage, totalItems);
    const paginatedItems = filteredCodes.slice(startIndex, endIndex);

    paginatedItems.forEach(item => {
      const tr = document.createElement('tr');
      const badgeClass = getVersionBadgeClass(item.version);
      
      // Code is locked ONLY if it has the explicit lock flag AND is within the last 3 days
      const isLocked = item.locked && isWithinLast3Days(item.date);
      
      let codeColumnContent = '';
      let actionColumnContent = '';

      if (isLocked) {
        codeColumnContent = `<td class="code-cell locked-cell"><span class="locked-code-text">${item.code}</span></td>`;
        actionColumnContent = `
          <td class="action-cell">
            <a href="https://www.youtube.com/channel/UCbDtYZS08VvB6luAcyn08bQ" target="_blank" rel="noopener noreferrer" class="yt-unlock-btn" title="Watch YouTube to get this code">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="#FFFFFF"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
              <span>Get on YT</span>
            </a>
          </td>
        `;
      } else {
        codeColumnContent = `<td class="code-cell"><code>${item.code}</code></td>`;
        actionColumnContent = `
          <td class="action-cell">
            <button type="button" class="copy-btn" onclick="copyCode('${item.code}')">
              Copy
            </button>
          </td>
        `;
      }

      tr.innerHTML = `
        ${codeColumnContent}
        <td class="version-cell"><span class="v-badge ${badgeClass}">${item.version}</span></td>
        <td class="date-cell">${item.date}</td>
        ${actionColumnContent}
      `;
      tableBody.appendChild(tr);
    });

    pageInfo.textContent = `Showing ${startIndex + 1}-${endIndex} of ${totalItems}`;
    prevBtn.disabled = isAllRows || currentPage === 1;
    nextBtn.disabled = isAllRows || currentPage === totalPages;
  }

  // =================================================================
  // 9. EVENT LISTENERS FOR CONTROLS
  // =================================================================
  if (rowsSelect) {
    rowsSelect.addEventListener('change', (e) => {
      const val = e.target.value;
      rowsPerPage = val === 'All' ? 'All' : parseInt(val, 10);
      currentPage = 1;
      renderTable();
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      updateClearButtonVisibility();
      applyFilters();
    });
  }

  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      if (searchInput) {
        searchInput.value = '';
        updateClearButtonVisibility();
        applyFilters();
        searchInput.focus();
      }
    });
  }

  if (versionFilterSelect) versionFilterSelect.addEventListener('change', applyFilters);

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        renderTable();
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      const totalPages = Math.ceil(filteredCodes.length / rowsPerPage);
      if (currentPage < totalPages) {
        currentPage++;
        renderTable();
      }
    });
  }

  // =================================================================
  // 10. GLOBAL HELPER FUNCTIONS & INITIALIZATION
  // =================================================================
  window.copyCode = function(codeText) {
    navigator.clipboard.writeText(codeText).then(() => {
      showToast(`Code ${codeText} copied!`);
    }).catch(() => {
      showToast("Failed to copy code", true);
    });
  };

  window.shareSite = function() {
    const shareData = {
      title: 'CODM Redeem Codes — SlimeSpace',
      text: 'Check out working Call of Duty: Mobile redeem codes updated on SlimeSpace!',
      url: window.location.href
    };
    if (navigator.share) {
      navigator.share(shareData).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast("Page link copied to clipboard!");
    }
  };

  function showToast(message, isError = false) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.style.backgroundColor = isError ? '#e74c3c' : 'var(--accent-cyan)';
    toastEl.style.color = isError ? '#ffffff' : '#070c18';
    toastEl.classList.add('show');
    setTimeout(() => toastEl.classList.remove('show'), 2200);
  }

  // Kickstart repository loading sequence
  loadSharedConfigWithFallback();
});
