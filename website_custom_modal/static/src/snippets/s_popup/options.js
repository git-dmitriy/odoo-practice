/** @odoo-module **/

import options from "@web_editor/js/editor/snippets.options";

//noinspection JSVoidFunctionReturnValueUsed
options.registry.SnippetPopupCustomModal = options.Class.extend({
    // Initialize editor bindings and sync popup option panel state.
    start() {
        this.$bsTarget.on("click.SnippetPopupCustomModal", ".js_close_popup:not(a, .btn)", (ev) => {
            ev.stopPropagation();
            this.onTargetHide();
            this.trigger_up("snippet_option_visibility_update", {show: false});
        });
        this.$bsTarget.on("shown.bs.modal.SnippetPopupCustomModal", () => {
            this.trigger_up("snippet_option_visibility_update", {show: true});
            this.$target[0].querySelectorAll(".media_iframe_video").forEach((media) => {
                const iframe = media.querySelector("iframe");
                iframe.src = media.dataset.oeExpression || media.dataset.src;
            });
        });
        this.$bsTarget.on("hide.bs.modal.SnippetPopupCustomModal", () => {
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
        return this._super(...arguments);
    },
    // Remove editor bindings and stop any playing iframe media.
    destroy() {
        this._super(...arguments);
        this._removeIframeSrc();
        this.$bsTarget.off(".SnippetPopupCustomModal");
    },

    // Assign a fresh ID when the snippet is first inserted.
    onBuilt() {
        this._assignUniqueID();
        const popup = this.$target.closest(".s_popup_middle");
        if (popup && popup.attr("data-focus")) {
            popup.attr("data-bs-focus", popup.attr("data-focus"));
            popup[0].removeAttribute("data-focus");
        }
    },

    // Assign a fresh ID when the snippet is duplicated.
    onClone() {
        this._assignUniqueID();
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
            const rootPopupEl = this._getRootPopupEl();
            if (rootPopupEl && rootPopupEl.classList.contains("s_popup_custom_modal")) {
                rootPopupEl.classList.add("d-none");
            }
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

    // Toggle backdrop color according to the option checkbox value.
    setBackdrop(previewMode, widgetValue) {
        const color = widgetValue ? "var(--black-50)" : "";
        this.$target[0].style.setProperty("background-color", color, "important");
    },

    // Generate a unique DOM ID used by onClick/hash popup mode.
    _assignUniqueID() {
        this.$target.closest(".s_popup_custom_modal").attr("id", "sPopupCustomModal" + Date.now());
    },

    // Return current option state for controls that require it.
    _computeWidgetState(methodName) {
        switch (methodName) {
            case "moveBlock":
                return this.$target[0].closest("#o_shared_blocks") ? "allPages" : "currentPage";
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
        return this.$target[0].closest(".s_popup_custom_modal, .s_button_popup_custom_modal");
    },
});

//noinspection JSVoidFunctionReturnValueUsed
options.registry.SnippetButtonPopupCustomModal = options.registry.SnippetPopupCustomModal.extend({
    // Ensure initial editor state has synchronized IDs and sizing.
    start() {
        this._syncTriggerHref();
        this._applySizingFromDataset();
        return this._super(...arguments);
    },

    // Assign unique modal ID and link trigger button after insertion.
    onBuilt() {
        this._super(...arguments);
        this._syncTriggerHref();
        this._applySizingFromDataset();
    },

    // Rebuild IDs and trigger link when the snippet is cloned.
    onClone() {
        this._super(...arguments);
        this._syncTriggerHref();
        this._applySizingFromDataset();
    },

    // Generate a unique modal ID for button-triggered opening.
    _assignUniqueID() {
        const modalId = "sButtonPopupCustomModal" + Date.now();
        this.$target.attr("id", modalId);
        this._syncTriggerHref();
    },

    // Keep the trigger button hash target in sync with modal ID.
    _syncTriggerHref() {
        const rootEl = this.$target.closest(".s_button_popup_custom_modal");
        const triggerEl = rootEl.find(".s_button_popup_trigger")[0];
        const modalId = this.$target.attr("id");
        if (triggerEl && modalId) {
            triggerEl.setAttribute("href", `#${modalId}`);
        }
    },

    // Store and apply custom modal width when "Custom" width is selected.
    setModalWidth(previewMode, widgetValue) {
        const value = (widgetValue || "").trim();
        this.$target.attr("data-modal-width", value);
        this._applySizingFromDataset();
    },

    // Store and apply custom modal height when "Custom" height is selected.
    setModalHeight(previewMode, widgetValue) {
        const value = (widgetValue || "").trim();
        this.$target.attr("data-modal-height", value);
        this._applySizingFromDataset();
    },

    // Apply custom width/height values from data attributes to modal nodes.
    _applySizingFromDataset() {
        const modalEl = this.$target[0];
        if (!modalEl) {
            return;
        }
        const dialogEl = modalEl.querySelector(".modal-dialog");
        const contentEl = modalEl.querySelector(".modal-content");
        const widthValue = modalEl.dataset.modalWidth || "";
        const heightValue = modalEl.dataset.modalHeight || "";
        if (dialogEl) {
            dialogEl.style.maxWidth = widthValue;
        }
        if (contentEl) {
            contentEl.style.height = heightValue;
        }
    },
});
