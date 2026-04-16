/** @odoo-module **/

import { Component, onMounted, useState, xml } from "@odoo/owl";
import { mount, whenReady } from "@odoo/owl";

const STORAGE_KEY = "theme_bootstrap_mode";

export class ThemeToggle extends Component {
    static template = xml/* xml */ `
        <div class="container py-2 text-end">
            <button type="button" class="btn btn-outline-secondary btn-sm" t-on-click="onClick">
                <t t-esc="label"/>
            </button>
        </div>
    `;

    setup() {
        this.state = useState({
            effectiveTheme: "light",
            source: "system",
        });

        onMounted(() => {
            this.initTheme();
        });
    }

    get label() {
        const suffix = this.state.source === "system" ? " (OS)" : "";
        return `Theme: ${this.state.effectiveTheme}${suffix}`;
    }

    getSystemTheme() {
        return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }

    getSavedTheme() {
        try {
            return window.localStorage.getItem(STORAGE_KEY);
        } catch {
            return null;
        }
    }

    setSavedTheme(theme) {
        try {
            window.localStorage.setItem(STORAGE_KEY, theme);
        } catch {
            // ignore
        }
    }

    applyTheme(theme, source) {
        const normalizedTheme = theme === "dark" ? "dark" : "light";
        const root = document.documentElement;
        root.setAttribute("data-theme", normalizedTheme);
        root.setAttribute("data-bs-theme", normalizedTheme);
        document.body?.setAttribute("data-bs-theme", normalizedTheme);
        root.classList.toggle("o_theme_dark", normalizedTheme === "dark");
        root.classList.toggle("o_theme_light", normalizedTheme === "light");

        this.state.effectiveTheme = normalizedTheme;
        this.state.source = source;
    }

    initTheme() {
        const savedTheme = this.getSavedTheme();
        if (savedTheme === "light" || savedTheme === "dark") {
            this.applyTheme(savedTheme, "saved");
        } else {
            this.applyTheme(this.getSystemTheme(), "system");
        }
    }

    onClick() {
        const nextTheme = this.state.effectiveTheme === "dark" ? "light" : "dark";
        this.setSavedTheme(nextTheme);
        this.applyTheme(nextTheme, "saved");
    }
}

whenReady(() => {
    const target = document.getElementById("theme_bootstrap_theme_toggle");
    if (!target) return;
    mount(ThemeToggle, target, { props: {} });
});

