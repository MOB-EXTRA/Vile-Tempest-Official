document.addEventListener("DOMContentLoaded", function () {
  const currentYear = new Date().getFullYear();
  const yearElements = document.querySelectorAll(".current-year");
  
  yearElements.forEach(element => {
    element.textContent = currentYear;
  });
});
