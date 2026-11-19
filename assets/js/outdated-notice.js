/**
 * Legacy / Outdated Page Modal Notice
 * Displays a centered overlay modal alerting visitors that this page may no longer be updated
 * and directing them to the official, actively maintained website.
 */
(function () {
  // 🌟 NEW OFFICIAL DESTINATION
  const NEW_SITE_URL = "https://mob-extra.github.io/mob-extra/";
  const STORAGE_KEY = "mob_legacy_modal_dismissed";

  function injectOutdatedModal() {
    if (document.getElementById("mob-outdated-overlay")) return;

    // Optional: Uncomment the line below to show only once per browser session
    // if (sessionStorage.getItem(STORAGE_KEY) === "true") return;

    // 1. Inject CSS Styles
    if (!document.getElementById("mob-outdated-modal-styles")) {
      const style = document.createElement("style");
      style.id = "mob-outdated-modal-styles";
      style.textContent = `
        #mob-outdated-overlay {
          position: fixed;
          inset: 0;
          width: 100%;
          height: 100%;
          background: rgba(8, 12, 20, 0.82);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          box-sizing: border-box;
          z-index: 2147483647;
          opacity: 0;
          animation: mobModalFadeIn 0.25s ease forwards;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }

        .mob-outdated-card {
          background: #101726;
          border: 1px solid #1e2d4a;
          border-radius: 16px;
          padding: 28px 26px;
          max-width: 440px;
          width: 100%;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.65);
          box-sizing: border-box;
          text-align: left;
          transform: translateY(10px) scale(0.98);
          animation: mobCardSlideUp 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .mob-notice-badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: rgba(220, 76, 76, 0.14);
          border: 1px solid rgba(220, 76, 76, 0.32);
          color: #f06565;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.7px;
          text-transform: uppercase;
          padding: 5px 12px;
          border-radius: 999px;
          margin-bottom: 16px;
        }

        .mob-notice-badge i {
          color: #f5a623;
          font-size: 12px;
        }

        .mob-outdated-title {
          margin: 0 0 10px 0;
          font-size: 22px;
          font-weight: 700;
          color: #ffffff;
          line-height: 1.25;
          letter-spacing: -0.2px;
        }

        .mob-outdated-desc {
          margin: 0 0 24px 0;
          font-size: 14.5px;
          line-height: 1.55;
          color: #94a3b8;
        }

        .mob-outdated-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .mob-btn-stay,
        .mob-btn-redirect {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 12px 16px;
          font-size: 14px;
          font-weight: 600;
          border-radius: 10px;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.2s ease;
          box-sizing: border-box;
          text-align: center;
        }

        .mob-btn-stay {
          background: #172033;
          color: #cbd5e1;
          border: 1px solid #283652;
        }

        .mob-btn-stay:hover {
          background: #1e2a42;
          color: #ffffff;
          border-color: #3b4f75;
        }

        .mob-btn-redirect {
          background: #4da3ff;
          color: #071120;
          border: 1px solid #4da3ff;
          font-weight: 700;
          box-shadow: 0 4px 16px rgba(77, 163, 255, 0.35);
        }

        .mob-btn-redirect:hover {
          background: #6bb3ff;
          border-color: #6bb3ff;
          box-shadow: 0 6px 20px rgba(77, 163, 255, 0.5);
          transform: translateY(-1px);
        }

        @media (max-width: 420px) {
          .mob-outdated-card {
            padding: 22px 20px;
          }
          .mob-outdated-actions {
            grid-template-columns: 1fr;
          }
        }

        @keyframes mobModalFadeIn {
          to { opacity: 1; }
        }

        @keyframes mobCardSlideUp {
          to { transform: translateY(0) scale(1); }
        }
      `;
      document.head.appendChild(style);
    }

    // 2. Build Modal HTML
    const overlay = document.createElement("div");
    overlay.id = "mob-outdated-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "mobOutdatedTitle");

    overlay.innerHTML = `
      <div class="mob-outdated-card">
        <div class="mob-notice-badge">
          <i class="fa-solid fa-triangle-exclamation"></i>
          <span>Notice</span>
        </div>
        <h2 id="mobOutdatedTitle" class="mob-outdated-title">
          We've Moved to a New Site!
        </h2>
        <p class="mob-outdated-desc">
          This page may no longer be updated. Visit our official new website to get the latest updates, working links, and resources.
        </p>
        <div class="mob-outdated-actions">
          <button type="button" id="mobStayOldPageBtn" class="mob-btn-stay">
            Stay on Old Page
          </button>
          <a href="${NEW_SITE_URL}" class="mob-btn-redirect">
            Go to New Site
          </a>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    document.body.style.overflow = "hidden";

    // 3. Dismiss Handler
    const closeModal = () => {
      sessionStorage.setItem(STORAGE_KEY, "true");
      document.body.style.overflow = "";
      overlay.remove();
    };

    document
      .getElementById("mobStayOldPageBtn")
      .addEventListener("click", closeModal);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectOutdatedModal);
  } else {
    injectOutdatedModal();
  }
})();
