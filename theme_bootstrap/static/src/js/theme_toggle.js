(function () {
    "use strict";

    const STORAGE_KEY = "theme_bootstrap_mode";
    const root = document.documentElement;
    const TOGGLE_BUTTON_ID = "theme_mode_toggle";

    function getSystemTheme() {
        return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }

    function getSavedTheme() {
        return window.localStorage.getItem(STORAGE_KEY);
    }

    function setButtonLabel(theme, source) {
        const button = document.getElementById(TOGGLE_BUTTON_ID);
        if (!button) {
            return;
        }
        const suffix = source === "system" ? " (OS)" : "";
        button.textContent = "Theme: " + theme + suffix;
    }

    function applyTheme(theme, source) {
        const normalizedTheme = theme === "dark" ? "dark" : "light";
        // Keep both attributes in sync so Bootstrap and custom CSS can react.
        root.setAttribute("data-bs-theme", normalizedTheme);
        document.body.setAttribute("data-bs-theme", normalizedTheme);
        root.classList.toggle("o_theme_dark", normalizedTheme === "dark");
        root.classList.toggle("o_theme_light", normalizedTheme === "light");
        root.setAttribute("data-theme", normalizedTheme);
        setButtonLabel(normalizedTheme, source);
    }

    function initTheme() {
        const savedTheme = getSavedTheme();
        if (savedTheme === "light" || savedTheme === "dark") {
            applyTheme(savedTheme, "saved");
            return;
        }
        applyTheme(getSystemTheme(), "system");
    }

    function bindToggle() {
        if (document.body.dataset.themeToggleBound === "1") {
            return;
        }
        document.body.dataset.themeToggleBound = "1";
        document.addEventListener("click", function (event) {
            const target = event.target;
            if (!(target instanceof Element)) {
                return;
            }
            const button = target.closest("#" + TOGGLE_BUTTON_ID);
            if (!button) {
                return;
            }
            const currentTheme = root.getAttribute("data-theme") || getSystemTheme();
            const nextTheme = currentTheme === "dark" ? "light" : "dark";
            window.localStorage.setItem(STORAGE_KEY, nextTheme);
            applyTheme(nextTheme, "saved");
        });
    }

    function bootstrapThemeToggle() {
        initTheme();
        bindToggle();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", bootstrapThemeToggle);
    } else {
        bootstrapThemeToggle();
    }

    window.addEventListener("pageshow", bootstrapThemeToggle);
})();
