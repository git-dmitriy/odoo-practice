/** @odoo-module **/

(function () {
    "use strict";

    const STORAGE_KEY = "website_theme_mode";
    const TOGGLE_BUTTON_ID = "theme_mode_toggle";
    const root = document.documentElement;

    function getSystemTheme() {
        return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }

    function getStoredTheme() {
        try {
            const value = window.localStorage.getItem(STORAGE_KEY);
            return value === "light" || value === "dark" ? value : null;
        } catch (e) {
            return null;
        }
    }

    function saveTheme(theme) {
        try {
            window.localStorage.setItem(STORAGE_KEY, theme);
        } catch (e) {
            // Ignore storage errors (private mode, blocked storage, etc.)
        }
    }

    function applyTheme(theme, source) {
        const normalizedTheme = theme === "dark" ? "dark" : "light";
        root.setAttribute("data-theme", normalizedTheme);
        root.setAttribute("data-bs-theme", normalizedTheme);
        if (document.body) {
            document.body.setAttribute("data-bs-theme", normalizedTheme);
        }
        root.classList.toggle("o_theme_dark", normalizedTheme === "dark");
        root.classList.toggle("o_theme_light", normalizedTheme === "light");
        updateButton(normalizedTheme, source);
    }

    function updateButton(theme, source) {
        const button = document.getElementById(TOGGLE_BUTTON_ID);
        if (!button) {
            return;
        }
        button.textContent = "Theme: " + theme + (source === "system" ? " (OS)" : "");
        button.setAttribute("aria-pressed", String(theme === "dark"));
    }

    function initTheme() {
        const storedTheme = getStoredTheme();
        if (storedTheme) {
            applyTheme(storedTheme, "saved");
            return;
        }
        applyTheme(getSystemTheme(), "system");
    }

    function bindToggle() {
        const button = document.getElementById(TOGGLE_BUTTON_ID);
        if (!button || button.dataset.bound === "1") {
            return;
        }
        button.dataset.bound = "1";
        button.addEventListener("click", function () {
            const currentTheme = root.getAttribute("data-theme") === "dark" ? "dark" : "light";
            const nextTheme = currentTheme === "dark" ? "light" : "dark";
            saveTheme(nextTheme);
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
})();
