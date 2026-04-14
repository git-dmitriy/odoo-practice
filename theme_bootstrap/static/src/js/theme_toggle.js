(function () {
    "use strict";

    const STORAGE_KEY = "theme_bootstrap_mode";
    const root = document.documentElement;

    function getSystemTheme() {
        return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }

    function getSavedTheme() {
        return window.localStorage.getItem(STORAGE_KEY);
    }

    function setButtonLabel(theme, source) {
        const button = document.getElementById("theme_mode_toggle");
        if (!button) {
            return;
        }
        const suffix = source === "system" ? " (OS)" : "";
        button.textContent = "Theme: " + theme + suffix;
    }

    function applyTheme(theme, source) {
        root.setAttribute("data-theme", theme);
        setButtonLabel(theme, source);
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
        const button = document.getElementById("theme_mode_toggle");
        if (!button) {
            return;
        }
        button.addEventListener("click", function () {
            const currentTheme = root.getAttribute("data-theme") || getSystemTheme();
            const nextTheme = currentTheme === "dark" ? "light" : "dark";
            window.localStorage.setItem(STORAGE_KEY, nextTheme);
            applyTheme(nextTheme, "saved");
        });
    }

    document.addEventListener("DOMContentLoaded", function () {
        initTheme();
        bindToggle();
    });
})();
