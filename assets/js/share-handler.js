/**
 * Utility Card Share Handler
 * Generates direct shareable links containing the utility name/product parameter.
 */
document.addEventListener("DOMContentLoaded", function () {
  const shareButtons = document.querySelectorAll(".btn-utility-share");

  shareButtons.forEach((btn) => {
    btn.addEventListener("click", function (e) {
      e.preventDefault();

      // Find the parent utility card and extract its title text
      const utilityCard = this.closest(".utility-card");
      const titleElem = utilityCard
        ? utilityCard.querySelector(".utility-title")
        : null;
      const utilityName = titleElem
        ? titleElem.textContent.trim()
        : "Gaming Utility";

      // Build a clean shareable URL containing the search query parameter
      const baseUrl = window.location.origin + window.location.pathname;
      const shareUrl = `${baseUrl}?search=${encodeURIComponent(utilityName)}`;

      const shareData = {
        title: `${utilityName} | Vile Tempest Official`,
        text: `Check out this tool: ${utilityName} on Vile Tempest Official!`,
        url: shareUrl,
      };

      // Use native device share API if available, otherwise fallback to clipboard copy
      if (navigator.share) {
        navigator.share(shareData).catch((err) => {
          if (err.name !== "AbortError") {
            fallbackCopyToClipboard(shareUrl);
          }
        });
      } else {
        fallbackCopyToClipboard(shareUrl);
      }
    });
  });

  function fallbackCopyToClipboard(text) {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        showGlobalToast("Utility link copied to clipboard!");
      })
      .catch(() => {
        showGlobalToast("Failed to copy link", true);
      });
  }

  function showGlobalToast(message, isError = false) {
    let toast = document.getElementById("global-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "global-toast";
      toast.style.cssText = `
        position: fixed;
        bottom: 80px;
        left: 50%;
        transform: translateX(-50%) translateY(20px);
        background-color: ${isError ? "#e74c3c" : "var(--accent-cyan, #38bdf8)"};
        color: ${isError ? "#ffffff" : "#070c18"};
        padding: 10px 20px;
        border-radius: 9999px;
        font-size: 13px;
        font-weight: 600;
        z-index: 9999;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        opacity: 0;
        transition: all 0.3s ease;
      `;
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    setTimeout(() => {
      toast.style.opacity = "1";
      toast.style.transform = "translateX(-50%) translateY(0)";
    }, 10);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(-50%) translateY(20px)";
    }, 2500);
  }
});
/**
 * Global & Card-Level Share Handler
 * Handles top header whole-site sharing and individual utility card deep-link sharing.
 */
document.addEventListener("DOMContentLoaded", function () {
  // 1. TOP HEADER SHARE BUTTON (Shares Whole Site)
  const topNavShareBtn = document.querySelector(
    ".site-header .icon-btn[aria-label='Share']",
  );

  if (topNavShareBtn) {
    topNavShareBtn.addEventListener("click", function (e) {
      e.preventDefault();

      // Clean base site URL (removes active search parameters or hashes)
      const siteUrl = window.location.origin + window.location.pathname;

      const wholeSiteShareData = {
        title: "Vile Tempest Official | Gaming Utilities & Redeem Codes",
        text: "Check out Vile Tempest Official for CODM test server links, active redeem codes, and custom gaming web utilities!",
        url: siteUrl,
      };

      shareContent(wholeSiteShareData, "Site link copied to clipboard!");
    });
  }

  // 2. UTILITY CARD SHARE BUTTONS (Shares Specific Tool Parameters)
  const utilityShareButtons = document.querySelectorAll(".btn-utility-share");

  utilityShareButtons.forEach((btn) => {
    btn.addEventListener("click", function (e) {
      e.preventDefault();

      const utilityCard = this.closest(".utility-card");
      const titleElem = utilityCard
        ? utilityCard.querySelector(".utility-title")
        : null;
      const utilityName = titleElem
        ? titleElem.textContent.trim()
        : "Gaming Utility";

      const baseUrl = window.location.origin + window.location.pathname;
      const shareUrl = `${baseUrl}?search=${encodeURIComponent(utilityName)}`;

      const utilityShareData = {
        title: `${utilityName} | Vile Tempest Official`,
        text: `Check out this tool: ${utilityName} on Vile Tempest Official!`,
        url: shareUrl,
      };

      shareContent(utilityShareData, "Utility link copied to clipboard!");
    });
  });

  /**
   * Helper function to execute Web Share API or fallback to clipboard
   */
  function shareContent(shareData, fallbackSuccessMsg) {
    if (navigator.share) {
      navigator.share(shareData).catch((err) => {
        if (err.name !== "AbortError") {
          fallbackCopyToClipboard(shareData.url, fallbackSuccessMsg);
        }
      });
    } else {
      fallbackCopyToClipboard(shareData.url, fallbackSuccessMsg);
    }
  }

  function fallbackCopyToClipboard(text, successMessage) {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        showGlobalToast(successMessage);
      })
      .catch(() => {
        showGlobalToast("Failed to copy link", true);
      });
  }

  function showGlobalToast(message, isError = false) {
    let toast = document.getElementById("global-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "global-toast";
      toast.style.cssText = `
        position: fixed;
        bottom: 80px;
        left: 50%;
        transform: translateX(-50%) translateY(20px);
        background-color: ${isError ? "#e74c3c" : "var(--accent-primary, #38bdf8)"};
        color: ${isError ? "#ffffff" : "#0b0f17"};
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
    toast.textContent = message;
    setTimeout(() => {
      toast.style.opacity = "1";
      toast.style.transform = "translateX(-50%) translateY(0)";
    }, 10);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(-50%) translateY(20px)";
    }, 2500);
  }
});
