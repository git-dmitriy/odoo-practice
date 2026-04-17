/** @odoo-module **/

(function () {
    "use strict";

    const TOGGLE_BUTTON_ID = "theme_mode_toggle_cookies";
    const root = document.documentElement;

    function getSystemTheme() {
        return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }

    function saveThemeServer(theme) {
        const payload = new URLSearchParams({ mode: theme });
        return fetch("/theme_bootstrap_cookies/set_theme_mode", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
            },
            credentials: "same-origin",
            body: payload.toString(),
        })
            .then(function (response) {
                if (!response.ok) {
                    console.warn(
                        "[theme_bootstrap_cookies] Failed to persist theme mode on server. HTTP status:",
                        response.status
                    );
                }
            })
            .catch(function (error) {
                console.warn("[theme_bootstrap_cookies] Failed to persist theme mode on server.", error);
                // Keep UX responsive even if persistence request fails.
        });
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
        const sunIcon = button.querySelector(".theme-icon-sun");
        const moonIcon = button.querySelector(".theme-icon-moon");
        if (sunIcon && moonIcon) {
            sunIcon.classList.toggle("d-none", theme !== "light");
            moonIcon.classList.toggle("d-none", theme !== "dark");
        }
        const label = theme === "dark" ? "Switch to light theme" : "Switch to dark theme";
        button.setAttribute("aria-label", label);
        button.setAttribute("title", source === "system" ? label + " (OS default)" : label);
        button.setAttribute("aria-pressed", String(theme === "dark"));
    }

    function initTheme() {
        const currentTheme = root.getAttribute("data-theme");
        if (currentTheme === "light" || currentTheme === "dark") {
            applyTheme(currentTheme, "saved");
        } else {
            applyTheme(getSystemTheme(), "system");
        }
    }

    function bindToggle() {
        if (document.body.dataset.themeToggleCookiesBound === "1") {
            return;
        }
        document.body.dataset.themeToggleCookiesBound = "1";
        document.addEventListener("click", function (event) {
            const target = event.target;
            if (!(target instanceof Element)) {
                return;
            }
            const button = target.closest("#" + TOGGLE_BUTTON_ID);
            if (!button) {
                return;
            }
            const currentTheme = root.getAttribute("data-theme") === "dark" ? "dark" : "light";
            const nextTheme = currentTheme === "dark" ? "light" : "dark";
            applyTheme(nextTheme, "saved");
            saveThemeServer(nextTheme);
        });
    }

    function moveToggleIntoNavbarIfPresent() {
        const toggleContainer = document.querySelector(".theme-toggle-navbar-cookies");
        const nav = document.querySelector("header nav");
        if (!toggleContainer || !nav) {
            return;
        }
        nav.appendChild(toggleContainer);
        toggleContainer.classList.remove("container", "py-2");
        toggleContainer.classList.add("ms-auto");
    }

    function bootstrapThemeToggle() {
        moveToggleIntoNavbarIfPresent();
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
