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
        this.trigger_up("option_update", {
            optionName: "anchor",
            name: "modalAnchor",
            data: {
                buttonEl: this._requestUserValueWidgets("onclick_opt")[0].el,
            },
        });
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
            this.$target[0].closest(".s_popup_custom_modal").classList.add("d-none");
            this.$bsTarget.modal("hide");
        });
    },

    // Move popup between current-page and all-pages containers.
    moveBlock(previewMode, widgetValue) {
        const selector = widgetValue === "allPages" ? "#o_shared_blocks" : "main .oe_structure:o_editable";
        const whereEl = $(this.$target[0].ownerDocument).find(selector)[0];
        const popupEl = this.$target[0].closest(".s_popup_custom_modal");
        whereEl.prepend(popupEl);
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
});
