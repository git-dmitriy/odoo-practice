/** @odoo-module **/

import options from "@web_editor/js/editor/snippets.options";
import {
    applyModalSizing,
    normalizeCssDimension,
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
        "scm_link_underline_none", "scm_link_underline_always", "scm_link_underline_hover",
        "fw-normal", "fw-semibold", "fw-bold",
        "fs-6", "fs-5", "fs-4",
    ],
    rootAlign: ["scm_trigger_align_left", "scm_trigger_align_center", "scm_trigger_align_right"],
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
        const classes = [`scm_link_underline_${state.triggerUnderline}`];
        if (state.triggerWeight !== "default") {
            classes.push(state.triggerWeight);
        }
        if (state.triggerTextSize !== "default") {
            classes.push(state.triggerTextSize);
        }
        return classes;
    },
});

function getRootPopup$(instance) {
    return instance.$target.closest(".s_button_popup_custom_modal");
}

//noinspection JSVoidFunctionReturnValueUsed
options.registry.SnippetButtonPopupCustomModal = options.Class.extend({
    // Initialize editor bindings and sync popup option panel state.
    start() {
        this.$bsTarget.on("click.SnippetButtonPopupCustomModal", ".js_close_popup:not(a, .btn)", (ev) => {
            ev.stopPropagation();
            this.onTargetHide();
            this.trigger_up("snippet_option_visibility_update", {show: false});
        });
        this.$bsTarget.on("shown.bs.modal.SnippetButtonPopupCustomModal", () => {
            this.trigger_up("snippet_option_visibility_update", {show: true});
            this.$target[0].querySelectorAll(".media_iframe_video").forEach((media) => {
                const iframe = media.querySelector("iframe");
                iframe.src = media.dataset.oeExpression || media.dataset.src;
            });
        });
        this.$bsTarget.on("hide.bs.modal.SnippetButtonPopupCustomModal", () => {
            this.trigger_up("snippet_option_visibility_update", {show: false});
            this._removeIframeSrc();
        });
        this._removeIframeSrc();
        const anchorWidget = this._requestUserValueWidgets("onclick_opt")[0];
        if (anchorWidget) {
            this.trigger_up("option_update", {
                optionName: "anchor",
                name: "modalAnchor",
                data: {
                    buttonEl: anchorWidget.el,
                },
            });
        }
        this._syncTriggerHref();
        syncModalSizingModesForApply(
            this.$target[0],
            this.$target[0]?.querySelector(".modal-dialog"),
            this.$target[0]?.querySelector(".modal-content"),
        );
        this._applySizingFromDataset();
        this._restoreTriggerState();
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
        this.$bsTarget.off(".SnippetButtonPopupCustomModal");
    },

    // Assign a fresh ID when the snippet is first inserted.
    onBuilt() {
        this._assignUniqueID();
        this._applySizingFromDataset();
        this._restoreTriggerState();
        const popup = this.$target.closest(".s_popup_middle");
        if (popup && popup.attr("data-focus")) {
            popup.attr("data-bs-focus", popup.attr("data-focus"));
            popup[0].removeAttribute("data-focus");
        }
    },

    // Assign a fresh ID when the snippet is duplicated.
    onClone() {
        this._assignUniqueID();
        this._applySizingFromDataset();
        this._restoreTriggerState();
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

    // Move popup between current-page and all-pages containers.
    moveBlock(previewMode, widgetValue) {
        const selector = widgetValue === "allPages" ? "#o_shared_blocks" : "main .oe_structure:o_editable";
        const whereEl = $(this.$target[0].ownerDocument).find(selector)[0];
        const popupEl = this._getRootPopupEl();
        if (whereEl && popupEl) {
            whereEl.prepend(popupEl);
        }
    },

    // Keep visual backdrop and Bootstrap close-on-backdrop behavior in sync.
    setBackdrop(previewMode, widgetValue) {
        const isBackdropEnabled = Boolean(widgetValue);
        const color = isBackdropEnabled ? "var(--black-50)" : "";
        this.$target[0].style.setProperty("background-color", color, "important");
        this.$target.attr("data-bs-backdrop", isBackdropEnabled ? "true" : "false");
    },

    // Generate a unique DOM ID used by onClick/hash popup mode.
    _assignUniqueID() {
        const modalId = "sButtonPopupCustomModal" + Date.now();
        this.$target.attr("id", modalId);
        this._syncTriggerHref();
    },

    // Return current option state for controls that require it.
    _computeWidgetState(methodName) {
        switch (methodName) {
            case "moveBlock":
                return this.$target[0].closest("#o_shared_blocks") ? "allPages" : "currentPage";
            case "setModalWidthMode":
                return this.$target[0].getAttribute("data-modal-width-mode") || "content";
            case "setModalHeightMode":
                return this.$target[0].getAttribute("data-modal-height-mode") || "content";
        }
        if (Object.prototype.hasOwnProperty.call(TRIGGER_FIELDS, methodName)) {
            return this._readTriggerField(methodName);
        }
        return this._super(...arguments);
    },

    // Stop embedded videos by clearing iframe sources.
    _removeIframeSrc() {
        this.$target.find(".media_iframe_video iframe").each((i, iframe) => {
            iframe.src = "";
        });
    },

    // Resolve the root popup wrapper for both popup snippet variants.
    _getRootPopupEl() {
        return getRootPopup$(this)[0];
    },

    _getRootPopup$() {
        return getRootPopup$(this);
    },

    _getTrigger$() {
        return this._getRootPopup$().find(".s_button_popup_trigger").first();
    },

    // Keep the trigger button hash target in sync with modal ID.
    _syncTriggerHref() {
        const triggerEl = this._getTrigger$()[0];
        const modalId = this.$target.attr("id");
        if (triggerEl && modalId) {
            triggerEl.setAttribute("href", `#${modalId}`);
        }
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

    // Update alignment class on root wrapper.
    triggerAlign(previewMode, widgetValue) {
        this._setTriggerField("triggerAlign", widgetValue);
    },

    // Restore defaults from persisted data attributes.
    _restoreTriggerState() {
        const rootEl = this._getRootPopup$()[0];
        if (!rootEl) {
            return;
        }
        this._collectNormalizedTriggerState(rootEl, {persist: true});
        this._normalizeTriggerClasses();
    },

    _normalizeTriggerFieldValue(fieldName, value) {
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
    },

    _readTriggerField(fieldName) {
        const rootEl = this._getRootPopup$()[0];
        if (!rootEl || !TRIGGER_FIELDS[fieldName]) {
            return TRIGGER_FIELDS[fieldName]?.default;
        }
        return this._collectNormalizedTriggerState(rootEl, {persist: true})[fieldName];
    },

    _getTriggerState(rootEl) {
        return this._collectNormalizedTriggerState(rootEl, {persist: true});
    },

    _collectNormalizedTriggerState(rootEl, {persist = false} = {}) {
        const state = {};
        for (const fieldName of Object.keys(TRIGGER_FIELDS)) {
            const field = TRIGGER_FIELDS[fieldName];
            const value = this._normalizeTriggerFieldValue(fieldName, rootEl.dataset[field.datasetKey]);
            if (persist) {
                rootEl.dataset[field.datasetKey] = value;
            }
            state[fieldName] = value;
        }
        return state;
    },

    _setTriggerField(fieldName, rawValue) {
        const rootEl = this._getRootPopup$()[0];
        const field = TRIGGER_FIELDS[fieldName];
        if (!rootEl || !field) {
            return;
        }
        rootEl.dataset[field.datasetKey] = this._normalizeTriggerFieldValue(fieldName, rawValue);
        this._normalizeTriggerClasses();
    },

    // Apply mode-specific class sets while removing conflicts.
    _normalizeTriggerClasses() {
        const $rootEl = this._getRootPopup$();
        const rootEl = $rootEl[0];
        if (!rootEl) {
            return;
        }
        const $triggerEl = this._getTrigger$();
        const triggerEl = $triggerEl[0];
        if (!triggerEl) {
            return;
        }
        const state = this._getTriggerState(rootEl);
        const mode = state.triggerMode === "link" ? "link" : "button";
        rootEl.dataset.triggerMode = mode;

        // 1) Clean conflicting classes by predefined groups.
        $triggerEl.removeClass(CLASS_GROUPS.trigger.join(" "));
        $rootEl.removeClass(CLASS_GROUPS.rootAlign.join(" "));

        // 2) Apply the current mode classes and root alignment.
        const modeClasses = MODE_RULES[mode](state);
        if (modeClasses.length) {
            $triggerEl.addClass(modeClasses.join(" "));
        }
        $rootEl.addClass(`scm_trigger_align_${state.triggerAlign}`);
    },
});
