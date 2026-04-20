/** @odoo-module **/

import {Component, onWillStart, onWillUnmount, useState} from "@odoo/owl";

const FILTERS_KEY = "owl_todo.filters";
const DONE_VALUES = new Set(["all", "open", "done"]);

export class TodoToolbar extends Component {
    static template = "owl_todo.TodoToolbar";
    static props = {
        onFiltersChanged: Function,
        onCreate: Function,
        onRefresh: Function,
    };

    setup() {
        const stored = this.loadFilters();
        this.filters = useState(stored);
        this.timeoutId = null;

        onWillStart(() => {
            this.props.onFiltersChanged({...this.filters});
        });

        onWillUnmount(() => {
            if (this.timeoutId) {
                clearTimeout(this.timeoutId);
                this.timeoutId = null;
            }
        });
    }

    loadFilters() {
        const fallback = {query: "", done: "all"};
        try {
            const raw = localStorage.getItem(FILTERS_KEY);
            if (!raw) {
                return fallback;
            }
            const parsed = JSON.parse(raw);
            const done = DONE_VALUES.has(parsed.done) ? parsed.done : fallback.done;
            const query = typeof parsed.query === "string" ? parsed.query : fallback.query;
            return {...fallback, query, done};
        } catch {
            return fallback;
        }
    }

    saveFilters() {
        localStorage.setItem(FILTERS_KEY, JSON.stringify(this.filters));
    }

    emitWithDebounce() {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
        }
        this.timeoutId = setTimeout(() => {
            this.saveFilters();
            this.props.onFiltersChanged({...this.filters});
        }, 200);
    }

    onSearchInput(event) {
        this.filters.query = event.target.value;
        this.emitWithDebounce();
    }

    onDoneChanged(event) {
        this.filters.done = event.target.value;
        this.emitWithDebounce();
    }
}
