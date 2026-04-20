/** @odoo-module **/

import {Component, useState} from "@odoo/owl";

const FILTERS_KEY = "owl_crm_board.filters";

export class BoardToolbar extends Component {
    static template = "owl_crm_board.BoardToolbar";
    static props = {
        onFiltersChanged: Function,
        onCreate: Function,
    };

    setup() {
        const stored = this.loadFilters();
        this.filters = useState(stored);
        this.timeoutId = null;
    }

    loadFilters() {
        const fallback = {query: "", priority: "all", sortBy: "priority"};
        try {
            const raw = localStorage.getItem(FILTERS_KEY);
            if (!raw) {
                return fallback;
            }
            return {...fallback, ...JSON.parse(raw)};
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

    onPriorityChanged(event) {
        this.filters.priority = event.target.value;
        this.emitWithDebounce();
    }

    onSortChanged(event) {
        this.filters.sortBy = event.target.value;
        this.emitWithDebounce();
    }
}
