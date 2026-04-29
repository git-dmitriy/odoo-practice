/** @odoo-module **/

import options from "@web_editor/js/editor/snippets.options";
import {
    applyModalSizing,
    clearEmbeddedIframes,
    normalizeCssDimension,
    restoreEmbeddedIframes,
    syncModalSizingModesForApply,
} from "./sizing_mode_sync";

const TRIGGER_FIELDS = Object.freeze({
    triggerMode: {
        datasetKey: "triggerMode",
        default: "button",
        allowedValues: ["button", "link"],
    },
    triggerVariant: {
        datasetKey: "triggerVariant",
        default: "btn-primary",
        allowedValues: ["btn-primary", "btn-secondary", "btn-success", "btn-warning", "btn-danger", "btn-info", "btn-light", "btn-dark"],
    },
    triggerSize: {
        datasetKey: "triggerSize",
        default: "default",
        allowedValues: ["default", "btn-sm", "btn-lg"],
    },
    triggerShape: {
        datasetKey: "triggerShape",
        default: "default",
        allowedValues: ["default", "rounded-0", "rounded", "rounded-pill"],
    },
    triggerWidth: {
        datasetKey: "triggerWidth",
        default: "auto",
        allowedValues: ["auto", "w-100"],
    },
    triggerUnderline: {
        datasetKey: "triggerUnderline",
        default: "none",
        allowedValues: ["none", "always", "hover"],
    },
    triggerWeight: {
        datasetKey: "triggerWeight",
        default: "fw-normal",
        allowedValues: ["fw-normal", "fw-semibold", "fw-bold"],
    },
    triggerTextSize: {
        datasetKey: "triggerTextSize",
        default: "default",
        allowedValues: ["default", "fs-6", "fs-5", "fs-4"],
    },
    triggerAlign: {
        datasetKey: "triggerAlign",
        default: "left",
        allowedValues: ["left", "center", "right"],
    },
});

const CLASS_GROUPS = Object.freeze({
    trigger: [
        "btn",
        "btn-primary", "btn-secondary", "btn-success", "btn-warning", "btn-danger", "btn-info", "btn-light", "btn-dark",
        "btn-sm", "btn-lg",
        "rounded-0", "rounded", "rounded-pill",
        "w-100",
        "wcm_link_underline_none", "wcm_link_underline_always", "wcm_link_underline_hover",
        "fw-normal", "fw-semibold", "fw-bold",
        "fs-6", "fs-5", "fs-4",
    ],
    rootAlign: ["wcm_trigger_align_left", "wcm_trigger_align_center", "wcm_trigger_align_right"],
});

const MODE_RULES = Object.freeze({
    button: (state) => {
        const classes = ["btn", state.triggerVariant];
        if (state.triggerSize !== "default") {
            classes.push(state.triggerSize);
        }
        if (state.triggerShape !== "default") {
            classes.push(state.triggerShape);
        }
        if (state.triggerWidth === "w-100") {
            classes.push("w-100");
        }
        return classes;
    },
    link: (state) => {
        const classes = [`wcm_link_underline_${state.triggerUnderline}`];
        for (const fieldName of ["triggerWeight", "triggerTextSize"]) {
            const value = state[fieldName];
            if (value && value !== TRIGGER_FIELDS[fieldName].default) {
                classes.push(value);
            }
        }
        return classes;
    },
});

// Normalize a single field value (trim, fall back to default if empty / not allowed).
function normalizeTriggerFieldValue(fieldName, value) {
    const field = TRIGGER_FIELDS[fieldName];
    if (!field) {
        return value;
    }
    const normalized = (value || "").trim();
    if (!normalized) {
        return field.default;
    }
    if (field.allowedValues && !field.allowedValues.includes(normalized)) {
        return field.default;
    }
    return normalized;
}

// Read the full trigger state from an element's dataset (no DOM writes).
function readTriggerStateFromDataset(el) {
    const state = {};
    if (!el) {
        for (const fieldName of Object.keys(TRIGGER_FIELDS)) {
            state[fieldName] = TRIGGER_FIELDS[fieldName].default;
        }
        return state;
    }
    for (const fieldName of Object.keys(TRIGGER_FIELDS)) {
        const field = TRIGGER_FIELDS[fieldName];
        state[fieldName] = normalizeTriggerFieldValue(fieldName, el.dataset[field.datasetKey]);
    }
    return state;
}

// Persist a normalized state back to an element's dataset.
function persistTriggerStateToDataset(el, state) {
    if (!el) {
        return;
    }
    for (const fieldName of Object.keys(TRIGGER_FIELDS)) {
        el.dataset[TRIGGER_FIELDS[fieldName].datasetKey] = state[fieldName];
    }
}

// Apply mode-specific class sets while removing conflicts.
// rootEl may be null when the trigger lives outside .s_custom_modal — in that
// case alignment classes are not written anywhere.
function normalizeTriggerClasses(triggerEl, rootEl) {
    if (!triggerEl) {
        return;
    }
    const state = readTriggerStateFromDataset(triggerEl);

    triggerEl.classList.remove(...CLASS_GROUPS.trigger);
    if (rootEl) {
        rootEl.classList.remove(...CLASS_GROUPS.rootAlign);
    }

    const modeClasses = MODE_RULES[state.triggerMode](state);
    if (modeClasses.length) {
        triggerEl.classList.add(...modeClasses);
    }
    if (rootEl) {
        rootEl.classList.add(`wcm_trigger_align_${state.triggerAlign}`);
    }
}

//noinspection JSVoidFunctionReturnValueUsed
options.registry.SnippetCustomModal = options.Class.extend({
    // Initialize editor bindings and sync popup option panel state.
    start() {
        this.$bsTarget.on("click.SnippetCustomModal", ".js_close_popup:not(a, .btn)", (ev) => {
            ev.stopPropagation();
            this.onTargetHide();
            this.trigger_up("snippet_option_visibility_update", {show: false});
        });
        this.$bsTarget.on("shown.bs.modal.SnippetCustomModal", () => {
            this.trigger_up("snippet_option_visibility_update", {show: true});
            restoreEmbeddedIframes(this.$target[0]);
        });
        this.$bsTarget.on("hide.bs.modal.SnippetCustomModal", () => {
            this.trigger_up("snippet_option_visibility_update", {show: false});
            this._removeIframeSrc();
        });
        this._removeIframeSrc();
        this._syncTriggerHref();
        syncModalSizingModesForApply(
            this.$target[0],
            this.$target[0]?.querySelector(".modal-dialog"),
            this.$target[0]?.querySelector(".modal-content"),
        );
        this._applySizingFromDataset();
        return this._super(...arguments);
    },
    // Re-apply custom sizing after editor-triggered updates.
    notify(name) {
        const result = this._super(...arguments);
        if (name === "option_update" || name === "cover_update" || name === "covers_update") {
            this._applySizingFromDataset();
        }
        return result;
    },
    // Remove editor bindings and stop any playing iframe media.
    destroy() {
        this._super(...arguments);
        this._removeIframeSrc();
        this.$bsTarget.off(".SnippetCustomModal");
    },

    // Assign a fresh ID when the snippet is first inserted.
    onBuilt() {
        this._assignUniqueID();
        this._applySizingFromDataset();
    },

    // Assign a fresh ID when the snippet is duplicated.
    onClone() {
        this._assignUniqueID();
        this._applySizingFromDataset();
    },

    // Preview the popup by opening its Bootstrap modal in editor mode.
    async onTargetShow() {
        this.$bsTarget.modal("show");
        $(this.$target[0].ownerDocument.body).children(".modal-backdrop:last").addClass("d-none");
    },

    // Hide popup preview and wait for the modal hidden lifecycle.
    async onTargetHide() {
        return new Promise((resolve) => {
            const timeoutID = setTimeout(() => {
                this.$bsTarget.off("hidden.bs.modal.popup_on_target_hide");
                resolve();
            }, 500);
            this.$bsTarget.one("hidden.bs.modal.popup_on_target_hide", () => {
                clearTimeout(timeoutID);
                resolve();
            });
            this.$bsTarget.modal("hide");
        });
    },

    // Keep visual backdrop and Bootstrap close-on-backdrop behavior in sync.
    setBackdrop(previewMode, widgetValue) {
        const isBackdropEnabled = Boolean(widgetValue);
        const color = isBackdropEnabled ? "var(--black-50)" : "";
        this.$target[0].style.setProperty("background-color", color, "important");
        this.$target.attr("data-bs-backdrop", isBackdropEnabled ? "true" : "false");
    },

    // Generate a unique DOM ID used by onClick/hash popup mode.
    // Re-points only descendant triggers (those still living inside the wrapper);
    // standalone triggers placed elsewhere on the page keep their original href.
    _assignUniqueID() {
        const prevId = this.$target.attr("id");
        const suffix = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
        const newId = `sButtonPopupCustomModal${suffix}`;
        this.$target.attr("id", newId);
        this._syncTriggerHref(prevId, newId);
    },

    // Return current option state for controls that require it.
    _computeWidgetState(methodName) {
        switch (methodName) {
            case "setModalWidthMode":
                return this.$target[0].getAttribute("data-modal-width-mode") || "content";
            case "setModalHeightMode":
                return this.$target[0].getAttribute("data-modal-height-mode") || "content";
        }
        return this._super(...arguments);
    },

    // Stop embedded videos by clearing iframe sources.
    _removeIframeSrc() {
        clearEmbeddedIframes(this.$target[0]);
    },

    // Re-target descendant triggers to the (possibly updated) modal id.
    // $target is the .modal (via data-target=".modal"), so we climb to the
    // .s_custom_modal wrapper first, then look for triggers inside it.
    // When prevId is provided, only triggers pointing at it are updated; this
    // preserves the contract that external triggers stay on their original modal.
    _syncTriggerHref(prevId, explicitNewId) {
        const newId = explicitNewId || this.$target.attr("id");
        if (!newId) {
            return;
        }
        const $descendants = this.$target
            .closest(".s_custom_modal")
            .find(".s_button_popup_trigger");
        const $toRetarget = prevId
            ? $descendants.filter(`[href="#${prevId}"]`)
            : $descendants;
        $toRetarget.attr("href", `#${newId}`);
    },

    // Store and apply custom modal width when "Custom" width is selected.
    setModalWidth(previewMode, widgetValue) {
        const value = normalizeCssDimension((widgetValue || "").trim());
        this.$target.attr("data-modal-width", value);
        this.$target.attr("data-modal-width-mode", "custom");
        this._applySizingFromDataset();
    },

    // Store and apply custom modal height when "Custom" height is selected.
    setModalHeight(previewMode, widgetValue) {
        const value = normalizeCssDimension((widgetValue || "").trim());
        this.$target.attr("data-modal-height", value);
        this.$target.attr("data-modal-height-mode", "custom");
        this._applySizingFromDataset();
    },

    // Persist current width sizing mode (only when widget supplied a value).
    setModalWidthMode(previewMode, widgetValue) {
        this._setModalMode("data-modal-width-mode", widgetValue);
    },

    // Persist current height sizing mode (only when widget supplied a value).
    setModalHeightMode(previewMode, widgetValue) {
        this._setModalMode("data-modal-height-mode", widgetValue);
    },

    _setModalMode(attrName, widgetValue) {
        const value = (widgetValue || "").trim();
        if (value) {
            this.$target.attr(attrName, value);
        }
        this._applySizingFromDataset();
    },

    // Apply custom width/height through CSS variables while mode stays in data attributes.
    _applySizingFromDataset() {
        applyModalSizing(this.$target[0]);
    },
});

//noinspection JSVoidFunctionReturnValueUsed
options.registry.SnippetCustomModalTrigger = options.Class.extend({
    // Re-persist normalized state, then refresh trigger classes.
    start() {
        const triggerEl = this.$target[0];
        const rootEl = this._getRootPopup$()[0] || null;
        persistTriggerStateToDataset(triggerEl, readTriggerStateFromDataset(triggerEl));
        normalizeTriggerClasses(triggerEl, rootEl);
        return this._super(...arguments);
    },

    // Resolve the .s_custom_modal that owns this trigger, either by DOM ancestry
    // (trigger inside its wrapper) or by following the href to the modal id.
    _getRootPopup$() {
        const direct = this.$target.closest(".s_custom_modal");
        if (direct.length) {
            return direct;
        }
        const href = this.$target.attr("href") || "";
        if (!href.startsWith("#")) {
            return $();
        }
        const modalEl = this.$target[0].ownerDocument.getElementById(href.slice(1));
        return modalEl ? $(modalEl).closest(".s_custom_modal") : $();
    },

    // Hide alignment widget when no .s_custom_modal wrapper hosts the trigger:
    // alignment is applied to the wrapper, so it has no effect when detached.
    async _computeWidgetVisibility(widgetName, params) {
        if (widgetName === "trigger_align") {
            return Boolean(this._getRootPopup$().length);
        }
        return this._super(...arguments);
    },

    // Return current value for trigger field controls.
    _computeWidgetState(methodName) {
        if (Object.prototype.hasOwnProperty.call(TRIGGER_FIELDS, methodName)) {
            return normalizeTriggerFieldValue(methodName, this.$target[0].dataset[TRIGGER_FIELDS[methodName].datasetKey]);
        }
        return this._super(...arguments);
    },

    // Toggle trigger rendering mode and keep classes consistent.
    triggerMode(previewMode, widgetValue) {
        this._setTriggerField("triggerMode", widgetValue);
    },

    // Update Bootstrap button variant.
    triggerVariant(previewMode, widgetValue) {
        this._setTriggerField("triggerVariant", widgetValue);
    },

    // Update trigger size (button mode only).
    triggerSize(previewMode, widgetValue) {
        this._setTriggerField("triggerSize", widgetValue);
    },

    // Update trigger shape (button mode only).
    triggerShape(previewMode, widgetValue) {
        this._setTriggerField("triggerShape", widgetValue);
    },

    // Update trigger width mode.
    triggerWidth(previewMode, widgetValue) {
        this._setTriggerField("triggerWidth", widgetValue);
    },

    // Update text decoration mode for link view.
    triggerUnderline(previewMode, widgetValue) {
        this._setTriggerField("triggerUnderline", widgetValue);
    },

    // Update weight class for link view.
    triggerWeight(previewMode, widgetValue) {
        this._setTriggerField("triggerWeight", widgetValue);
    },

    // Update text size class for link view.
    triggerTextSize(previewMode, widgetValue) {
        this._setTriggerField("triggerTextSize", widgetValue);
    },

    // Update alignment (only effective when trigger lives inside a wrapper).
    triggerAlign(previewMode, widgetValue) {
        this._setTriggerField("triggerAlign", widgetValue);
    },

    _setTriggerField(fieldName, rawValue) {
        const field = TRIGGER_FIELDS[fieldName];
        if (!field) {
            return;
        }
        const triggerEl = this.$target[0];
        const rootEl = this._getRootPopup$()[0] || null;
        triggerEl.dataset[field.datasetKey] = normalizeTriggerFieldValue(fieldName, rawValue);
        normalizeTriggerClasses(triggerEl, rootEl);
    },
});
