/** @odoo-module **/

import publicWidget from "@web/legacy/js/public/public_widget";
import { cookie } from "@web/core/browser/cookie";
import { throttleForAnimation } from "@web/core/utils/timing";
import { utils as uiUtils, SIZES } from "@web/core/ui/ui_service";

const SharedPopupWidget = publicWidget.Widget.extend({
    selector: ".s_popup_custom_modal",
    disabledInEditableMode: false,
    events: {
        "show.bs.modal": "_onModalShow",
        "hidden.bs.modal": "_onModalHidden",
    },

    destroy() {
        this._super(...arguments);
        if (!this.editableMode) {
            this.el.classList.add("d-none");
        }
    },

    _onModalShow() {
        this.el.classList.remove("d-none");
    },
    _onModalHidden() {
        if (this.el.querySelector(".s_popup_no_backdrop")) {
            $().getScrollingElement()[0].dispatchEvent(new Event("scroll"));
        }
        this.el.classList.add("d-none");
    },
});

publicWidget.registry.SharedPopupCustomModal = SharedPopupWidget;

const PopupWidget = publicWidget.Widget.extend({
    selector: ".s_popup_custom_modal",
    events: {
        "click .js_close_popup": "_onCloseClick",
        "click .btn-primary": "_onBtnPrimaryClick",
        "hide.bs.modal": "_onHideModal",
        "show.bs.modal": "_onShowModal",
    },
    cookieValue: true,

    start() {
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
    destroy() {
        this._super(...arguments);
        $(document).off("mouseleave.open_popup_custom_modal");
        this.$el.find(".modal").modal("hide");
        clearTimeout(this.timeout);
        if (this.modalShownOnClickEl) {
            window.removeEventListener("hashchange", this.__onHashChange);
        }
    },

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
    _canShowPopup() {
        return true;
    },
    _hidePopup() {
        this.$el.find(".modal").modal("hide");
    },
    _showPopup() {
        if (this._popupAlreadyShown || !this._canShowPopup()) {
            return;
        }
        this.$el.find(".modal").modal("show");
    },
    _showPopupOnClick() {
        const hash = window.location.hash;
        if (hash && hash.substring(1) === this.modalShownOnClickEl.id) {
            const urlWithoutHash = window.location.href.replace(hash, "");
            window.history.replaceState(null, null, urlWithoutHash);
            this._showPopup();
        }
    },
    _canBtnPrimaryClosePopup(primaryBtnEl) {
        return !(
            primaryBtnEl.classList.contains("s_website_form_send") ||
            primaryBtnEl.classList.contains("o_website_form_send")
        );
    },

    _onCloseClick() {
        this._hidePopup();
    },
    _onBtnPrimaryClick(ev) {
        if (this._canBtnPrimaryClosePopup(ev.target)) {
            this._hidePopup();
        }
    },
    _onHideModal() {
        const nbDays = this.$el.find(".modal").data("consentsDuration");
        cookie.set(this.el.id, this.cookieValue, nbDays * 24 * 60 * 60, "required");
        this._popupAlreadyShown = true && !this.modalShownOnClickEl;

        this.$el.find(".media_iframe_video iframe").each((i, iframe) => {
            iframe.src = "";
        });
    },
    _onShowModal() {
        this.el.querySelectorAll(".media_iframe_video").forEach((media) => {
            const iframe = media.querySelector("iframe");
            iframe.src = media.dataset.oeExpression || media.dataset.src;
        });
    },
    _onHashChange() {
        this._showPopupOnClick();
    },
});

publicWidget.registry.PopupCustomModal = PopupWidget;

const noBackdropPopupWidget = publicWidget.Widget.extend({
    selector: ".s_popup_custom_modal .s_popup_no_backdrop",
    disabledInEditableMode: false,
    events: {
        "shown.bs.modal": "_onModalNoBackdropShown",
        "hide.bs.modal": "_onModalNoBackdropHide",
    },

    start() {
        this.throttledUpdateScrollbar = throttleForAnimation(() => this._updateScrollbar());
        if (this.editableMode && this.el.classList.contains("show")) {
            this._updateScrollbar();
            this._addModalNoBackdropEvents();
        }
        return this._super(...arguments);
    },
    destroy() {
        this._super(...arguments);
        this._removeModalNoBackdropEvents();
        window.dispatchEvent(new Event("resize"));
    },

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
    _addModalNoBackdropEvents() {
        window.addEventListener("resize", this.throttledUpdateScrollbar);
        this.resizeObserver = new window.ResizeObserver(() => {
            this._updateScrollbar();
        });
        this.resizeObserver.observe(this.el.querySelector(".modal-content"));
    },
    _removeModalNoBackdropEvents() {
        this.throttledUpdateScrollbar.cancel();
        window.removeEventListener("resize", this.throttledUpdateScrollbar);
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            delete this.resizeObserver;
        }
    },

    _onModalNoBackdropShown() {
        this._updateScrollbar();
        this._addModalNoBackdropEvents();
    },
    _onModalNoBackdropHide() {
        this._removeModalNoBackdropEvents();
    },
});

publicWidget.registry.NoBackdropPopupCustomModal = noBackdropPopupWidget;

export default PopupWidget;
