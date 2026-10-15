document.addEventListener("DOMContentLoaded", function () {
  const filterButtons = document.querySelectorAll(".nav-filter-btn");
  const heroSections = document.querySelectorAll(".welcome-hero");
  const videoSections = document.querySelectorAll(".videos-section");
  const utilitySections = document.querySelectorAll(".utilities-section");

  filterButtons.forEach((button) => {
    button.addEventListener("click", function (e) {
      e.preventDefault();

      // Remove active class from all buttons and add to clicked one
      filterButtons.forEach((btn) => btn.classList.remove("active"));
      this.classList.add("active");

      const filterType = this.getAttribute("data-filter");

      if (filterType === "utilities") {
        // Hide Hero and Videos, Show Only Utilities
        heroSections.forEach((el) => el.classList.add("hidden-content"));
        videoSections.forEach((el) => el.classList.add("hidden-content"));
        utilitySections.forEach((el) => el.classList.remove("hidden-content"));
      } else if (filterType === "home" || filterType === "all") {
        // Reset / Show Everything
        heroSections.forEach((el) => el.classList.remove("hidden-content"));
        videoSections.forEach((el) => el.classList.remove("hidden-content"));
        utilitySections.forEach((el) => el.classList.remove("hidden-content"));
      }
    });
  });
});
