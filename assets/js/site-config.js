/* ==========================================================================
   Vile Tempest Official — Site Configuration & Global Links Data
   ========================================================================== */

// Suppress local browser/vendor console noise (e.g. WebGPU adapter warnings)
(function () {
  const originalWarn = console.warn;
  console.warn = function (...args) {
    if (
      typeof args[0] === "string" &&
      args[0].includes("powerPreference option is currently ignored")
    ) {
      return;
    }
    originalWarn.apply(console, args);
  };
})();

const SITE_CONFIG = {
  brandName: "Vile Tempest Official",
  brandAccent: "Vile Tempest",
  brandSuffix: "Official",
  alias: "MOB EXTRA",

  // Official Channel & Contact Links
  links: {
    youtubeChannel: "https://www.youtube.com/channel/UCbDtYZS08VvB6luAcyn08bQ",
    youtubeVideos:
      "https://www.youtube.com/channel/UCbDtYZS08VvB6luAcyn08bQ/videos",
    youtubeCommunity:
      "https://www.youtube.com/channel/UCbDtYZS08VvB6luAcyn08bQ/community",
    slimeSpaceHub: "https://mob-extra.github.io/SlimeSpace/",
    emailAddress: "mob.extra.contact@gmail.com",
    emailComposeUrl:
      "mailto:mob.extra.contact@gmail.com?subject=Inquiry%20/%20Commission%20Request%20—%20Vile%20Tempest%20Official",
    facebook: "https://facebook.com/vile.tempest.extra",
    tiktok: "https://tiktok.com/@vile.tempest.extr",
    twitter: "https://x.com/VileTempestExtr",
  },

  // Versioning and Dynamic Years
  version: "v2.2.0",
  startYear: 2026,
};

// Automatically render configuration details and dynamic dates when DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
  renderDynamicSiteData();
});

function renderDynamicSiteData() {
  const currentYear = new Date().getFullYear();
  const yearDisplay =
    currentYear > SITE_CONFIG.startYear
      ? `${SITE_CONFIG.startYear} - ${currentYear}`
      : `${SITE_CONFIG.startYear}`;

  // 1. Populate dynamic copyright year elements
  const yearElements = document.querySelectorAll(
    ".current-year, .config-copyright-year",
  );
  yearElements.forEach((el) => {
    el.textContent = el.classList.contains("config-copyright-year")
      ? yearDisplay
      : currentYear;
  });

  // 2. Populate dynamic effective dates in legal or hero cards
  const effectiveDateElements = document.querySelectorAll(
    ".config-effective-date",
  );
  effectiveDateElements.forEach((el) => {
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    el.textContent = `${months[new Date().getMonth()]} ${currentYear}`;
  });

  // 3. Populate dynamic branding elements across all pages
  const footerBrandNameElements =
    document.querySelectorAll(".config-brand-name");
  footerBrandNameElements.forEach(
    (el) => (el.textContent = SITE_CONFIG.brandName),
  );

  // 4. Dynamic Link Bindings for YouTube Channel
  const ytLinks = document.querySelectorAll("a.config-link-yt");
  ytLinks.forEach((link) => {
    link.href = SITE_CONFIG.links.youtubeChannel;
  });

  // 5. Dynamic Link Bindings for SlimeSpace Hub
  const slimeSpaceLinks = document.querySelectorAll("a.config-link-slimespace");
  slimeSpaceLinks.forEach((link) => {
    link.href = SITE_CONFIG.links.slimeSpaceHub;
  });

  // 6. Dynamic Email Web Compose Links
  const emailLinks = document.querySelectorAll("a.config-link-email");
  emailLinks.forEach((link) => {
    link.href = SITE_CONFIG.links.emailComposeUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
  });

  // 7. Dynamic Visible Email Text Elements (.config-email-text)
  const emailTextElements = document.querySelectorAll(".config-email-text");
  emailTextElements.forEach((el) => {
    el.textContent = SITE_CONFIG.links.emailAddress;
  });

  // 8. Dynamic Email Copy Button Handlers (.config-copy-email-btn)
  const emailCopyButtons = document.querySelectorAll(".config-copy-email-btn");
  emailCopyButtons.forEach((btn) => {
    btn.setAttribute(
      "onclick",
      `copyEmailAddress('${SITE_CONFIG.links.emailAddress}')`,
    );
  });
}

// Universal Copy Helper for Email Support Badge
function copyEmailAddress(email) {
  navigator.clipboard.writeText(email).then(() => {
    let toast = document.getElementById("global-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "global-toast";
      toast.style.cssText = `
        position: fixed;
        bottom: 80px;
        left: 50%;
        transform: translateX(-50%) translateY(20px);
        background-color: var(--accent-primary, #38bdf8);
        color: #0b0f17;
        padding: 10px 20px;
        border-radius: 9999px;
        font-size: 13px;
        font-weight: 700;
        z-index: 9999;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        opacity: 0;
        transition: all 0.3s ease;
      `;
      document.body.appendChild(toast);
    }
    toast.textContent = "Email address copied to clipboard!";
    toast.style.opacity = "1";
    toast.style.transform = "translateX(-50%) translateY(0)";

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(-50%) translateY(20px)";
    }, 2500);
  });
}

/* ==========================================================================
   Global Secure Site View Counter (V2 API with exact endpoint & base offset)
   ========================================================================== */
(function initGlobalViewCounter() {
  const BASE_OFFSET = 16420; // Permanent base offset

  // 1. Dynamic CSS Injection for minimal background-free styling
  function injectCounterStyles() {
    if (document.getElementById("auto-view-counter-styles")) return;
    const style = document.createElement("style");
    style.id = "auto-view-counter-styles";
    style.textContent = `
      .hero-views-badge,
      .auto-footer-views-container {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: transparent;
        border: none;
        padding: 0;
        box-shadow: none;
      }
      .auto-footer-views-container {
        justify-content: center;
        padding: 12px 16px;
        margin: 20px auto 10px auto;
        width: fit-content;
      }
      .hero-views-badge .views-meta,
      .auto-footer-views-container .views-meta {
        display: flex;
        align-items: center;
        gap: 6px;
        line-height: 1;
      }
      .hero-views-badge .views-label,
      .auto-footer-views-container .views-label {
        font-size: 0.68rem;
        font-weight: 700;
        color: var(--text-muted, #94a3b8);
        text-transform: uppercase;
        letter-spacing: 0.6px;
      }
      .hero-views-badge .views-number,
      .auto-footer-views-container .views-number {
        font-size: 0.75rem;
        font-weight: 800;
        color: var(--accent-primary, #38bdf8);
        font-family: var(--font-mono, monospace), monospace;
        letter-spacing: 0.2px;
      }
      .hero-badges-wrapper {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 6px;
        margin-bottom: 20px;
        width: 100%;
      }
    `;
    document.head.appendChild(style);
  }

  // 2. Auto-Inject HTML Widget at Webpage Bottom (Icon-free)
  function injectCounterHTML() {
    if (!document.querySelector(".auto-footer-views-container")) {
      const footerWidget = document.createElement("div");
      footerWidget.className = "auto-footer-views-container";
      footerWidget.innerHTML = `
        <div class="views-meta">
          <span class="views-label">Total Website Views</span>
          <span class="views-number config-page-views-count">Loading...</span>
        </div>
      `;
      document.body.appendChild(footerWidget);
    }

    return document.querySelectorAll(
      "#page-views-count, .config-page-views-count",
    );
  }

  // 3. Increment & Fetch Global Count with your correct V2 endpoint
  function fetchAndRenderViews(targets) {
    fetch(
      "https://api.counterapi.dev/v2/mob-extra-site-views/vile-tempest-site-views/up",
    )
      .then((res) => {
        if (!res.ok) throw new Error("API response not OK");
        return res.json();
      })
      .then((data) => {
        const count = data.data?.up ?? data.count;
        if (typeof count === "number") {
          const totalViews = BASE_OFFSET + count;
          targets.forEach((el) => {
            el.textContent = totalViews.toLocaleString();
          });
        } else {
          throw new Error("Invalid count response");
        }
      })
      .catch((err) => {
        console.warn("View counter fallback active:", err);
        targets.forEach((el) => {
          el.textContent = BASE_OFFSET.toLocaleString();
        });
      });
  }

  // Execute after DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      injectCounterStyles();
      const targets = injectCounterHTML();
      fetchAndRenderViews(targets);
    });
  } else {
    injectCounterStyles();
    const targets = injectCounterHTML();
    fetchAndRenderViews(targets);
  }
})();
