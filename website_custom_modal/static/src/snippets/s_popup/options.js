/** @odoo-module **/

import options from "@web_editor/js/editor/snippets.options";

options.registry.SnippetPopupCustomModal = options.Class.extend({
    start() {
        this.$bsTarget.on("click.SnippetPopupCustomModal", ".js_close_popup:not(a, .btn)", (ev) => {
            ev.stopPropagation();
            this.onTargetHide();
            this.trigger_up("snippet_option_visibility_update", { show: false });
        });
        this.$bsTarget.on("shown.bs.modal.SnippetPopupCustomModal", () => {
            this.trigger_up("snippet_option_visibility_update", { show: true });
            this.$target[0].querySelectorAll(".media_iframe_video").forEach((media) => {
                const iframe = media.querySelector("iframe");
                iframe.src = media.dataset.oeExpression || media.dataset.src;
            });
        });
        this.$bsTarget.on("hide.bs.modal.SnippetPopupCustomModal", () => {
            this.trigger_up("snippet_option_visibility_update", { show: false });
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
    destroy() {
        this._super(...arguments);
        this._removeIframeSrc();
        this.$bsTarget.off(".SnippetPopupCustomModal");
    },
    onBuilt() {
        this._assignUniqueID();
        const popup = this.$target.closest(".s_popup_middle");
        if (popup && popup.attr("data-focus")) {
            popup.attr("data-bs-focus", popup.attr("data-focus"));
            popup[0].removeAttribute("data-focus");
        }
    },
    onClone() {
        this._assignUniqueID();
    },
    async onTargetShow() {
        this.$bsTarget.modal("show");
        $(this.$target[0].ownerDocument.body).children(".modal-backdrop:last").addClass("d-none");
    },
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

    moveBlock(previewMode, widgetValue) {
        const selector = widgetValue === "allPages" ? "#o_shared_blocks" : "main .oe_structure:o_editable";
        const whereEl = $(this.$target[0].ownerDocument).find(selector)[0];
        const popupEl = this.$target[0].closest(".s_popup_custom_modal");
        whereEl.prepend(popupEl);
    },
    setBackdrop(previewMode, widgetValue) {
        const color = widgetValue ? "var(--black-50)" : "";
        this.$target[0].style.setProperty("background-color", color, "important");
    },

    _assignUniqueID() {
        this.$target.closest(".s_popup_custom_modal").attr("id", "sPopupCustomModal" + Date.now());
    },
    _computeWidgetState(methodName) {
        switch (methodName) {
            case "moveBlock":
                return this.$target[0].closest("#o_shared_blocks") ? "allPages" : "currentPage";
        }
        return this._super(...arguments);
    },
    _removeIframeSrc() {
        this.$target.find(".media_iframe_video iframe").each((i, iframe) => {
            iframe.src = "";
        });
    },
});
