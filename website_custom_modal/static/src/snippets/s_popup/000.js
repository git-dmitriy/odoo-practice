/** @odoo-module **/

import publicWidget from "@web/legacy/js/public/public_widget";
import { cookie } from "@web/core/browser/cookie";
import { throttleForAnimation } from "@web/core/utils/timing";
import { utils as uiUtils, SIZES } from "@web/core/ui/ui_service";

//noinspection JSVoidFunctionReturnValueUsed
const PopupWidget = publicWidget.Widget.extend({
    selector: ".s_button_popup_custom_modal",
    events: {
        "click .js_close_popup": "_onCloseClick",
        "click .modal .btn-primary": "_onBtnPrimaryClick",
        "hide.bs.modal": "_onHideModal",
        "show.bs.modal": "_onShowModal",
    },
    cookieValue: true,

    // Initialize trigger mode and bind the appropriate popup behavior.
    start() {
        this._applyModalSizing();
        this.modalShownOnClickEl = this.el.querySelector(".modal[data-display='onClick']");
        if (this.modalShownOnClickEl) {
            this.__onHashChange = this._onHashChange.bind(this);
            window.addEventListener("hashchange", this.__onHashChange);
            this._showPopupOnClick();
        } else {
            this._popupAlreadyShown = !!cookie.get(this.$el.attr("id"));
            const isMobile = uiUtils.getSize() < SIZES.LG;
            const emptyPopup = [...this.$el[0].querySelectorAll(".oe_structure > *:not(.s_popup_close)")].every((el) => {
                const visibilitySelectors = el.dataset.visibilitySelectors;
                const deviceInvisible = isMobile
                    ? el.classList.contains("o_snippet_mobile_invisible")
                    : el.classList.contains("o_snippet_desktop_invisible");
                return (visibilitySelectors && el.matches(visibilitySelectors)) || deviceInvisible;
            });
            if (!this._popupAlreadyShown && !emptyPopup) {
                this._bindPopup();
            }
        }
        return this._super(...arguments);
    },

    // Remove listeners/timeouts and close modal on widget teardown.
    destroy() {
        this._super(...arguments);
        $(document).off("mouseleave.open_popup_custom_modal");
        this.$el.find(".modal").modal("hide");
        clearTimeout(this.timeout);
        if (this.modalShownOnClickEl) {
            window.removeEventListener("hashchange", this.__onHashChange);
        }
    },

    // Attach delay or mouse-exit trigger based on popup settings.
    _bindPopup() {
        const $main = this.$el.find(".modal");
        let display = $main.data("display");
        let delay = $main.data("showAfter");

        if (uiUtils.isSmall() && display === "mouseExit") {
            display = "afterDelay";
            delay = 5000;
        }

        if (display === "afterDelay") {
            this.timeout = setTimeout(() => this._showPopup(), delay);
        } else if (display === "mouseExit") {
            $(document).on("mouseleave.open_popup_custom_modal", () => this._showPopup());
        }
    },
    // Hook for feature-specific show conditions.
    _canShowPopup() {
        return true;
    },
    // Hide the Bootstrap modal instance.
    _hidePopup() {
        this.$el.find(".modal").modal("hide");
    },
    // Show popup if allowed and not already displayed.
    _showPopup() {
        if (this._popupAlreadyShown || !this._canShowPopup()) {
            return;
        }
        this._applyModalSizing();
        this.$el.find(".modal").modal("show");
    },
    // Open popup when current URL hash matches modal ID.
    _showPopupOnClick() {
        const hash = window.location.hash;
        if (hash && hash.substring(1) === this.modalShownOnClickEl.id) {
            const urlWithoutHash = window.location.href.replace(hash, "");
            window.history.replaceState(null, null, urlWithoutHash);
            this._showPopup();
        }
    },
    // Prevent auto-close when primary button is a form submit action.
    _canBtnPrimaryClosePopup(primaryBtnEl) {
        return !(
            primaryBtnEl.classList.contains("s_website_form_send") ||
            primaryBtnEl.classList.contains("o_website_form_send")
        );
    },

    // Close popup from dedicated close icon click.
    _onCloseClick() {
        this._hidePopup();
    },
    // Close popup from primary button click when permitted.
    _onBtnPrimaryClick(ev) {
        if (this._canBtnPrimaryClosePopup(ev.target)) {
            this._hidePopup();
        }
    },
    // Persist consent cookie and stop embedded videos on hide.
    _onHideModal() {
        const nbDays = this.$el.find(".modal").data("consentsDuration");
        cookie.set(this.el.id, this.cookieValue, nbDays * 24 * 60 * 60, "required");
        this._popupAlreadyShown = true && !this.modalShownOnClickEl;

        this.$el.find(".media_iframe_video iframe").each((i, iframe) => {
            iframe.src = "";
        });
    },
    // Restore embedded videos when popup becomes visible.
    _onShowModal() {
        this._applyModalSizing();
        this.el.querySelectorAll(".media_iframe_video").forEach((media) => {
            const iframe = media.querySelector("iframe");
            iframe.src = media.dataset.oeExpression || media.dataset.src;
        });
    },
    // Re-check hash-triggered popup when URL hash changes.
    _onHashChange() {
        this._showPopupOnClick();
    },
    // Apply saved sizing modes from data attributes (caps in SCSS).
    _applyModalSizing() {
        const modalEl = this.el.querySelector(".modal");
        if (!modalEl) {
            return;
        }
        const dialogEl = modalEl.querySelector(".modal-dialog");
        const contentEl = modalEl.querySelector(".modal-content");
        const widthValue = (modalEl.dataset.modalWidth || "").trim();
        const heightValue = (modalEl.dataset.modalHeight || "").trim();
        const widthModeAttr = modalEl.getAttribute("data-modal-width-mode") || "";
        const heightModeAttr = modalEl.getAttribute("data-modal-height-mode") || "";
        const presetWidthClasses = [
            "scm_width_sm",
            "scm_width_md",
            "scm_width_lg",
            "scm_width_xl",
            "scm_width_full",
        ];
        const hasDialogPresetWidth =
            dialogEl && presetWidthClasses.some((cls) => dialogEl.classList.contains(cls));
        const hasDialogCustomWidth = dialogEl && dialogEl.classList.contains("scm_width_custom");
        const presetHeightClasses = [
            "scm_height_auto",
            "scm_height_compact",
            "scm_height_medium",
            "scm_height_tall",
        ];
        const hasDialogPresetHeight =
            contentEl && presetHeightClasses.some((cls) => contentEl.classList.contains(cls));
        const hasDialogCustomHeight = contentEl && contentEl.classList.contains("scm_height_custom");
        if (dialogEl) {
            if (widthModeAttr === "custom" || hasDialogCustomWidth) {
                dialogEl.style.width = widthValue;
                dialogEl.style.maxWidth = "";
            } else if (
                widthModeAttr === "content" &&
                !hasDialogPresetWidth &&
                !hasDialogCustomWidth
            ) {
                dialogEl.style.width = "fit-content";
                dialogEl.style.maxWidth = "";
            } else {
                dialogEl.style.width = "";
                dialogEl.style.maxWidth = "";
            }
        }
        if (contentEl) {
            if (heightModeAttr === "custom" || hasDialogCustomHeight) {
                contentEl.style.height = heightValue;
                contentEl.style.maxHeight = "";
            } else if (
                heightModeAttr === "content" &&
                !hasDialogPresetHeight &&
                !hasDialogCustomHeight
            ) {
                contentEl.style.height = "auto";
                contentEl.style.maxHeight = "";
            } else {
                contentEl.style.height = "";
                contentEl.style.maxHeight = "";
            }
        }
    },
});

publicWidget.registry.PopupCustomModal = PopupWidget;

//noinspection JSVoidFunctionReturnValueUsed
const noBackdropPopupWidget = publicWidget.Widget.extend({
    selector: ".s_button_popup_custom_modal .s_popup_no_backdrop",
    disabledInEditableMode: false,
    events: {
        "shown.bs.modal": "_onModalNoBackdropShown",
        "hide.bs.modal": "_onModalNoBackdropHide",
    },

    // Prepare throttled scrollbar updates and attach edit-mode handlers.
    start() {
        this.throttledUpdateScrollbar = throttleForAnimation(() => this._updateScrollbar());
        if (this.editableMode && this.el.classList.contains("show")) {
            this._updateScrollbar();
            this._addModalNoBackdropEvents();
        }
        return this._super(...arguments);
    },
    // Remove no-backdrop listeners and restore default scrollbar behavior.
    destroy() {
        this._super(...arguments);
        this._removeModalNoBackdropEvents();
        window.dispatchEvent(new Event("resize"));
    },

    // Adjust page/modal scrollbar depending on modal content overflow.
    _updateScrollbar() {
        const modalContent = this.el.querySelector(".modal-content");
        const isOverflowing = $(modalContent).hasScrollableContent();
        const modalInstance = window.Modal.getInstance(this.el);
        if (isOverflowing) {
            modalInstance._adjustDialog();
        } else {
            modalInstance._resetAdjustments();
        }
    },
    // Start tracking layout changes that impact no-backdrop scrolling.
    _addModalNoBackdropEvents() {
        window.addEventListener("resize", this.throttledUpdateScrollbar);
        this.resizeObserver = new window.ResizeObserver(() => {
            this._updateScrollbar();
        });
        this.resizeObserver.observe(this.el.querySelector(".modal-content"));
    },
    // Stop tracking resize/content changes for no-backdrop mode.
    _removeModalNoBackdropEvents() {
        this.throttledUpdateScrollbar.cancel();
        window.removeEventListener("resize", this.throttledUpdateScrollbar);
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            delete this.resizeObserver;
        }
    },

    // Activate scrollbar management once no-backdrop modal is shown.
    _onModalNoBackdropShown() {
        this._updateScrollbar();
        this._addModalNoBackdropEvents();
    },
    // Cleanup no-backdrop listeners before modal fully hides.
    _onModalNoBackdropHide() {
        this._removeModalNoBackdropEvents();
    },
});

publicWidget.registry.NoBackdropPopupCustomModal = noBackdropPopupWidget;

export default PopupWidget;
