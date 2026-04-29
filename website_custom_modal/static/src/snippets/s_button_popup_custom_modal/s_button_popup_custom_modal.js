/** @odoo-module **/

import publicWidget from "@web/legacy/js/public/public_widget";
import { cookie } from "@web/core/browser/cookie";
import { throttleForAnimation } from "@web/core/utils/timing";
import { utils as uiUtils, SIZES } from "@web/core/ui/ui_service";
import {
    applyModalSizing,
    clearEmbeddedIframes,
    restoreEmbeddedIframes,
} from "./sizing_mode_sync";

//noinspection JSVoidFunctionReturnValueUsed
const PopupWidget = publicWidget.Widget.extend({
    selector: ".s_button_popup_custom_modal",
    events: {
        "click .js_close_popup": "_onCloseClick",
        "keydown .js_close_popup": "_onCloseKeydown",
        "click .modal .btn-primary": "_onBtnPrimaryClick",
        "hide.bs.modal": "_onHideModal",
        "show.bs.modal": "_onShowModal",
    },
    cookieValue: true,

    // Initialize trigger mode and bind the appropriate popup behavior.
    start() {
        applyModalSizing(this._getModalEl());
        this.modalShownOnClickEl = this.el.querySelector(".modal[data-display='onClick']");
        if (this.modalShownOnClickEl) {
            this.__onHashChange = this._onHashChange.bind(this);
            window.addEventListener("hashchange", this.__onHashChange);
            this._showPopupOnClick();
        } else {
            this._popupAlreadyShown = Boolean(cookie.get(this._getWidgetCookieKey()));
            const isMobile = uiUtils.getSize() < SIZES.LG;
            const emptyPopup = this._isPopupContentEmpty(isMobile);
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

    _getModalEl() {
        return this.el.querySelector(".modal");
    },

    _getWidgetCookieKey() {
        return this.el.id;
    },

    _isPopupContentEmpty(isMobile) {
        return [...this.$el[0].querySelectorAll(".oe_structure > *:not(.s_custom_popup_close)")].every((el) => {
            const visibilitySelectors = el.dataset.visibilitySelectors;
            const hiddenByDevice = isMobile
                ? el.classList.contains("o_snippet_mobile_invisible")
                : el.classList.contains("o_snippet_desktop_invisible");
            return (visibilitySelectors && el.matches(visibilitySelectors)) || hiddenByDevice;
        });
    },

    _resetEmbeddedIframes() {
        clearEmbeddedIframes(this.el);
    },

    _restoreEmbeddedIframes() {
        restoreEmbeddedIframes(this.el);
    },

    _getHashModalId() {
        const hash = window.location.hash;
        if (!hash) {
            return "";
        }
        return hash.substring(1);
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
        applyModalSizing(this._getModalEl());
        this.$el.find(".modal").modal("show");
    },
    // Open popup when current URL hash matches modal ID.
    _showPopupOnClick() {
        const hash = window.location.hash;
        if (this._getHashModalId() === this.modalShownOnClickEl.id) {
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
    // Close popup via keyboard (Enter / Space) on the close icon for a11y.
    _onCloseKeydown(ev) {
        if (ev.key === "Enter" || ev.key === " " || ev.key === "Spacebar") {
            ev.preventDefault();
            this._hidePopup();
        }
    },
    // Close popup from primary button click when permitted.
    _onBtnPrimaryClick(ev) {
        if (this._canBtnPrimaryClosePopup(ev.target)) {
            this._hidePopup();
        }
    },
    // Persist consent cookie and stop embedded videos on hide.
    _onHideModal() {
        const rawDays = this.$el.find(".modal").data("consentsDuration");
        const nbDays = Number(rawDays) > 0 ? Number(rawDays) : 7;
        cookie.set(this._getWidgetCookieKey(), this.cookieValue, nbDays * 24 * 60 * 60, "required");
        this._popupAlreadyShown = !this.modalShownOnClickEl;
        this._resetEmbeddedIframes();
    },
    // Restore embedded videos when popup becomes visible.
    _onShowModal() {
        applyModalSizing(this._getModalEl());
        this._restoreEmbeddedIframes();
    },
    // Re-check hash-triggered popup when URL hash changes.
    _onHashChange() {
        this._showPopupOnClick();
    },
});

publicWidget.registry.PopupCustomModal = PopupWidget;

//noinspection JSVoidFunctionReturnValueUsed
const noBackdropPopupWidget = publicWidget.Widget.extend({
    selector: ".s_button_popup_custom_modal .s_custom_popup_no_backdrop",
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
