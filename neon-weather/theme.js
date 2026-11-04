(() => {
  const key = "neonWeatherTheme";
  let theme = localStorage.getItem(key);
  if (theme !== "light" && theme !== "dark") {
    theme = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  document.documentElement.dataset.theme = theme;

  function initializeToggle() {
    const button = document.getElementById("themeToggle");
    if (!button) return;
    const update = () => {
      const dark = document.documentElement.dataset.theme === "dark";
      button.textContent = dark ? "Light mode" : "Dark mode";
      button.setAttribute("aria-pressed", String(dark));
    };
    button.addEventListener("click", () => {
      theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = theme;
      localStorage.setItem(key, theme);
      update();
    });
    update();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeToggle, { once: true });
  } else {
    initializeToggle();
  }
})();
