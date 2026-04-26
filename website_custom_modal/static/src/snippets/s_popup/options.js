/** @odoo-module **/

import options from "@web_editor/js/editor/snippets.options";

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
        this._applySizingFromDataset();
        this._restoreTriggerState();
        return this._super(...arguments);
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
            case "triggerMode":
                return this._getRootPopupEl()?.dataset.triggerMode || "button";
            case "triggerVariant":
                return this._getRootPopupEl()?.dataset.triggerVariant || "btn-primary";
            case "triggerSize":
                return this._getRootPopupEl()?.dataset.triggerSize || "default";
            case "triggerShape":
                return this._getRootPopupEl()?.dataset.triggerShape || "default";
            case "triggerWidth":
                return this._getRootPopupEl()?.dataset.triggerWidth || "auto";
            case "triggerUnderline":
                return this._getRootPopupEl()?.dataset.triggerUnderline || "none";
            case "triggerWeight":
                return this._getRootPopupEl()?.dataset.triggerWeight || "fw-normal";
            case "triggerTextSize":
                return this._getRootPopupEl()?.dataset.triggerTextSize || "default";
            case "triggerAlign":
                return this._getRootPopupEl()?.dataset.triggerAlign || "left";
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
        return this.$target[0].closest(".s_button_popup_custom_modal");
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

    // Toggle trigger rendering mode and keep classes consistent.
    triggerMode(previewMode, widgetValue) {
        const rootEl = this._getRootPopupEl();
        if (!rootEl) {
            return;
        }
        const mode = widgetValue === "link" ? "link" : "button";
        rootEl.dataset.triggerMode = mode;
        this._normalizeTriggerClasses();
    },

    // Update Bootstrap button variant.
    triggerVariant(previewMode, widgetValue) {
        const rootEl = this._getRootPopupEl();
        if (!rootEl) {
            return;
        }
        rootEl.dataset.triggerVariant = widgetValue || "btn-primary";
        this._normalizeTriggerClasses();
    },

    // Update trigger size (button mode only).
    triggerSize(previewMode, widgetValue) {
        const rootEl = this._getRootPopupEl();
        if (!rootEl) {
            return;
        }
        rootEl.dataset.triggerSize = widgetValue || "default";
        this._normalizeTriggerClasses();
    },

    // Update trigger shape (button mode only).
    triggerShape(previewMode, widgetValue) {
        const rootEl = this._getRootPopupEl();
        if (!rootEl) {
            return;
        }
        rootEl.dataset.triggerShape = widgetValue || "default";
        this._normalizeTriggerClasses();
    },

    // Update trigger width mode.
    triggerWidth(previewMode, widgetValue) {
        const rootEl = this._getRootPopupEl();
        if (!rootEl) {
            return;
        }
        rootEl.dataset.triggerWidth = widgetValue || "auto";
        this._normalizeTriggerClasses();
    },

    // Update text decoration mode for link view.
    triggerUnderline(previewMode, widgetValue) {
        const rootEl = this._getRootPopupEl();
        if (!rootEl) {
            return;
        }
        rootEl.dataset.triggerUnderline = widgetValue || "none";
        this._normalizeTriggerClasses();
    },

    // Update weight class for link view.
    triggerWeight(previewMode, widgetValue) {
        const rootEl = this._getRootPopupEl();
        if (!rootEl) {
            return;
        }
        rootEl.dataset.triggerWeight = widgetValue || "fw-normal";
        this._normalizeTriggerClasses();
    },

    // Update text size class for link view.
    triggerTextSize(previewMode, widgetValue) {
        const rootEl = this._getRootPopupEl();
        if (!rootEl) {
            return;
        }
        rootEl.dataset.triggerTextSize = widgetValue || "default";
        this._normalizeTriggerClasses();
    },

    // Update alignment class on root wrapper.
    triggerAlign(previewMode, widgetValue) {
        const rootEl = this._getRootPopupEl();
        if (!rootEl) {
            return;
        }
        rootEl.dataset.triggerAlign = widgetValue || "left";
        this._normalizeTriggerClasses();
    },

    // Restore defaults from persisted data attributes.
    _restoreTriggerState() {
        const rootEl = this._getRootPopupEl();
        if (!rootEl) {
            return;
        }
        rootEl.dataset.triggerMode = rootEl.dataset.triggerMode || "button";
        rootEl.dataset.triggerVariant = rootEl.dataset.triggerVariant || "btn-primary";
        rootEl.dataset.triggerSize = rootEl.dataset.triggerSize || "default";
        rootEl.dataset.triggerShape = rootEl.dataset.triggerShape || "default";
        rootEl.dataset.triggerWidth = rootEl.dataset.triggerWidth || "auto";
        rootEl.dataset.triggerUnderline = rootEl.dataset.triggerUnderline || "none";
        rootEl.dataset.triggerWeight = rootEl.dataset.triggerWeight || "fw-normal";
        rootEl.dataset.triggerTextSize = rootEl.dataset.triggerTextSize || "default";
        rootEl.dataset.triggerAlign = rootEl.dataset.triggerAlign || "left";
        this._normalizeTriggerClasses();
    },

    // Apply mode-specific class sets while removing conflicts.
    _normalizeTriggerClasses() {
        const rootEl = this._getRootPopupEl();
        if (!rootEl) {
            return;
        }
        const triggerEl = rootEl.querySelector(".s_button_popup_trigger");
        if (!triggerEl) {
            return;
        }
        const mode = rootEl.dataset.triggerMode || "button";
        const variant = rootEl.dataset.triggerVariant || "btn-primary";
        const size = rootEl.dataset.triggerSize || "default";
        const shape = rootEl.dataset.triggerShape || "default";
        const width = rootEl.dataset.triggerWidth || "auto";
        const underline = rootEl.dataset.triggerUnderline || "none";
        const weight = rootEl.dataset.triggerWeight || "fw-normal";
        const textSize = rootEl.dataset.triggerTextSize || "default";
        const align = rootEl.dataset.triggerAlign || "left";

        const buttonVariants = [
            "btn-primary", "btn-secondary", "btn-success", "btn-warning", "btn-danger",
            "btn-info", "btn-light", "btn-dark",
        ];
        const buttonSizes = ["btn-sm", "btn-lg"];
        const buttonShapes = ["rounded-0", "rounded", "rounded-pill"];
        const triggerWidths = ["w-100"];
        const linkUnderlines = ["scm_link_underline_none", "scm_link_underline_always", "scm_link_underline_hover"];
        const linkWeights = ["fw-normal", "fw-semibold", "fw-bold"];
        const linkSizes = ["fs-6", "fs-5", "fs-4"];
        const alignClasses = ["scm_trigger_align_left", "scm_trigger_align_center", "scm_trigger_align_right"];

        triggerEl.classList.remove("btn", ...buttonVariants, ...buttonSizes, ...buttonShapes, ...triggerWidths, ...linkUnderlines, ...linkWeights, ...linkSizes);
        rootEl.classList.remove(...alignClasses);

        if (mode === "button") {
            triggerEl.classList.add("btn", variant);
            if (size !== "default") {
                triggerEl.classList.add(size);
            }
            if (shape !== "default") {
                triggerEl.classList.add(shape);
            }
            if (width === "w-100") {
                triggerEl.classList.add("w-100");
            }
        } else {
            triggerEl.classList.add("scm_link_underline_" + underline);
            if (weight !== "default") {
                triggerEl.classList.add(weight);
            }
            if (textSize !== "default") {
                triggerEl.classList.add(textSize);
            }
        }
        rootEl.classList.add("scm_trigger_align_" + align);
    },
});
