document.addEventListener("DOMContentLoaded", () => {
  // 3 Sequential Fallback Repositories for Shared Config Manifest (`codm-config.js`) using GitHub Pages
  const repoConfigs = [
    { url: "https://mob-extra.github.io/MOBEXTRA.github.shared-data-repo.1/codm-test-server/codm-config.js", name: "Repository 1", base: "https://mob-extra.github.io/MOBEXTRA.github.shared-data-repo.1/codm-test-server/" },
    { url: "https://mob-extra.github.io/MOBEXTRA.github.shared-data-repo.2/codm-test-server/codm-config.js", name: "Repository 2", base: "https://mob-extra.github.io/MOBEXTRA.github.shared-data-repo.2/codm-test-server/" },
    { url: "https://mob-extra.github.io/MOBEXTRA.github.shared-data-repo.3/codm-test-server/codm-config.js", name: "Repository 3", base: "https://mob-extra.github.io/MOBEXTRA.github.shared-data-repo.3/codm-test-server/" }
  ];

  let currentIndex = 0;
  let activeRepoName = repoConfigs[0].name;

  let isUnlocked = false;
  let verifyData = null;
  let loadedServerData = null; // Holds info for sharing

  const MAIN_PTB_HUB_URL = "https://mob-extra.github.io/CODM.TestServer.DL.Link/";

  // DOM Elements
  const bodyEl = document.getElementById("pageBody");
  const serverInfoContainer = document.getElementById("serverInfoContainer");
  const linksGridContainer = document.getElementById("linksGridContainer");
  const verificationGatewayContainer = document.getElementById("verificationGatewayContainer");

  // Prevent Context Menu & Keyboard Copy Shortcuts before verification
  document.addEventListener("contextmenu", (e) => {
    if (!isUnlocked) {
      e.preventDefault();
      showToast("Access verification required.", true);
    }
  });

  document.addEventListener("keydown", (e) => {
    if (!isUnlocked) {
      if (e.ctrlKey && (e.key === 'a' || e.key === 'c' || e.key === 'u' || e.key === 's')) {
        e.preventDefault();
      }
      if (e.key === 'F12') e.preventDefault();
    }
  });

  document.addEventListener("copy", (e) => {
    if (!isUnlocked) e.preventDefault();
  });

  document.addEventListener("selectstart", (e) => {
    if (!isUnlocked) {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.closest('#verificationGateway'))) {
        return;
      }
      e.preventDefault();
    }
  });

  function loadSharedConfigWithFallback() {
    if (currentIndex >= repoConfigs.length) {
      console.error("Critical Error: All repositories failed.");
      if (serverInfoContainer) {
        serverInfoContainer.innerHTML = `
          <div class="server-status-header">
            <h3>CODM Test Server</h3>
            <span class="status-badge closed"><i class="fa-solid fa-triangle-exclamation"></i> Error</span>
          </div>
          <div class="meta-row" style="text-align: center; padding: 1.5rem 0;">
            <p style="color: var(--codm-red); font-weight: bold; margin-bottom: 0.75rem;"><i class="fa-solid fa-circle-exclamation"></i> All config sources failed!</p>
            <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1rem;">Please contact the site admin via YouTube to report this issue.</p>
            <a href="https://www.youtube.com/channel/UCbDtYZS08VvB6luAcyn08bQ" target="_blank" rel="noopener noreferrer" class="btn-tactical btn-yt" style="display: inline-flex; margin: 0 auto; text-decoration: none;">
              <i class="fa-brands fa-youtube"></i>
              <span>Contact via YouTube</span>
            </a>
          </div>
        `;
      }

      // Force links container to stay locked and show an offline notice
      if (linksGridContainer) {
        linksGridContainer.classList.add("locked");
        linksGridContainer.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--codm-red);">
            <i class="fa-solid fa-triangle-exclamation" style="font-size: 2rem; margin-bottom: 0.5rem;"></i>
            <p style="font-weight: bold; font-size: 1rem;">Internet Connection Required</p>
            <p style="color: var(--text-muted); font-size: 0.88rem; margin-top: 0.4rem;">You must be online and complete access verification to view download links.</p>
          </div>
        `;
      }
      return;
    }

    const currentRepo = repoConfigs[currentIndex];
    const script = document.createElement("script");
    script.src = currentRepo.url;
    script.async = true;

    script.onload = function() {
      activeRepoName = currentRepo.name;

      if (typeof notARobot !== "undefined") {
        verifyData = notARobot;
      }

      // Ensure valid test server data and links exist before displaying them and starting the timer
      if (typeof testServerData !== "undefined" && testServerData.links && testServerData.links.length > 0) {
        loadedServerData = testServerData;
        renderServerData(testServerData);

        // Wait exactly 3 seconds after links are fully loaded and rendered before showing verification
        setTimeout(() => {
          renderVerificationGateway();
        }, 3000);
      } else {
        console.warn("Download links are missing or failed to load. Verification gateway will remain hidden.");
      }
    };
    
    script.onerror = function() {
      console.warn(`Repository #${currentIndex + 1} (${currentRepo.name}) failed. Switching to next repository...`);
      currentIndex++;
      loadSharedConfigWithFallback();
    };

    document.head.appendChild(script);
  }

  // Dynamic Injection of Verification Gateway keeping original wording/layout + disclaimer checkbox
  function renderVerificationGateway() {
    if (!verificationGatewayContainer) return;

    const ytUrl = verifyData ? verifyData.codeSource : "#";

    verificationGatewayContainer.innerHTML = `
      <section id="verificationGateway" class="glass-card">
        <div class="card-badge-header">
          <div class="icon-box">
            <i class="fa-solid fa-shield-halved"></i>
          </div>
          <div>
            <h2>Access Verification</h2>
            <p class="sub-text">Confirm community access code to view links</p>
          </div>
        </div>

        <div class="verify-steps">
          <div class="step-item">
            <div class="step-number">1</div>
            <div class="step-content">
              <p>Find the official access code provided in our community video guide.</p>
              <a href="${ytUrl}" id="ytAppBtn" target="_blank" rel="noopener noreferrer" class="btn-tactical btn-yt">
                <i class="fa-brands fa-youtube"></i>
                <span>Open Video Guide</span>
              </a>
            </div>
          </div>

          <div class="step-item">
            <div class="step-number">2</div>
            <div class="step-content">
              <p>Enter the access code below to display download buttons.</p>
              <div class="input-action-group">
                <input type="text" id="verificationInput" placeholder="Enter code" autocomplete="off" />
                <button id="verifyBtn" type="button" class="btn-tactical btn-primary">
                  <span>Verify Code</span>
                  <i class="fa-solid fa-key"></i>
                </button>
              </div>

              <p id="verifyErrorMsg" class="error-feedback"></p>
    
              <!-- Disclaimer Checkbox -->
              <div class="disclaimer-checkbox-wrapper">
                <label class="checkbox-container">
                  <input type="checkbox" id="disclaimerCheckbox" />
                  <span class="checkbox-label-text">
                    <strong>Disclaimer:</strong> <br>I acknowledge that <strong>SlimeSpace</strong> acts as an independent portal for official developer links. I agree that <strong>SlimeSpace</strong> does not host these packages and is not responsible for their content. I proceed at my own risk and discretion.
                  </span>
                </label>
              </div>

            </div>
          </div>
        </div>
      </section>
    `;

    // Bind event listeners for newly injected elements
    const verifyBtn = document.getElementById("verifyBtn");
    const verifyInput = document.getElementById("verificationInput");

    if (verifyBtn) verifyBtn.addEventListener("click", handleVerification);
    if (verifyInput) {
      verifyInput.addEventListener("keypress", (e) => {
        if (e.key === 'Enter') handleVerification();
      });
    }
  }

  function handleVerification() {
    const verifyInput = document.getElementById("verificationInput");
    const disclaimerCheckbox = document.getElementById("disclaimerCheckbox");
    const inputVal = verifyInput ? verifyInput.value.trim() : "";

    if (!verifyData) {
      showError("System initializing. Please wait.");
      return;
    }

    // Check if disclaimer box is checked
    if (disclaimerCheckbox && !disclaimerCheckbox.checked) {
      showError("You must accept the disclaimer agreement before verifying.");
      return;
    }

    if (String(inputVal) === String(verifyData.code).trim()) {
      unlockHub();
    } else {
      showError("Incorrect code. Please check video guide.");
      if (verifyInput) verifyInput.value = "";
    }
  }

  function showError(msg) {
    const errorMsg = document.getElementById("verifyErrorMsg");
    if (errorMsg) {
      errorMsg.textContent = msg;
      errorMsg.style.display = "block";
    }
  }

  function unlockHub() {
    isUnlocked = true;
    if (bodyEl) {
      bodyEl.classList.remove("anti-select-body");
      bodyEl.removeAttribute("unselectable");
      bodyEl.removeAttribute("onselectstart");
    }
    if (linksGridContainer) linksGridContainer.classList.remove("locked");
    
    const gatewayBox = document.getElementById("verificationGateway");
    if (gatewayBox) gatewayBox.style.display = "none";
    
    // Smoothly scroll down to the Season info container
    if (serverInfoContainer) {
      serverInfoContainer.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }

    showToast("Verification successful!");
  }

  // Render Server Info & Download Cards
  function renderServerData(data) {
    const isOnline = data.status === 1;
    
    const serverStatusBadge = isOnline
      ? `<span class="status-badge online"><i class="fa-solid fa-wifi fa-beat-fade"></i> Live</span>`
      : `<span class="status-badge closed"><i class="fa-solid fa-triangle-exclamation fa-beat-fade"></i> Closed</span>`;

    const releaseDateText = data.releaseDate || data.lastUpdated || 'Recently Released';

    if (serverInfoContainer) {
      serverInfoContainer.innerHTML = `
        <div class="server-status-header">
          <h3>${data.season || 'CODM Test Server'}</h3>
          ${serverStatusBadge}
        </div>
        <div class="meta-row">
          <p><strong><i class="fa-regular fa-calendar-check"></i> Release Date:</strong> ${releaseDateText}</p>
          <p><strong><i class="fa-solid fa-list-check"></i> Patch Summary:</strong> ${data.updateDescription || 'No description available.'}</p>
        </div>
        <!-- Repo Source Section -->
        <div class="meta-row" style="margin-top: 0.75rem; border-top: 1px solid rgba(255, 255, 255, 0.06); padding-top: 0.75rem; display: flex; align-items: center; justify-content: space-between;">
          <p style="margin: 0; font-size: 0.88rem;"><strong><i class="fa-solid fa-server"></i> Repo Source:</strong> <span style="color: var(--codm-gold); font-family: var(--font-heading);">${activeRepoName}</span></p>
          <span style="font-size: 0.75rem; color: var(--text-muted); background: rgba(255,255,255,0.05); padding: 2px 6px; border-radius: 4px;">Synchronized</span>
        </div>
        ${!isOnline ? `
        <div class="server-closed-notice" style="margin-top: 1rem; background: rgba(230, 34, 34, 0.08); border: 1px solid rgba(230, 34, 34, 0.3); border-left: 3px solid var(--codm-red); padding: 0.85rem 1rem; border-radius: 4px;">
          <div style="display: flex; align-items: center; gap: 8px; color: var(--codm-red); font-family: var(--font-heading); font-size: 0.95rem; text-transform: uppercase; margin-bottom: 0.4rem;">
            <i class="fa-solid fa-triangle-exclamation fa-beat-fade"></i>
            <span>Important Notice: Server Currently Closed</span>
          </div>
          <p style="font-size: 0.88rem; color: var(--text-muted); line-height: 1.4; margin-bottom: 0.5rem;">
            The COD Mobile public test server is currently closed. It is not recommended to download or install the APK packages at this time, as players are unable to log in or access the game servers while they are closed.
          </p>
          <p style="font-size: 0.88rem; color: var(--text-muted); line-height: 1.4; margin: 0;">
            To receive instant alerts when the new season is officially released, please visit <a href="${MAIN_PTB_HUB_URL}" target="_blank" rel="noopener noreferrer" style="color: var(--codm-gold); text-decoration: underline; word-break: break-all;">${MAIN_PTB_HUB_URL}</a> to enable site notification permissions.
          </p>
        </div>
        ` : ''}
      `;
    }

    if (linksGridContainer) {
      if (data.links && data.links.length > 0) {
        linksGridContainer.innerHTML = data.links.map(item => {
          let imgFile = 'codm-ts-logo-A.png';
          let faIconClass = 'fa-brands fa-android';

          const deviceLower = item.device.toLowerCase();
          if (deviceLower.includes('ios')) {
            faIconClass = 'fa-brands fa-apple';
            imgFile = 'codm-ts-logo-ios.png';
          } else if (item.device.includes('32-bit')) {
            imgFile = 'codm-ts-logo-A.png';
          } else if (item.device.includes('64-bit')) {
            imgFile = 'codm-ts-logo-A.png';
          }

          let iconUrl = `assets/images/${imgFile}`;
          let bgUrl = iconUrl;

          const deviceHasIcon = /<i\b[^>]*>/i.test(item.device);
          let deviceTitleHTML = item.device;

          if (!deviceHasIcon) {
            deviceTitleHTML = `<i class="${faIconClass}"></i> ${item.device}`;
          }

          const linkOnline = item.status !== undefined ? item.status === 1 : isOnline;
          const cardBadge = linkOnline
            ? `<span class="status-badge online card-status-badge"><i class="fa-solid fa-wifi fa-beat-fade"></i> TEST SERVER LIVE</span>`
            : `<span class="status-badge closed card-status-badge"><i class="fa-solid fa-triangle-exclamation fa-beat-fade"></i> TEST SERVER CLOSED</span>`;

          return `
            <div class="link-card" style="background-image: linear-gradient(180deg, rgba(11,13,15,0.72) 0%, rgba(11,13,15,0.95) 100%), url('${bgUrl}'); background-size: cover; background-position: center;">
              
              ${cardBadge}

              <div class="card-header-row">
                <div class="app-icon-wrapper">
                  <img src="${iconUrl}" alt="App Icon" class="card-app-icon-img" onerror="this.src='assets/images/favicon.png';" />
                </div>
                <div class="device-title">
                  ${deviceTitleHTML}
                </div>
              </div>

              <div class="url-preview-box">
                <i class="fa-solid fa-link"></i>
                <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="url-text">${item.url}</a>
              </div>

              <div class="action-row">
                <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="btn-tactical btn-download">
                  <i class="fa-solid fa-download"></i>
                  <span>Download</span>
                </a>
                <button type="button" class="btn-tactical btn-copy" onclick="copyPTBLink('${item.url}')">
                  <i class="fa-regular fa-copy"></i>
                  <span>Copy</span>
                </button>
              </div>

            </div>
          `;
        }).join('');
      } else {
        linksGridContainer.innerHTML = `<p style="text-align: center; color: var(--text-muted);">No active links available.</p>`;
      }
    }
  }

  // Native Share Feature with Info Carrier
  window.shareHub = function() {
    const pageUrl = window.location.href;
    const season = loadedServerData?.season || 'CODM Public Test Server';
    const releaseDate = loadedServerData?.releaseDate || loadedServerData?.lastUpdated || 'Latest';
    const description = loadedServerData?.updateDescription || 'Official Call of Duty: Mobile PTB links for Android & iOS.';

    const shareTitle = `${season} — CODM Test Server Hub`;
    const shareText = `📱 COD Mobile Public Test Server Download\n\n🎮 ${season}\n📅 Release Date: ${releaseDate}\n📱 Platforms: Android (APK 32/64-Bit) & iOS (TestFlight)\n📝 Update Info: ${description}\n\nGet download links here:`;
    
    if (navigator.share) {
      navigator.share({
        title: shareTitle,
        text: shareText,
        url: pageUrl
      }).catch((err) => {
        if (err.name !== 'AbortError') {
          copyShareFallback(shareText, pageUrl);
        }
      });
    } else {
      copyShareFallback(shareText, pageUrl);
    }
  };

  function copyShareFallback(text, url) {
    const fullMessage = `${text}\n${url}`;
    navigator.clipboard.writeText(fullMessage).then(() => {
      showToast("Share info copied to clipboard!");
    }).catch(() => {
      showToast("Failed to copy share details.", true);
    });
  }

  window.copyPTBLink = function(url) {
    if (!isUnlocked) return;
    navigator.clipboard.writeText(url).then(() => {
      showToast("Link copied to clipboard!");
    }).catch(() => {
      showToast("Failed to copy link.", true);
    });
  };

  const toastEl = document.getElementById("toast");
  function showToast(message, isError = false) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.style.backgroundColor = isError ? "#e62222" : "#f5b800";
    toastEl.style.color = isError ? "#ffffff" : "#000000";
    toastEl.style.display = "block";
    toastEl.style.opacity = "1";

    setTimeout(() => {
      toastEl.style.opacity = "0";
      setTimeout(() => { toastEl.style.display = "none"; }, 300);
    }, 2400);
  }

  // Initialize data loading with sequential fallback across the 3 shared repos
  loadSharedConfigWithFallback();
  
  // --- Notification Popup Logic ---
  const notificationPopup = document.getElementById("ptbNotificationPopup");
  const btnMaybeLater = document.getElementById("btnMaybeLater");
  const btnAllowNotif = document.getElementById("btnAllowNotif");
  const btnClosePopup = document.getElementById("btnClosePopup");

  function dismissPopup() {
    if (notificationPopup) {
      notificationPopup.classList.remove("active");
    }
  }

  setTimeout(() => {
    if (notificationPopup) {
      notificationPopup.classList.add("active");
    }
  }, 10000);

  if (btnMaybeLater) {
    btnMaybeLater.addEventListener("click", () => {
      dismissPopup();
    });
  }

  if (btnAllowNotif) {
    btnAllowNotif.addEventListener("click", () => {
      dismissPopup();
      window.open(MAIN_PTB_HUB_URL, '_blank', 'noopener,noreferrer');
    });
  }

  if (btnClosePopup) {
    btnClosePopup.addEventListener("click", () => {
      dismissPopup();
    });
  }
});
