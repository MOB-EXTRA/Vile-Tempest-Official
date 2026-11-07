document.addEventListener("DOMContentLoaded", () => {
  // Clean, lightweight project filtering handler
  const filterPills = document.querySelectorAll(".filter-pill");
  const showcaseCards = document.querySelectorAll(".showcase-card");

  filterPills.forEach((pill) => {
    pill.addEventListener("click", function () {
      filterPills.forEach((p) => p.classList.remove("active"));
      this.classList.add("active");

      const filter = this.getAttribute("data-filter");

      showcaseCards.forEach((card) => {
        const categories = card.getAttribute("data-category");
        if (filter === "all" || categories.includes(filter)) {
          card.style.display = "flex";
        } else {
          card.style.display = "none";
        }
      });
    });
  });
});
