/** @odoo-module **/

// Mirrors data-set-modal-width-mode / data-set-modal-height-mode on snippet we-buttons (s_custom_modal.xml).
// Width classes live on .modal-dialog, height classes — on .modal-content.
// Order matters: custom > preset_* > content (more specific wins on conflicts).

const CUSTOM_MODAL_WIDTH_CSS_VAR = "--wcm-modal-w";
const CUSTOM_MODAL_HEIGHT_CSS_VAR = "--wcm-modal-h";

const WIDTH_CLASS_TO_MODE = [
    ["wcm_width_custom", "custom"],
    ["wcm_width_sm", "preset_w_sm"],
    ["wcm_width_md", "preset_w_md"],
    ["wcm_width_lg", "preset_w_lg"],
    ["wcm_width_xl", "preset_w_xl"],
    ["wcm_width_full", "preset_w_full"],
    ["wcm_width_content", "content"],
];

const HEIGHT_CLASS_TO_MODE = [
    ["wcm_height_custom", "custom"],
    ["wcm_height_auto", "preset_h_auto"],
    ["wcm_height_compact", "preset_h_compact"],
    ["wcm_height_medium", "preset_h_medium"],
    ["wcm_height_tall", "preset_h_tall"],
    ["wcm_height_content", "content"],
];

/** Stop embedded iframe videos by clearing their src. */
export function clearEmbeddedIframes(rootEl) {
    if (!rootEl) {
        return;
    }
    rootEl.querySelectorAll(".media_iframe_video iframe").forEach((iframe) => {
        iframe.src = "";
    });
}

/** Restore embedded iframe videos from their data-oe-expression / data-src. */
export function restoreEmbeddedIframes(rootEl) {
    if (!rootEl) {
        return;
    }
    rootEl.querySelectorAll(".media_iframe_video").forEach((media) => {
        const iframe = media.querySelector("iframe");
        if (iframe) {
            iframe.src = media.dataset.oeExpression || media.dataset.src || "";
        }
    });
}

/** Normalize bare numbers to px for valid CSS width/height. */
export function normalizeCssDimension(value) {
    const v = (value || "").trim();
    if (!v) {
        return "";
    }
    if (/^[\d.]+$/.test(v)) {
        return `${v}px`;
    }
    return v;
}

/**
 * Read custom width from .modal (snippet target) or fallback .modal-dialog (legacy editor apply-to).
 */
export function readModalWidthValue(modalEl, dialogEl) {
    for (const el of [modalEl, dialogEl]) {
        if (!el) {
            continue;
        }
        let v = (el.getAttribute("data-modal-width") || "").trim();
        if (!v && el.dataset && el.dataset.modalWidth != null) {
            v = String(el.dataset.modalWidth).trim();
        }
        if (v) {
            return normalizeCssDimension(v);
        }
    }
    return "";
}

/**
 * Read custom height from .modal or fallback .modal-content (legacy editor apply-to).
 */
export function readModalHeightValue(modalEl, contentEl) {
    for (const el of [modalEl, contentEl]) {
        if (!el) {
            continue;
        }
        let v = (el.getAttribute("data-modal-height") || "").trim();
        if (!v && el.dataset && el.dataset.modalHeight != null) {
            v = String(el.dataset.modalHeight).trim();
        }
        if (v) {
            return normalizeCssDimension(v);
        }
    }
    return "";
}

function readModeFromClasses(el, mapping) {
    if (!el) {
        return "";
    }
    for (const [cls, mode] of mapping) {
        if (el.classList.contains(cls)) {
            return mode;
        }
    }
    return "";
}

/**
 * Reconcile .modal data-modal-width-mode / data-modal-height-mode with sizing classes
 * present on .modal-dialog / .modal-content. Class is the source of truth; if no
 * known class is present, the existing attribute is left untouched.
 */
export function syncModalDataModesFromSizingClasses(modalEl, dialogEl, contentEl) {
    if (!modalEl) {
        return;
    }
    const widthMode = readModeFromClasses(dialogEl, WIDTH_CLASS_TO_MODE);
    if (widthMode) {
        modalEl.setAttribute("data-modal-width-mode", widthMode);
    }
    const heightMode = readModeFromClasses(contentEl, HEIGHT_CLASS_TO_MODE);
    if (heightMode) {
        modalEl.setAttribute("data-modal-height-mode", heightMode);
    }
}

/**
 * Sync data-modal-*-mode on .modal from sizing classes on .modal-dialog / .modal-content,
 * align mode when custom class and dimension data disagree, then drop dimension data
 * attributes whenever the effective mode is not custom (keeps DOM in sync with presets).
 */
export function syncModalSizingModesForApply(modalEl, dialogEl, contentEl) {
    if (!modalEl) {
        return;
    }
    const widthValue = readModalWidthValue(modalEl, dialogEl);
    const heightValue = readModalHeightValue(modalEl, contentEl);

    syncModalDataModesFromSizingClasses(modalEl, dialogEl, contentEl);

    if (
        widthValue &&
        dialogEl?.classList.contains("wcm_width_custom") &&
        modalEl.getAttribute("data-modal-width-mode") !== "custom"
    ) {
        modalEl.setAttribute("data-modal-width-mode", "custom");
    }
    if (
        heightValue &&
        contentEl?.classList.contains("wcm_height_custom") &&
        modalEl.getAttribute("data-modal-height-mode") !== "custom"
    ) {
        modalEl.setAttribute("data-modal-height-mode", "custom");
    }

    const widthMode = modalEl.getAttribute("data-modal-width-mode") || "";
    const heightMode = modalEl.getAttribute("data-modal-height-mode") || "";
    if (widthMode !== "custom") {
        modalEl.removeAttribute("data-modal-width");
        dialogEl?.removeAttribute("data-modal-width");
    }
    if (heightMode !== "custom") {
        modalEl.removeAttribute("data-modal-height");
        contentEl?.removeAttribute("data-modal-height");
    }
}

/**
 * Apply current modal sizing according to:
 * - sizing classes on .modal-dialog / .modal-content (preset modes)
 * - data-modal-width / data-modal-height (custom values)
 *
 * This keeps the DOM dataset consistent (sync/cleanup) and applies custom values
 * via CSS variables used in SCSS.
 */
export function applyModalSizing(modalEl) {
    if (!modalEl) {
        return;
    }
    const dialogEl = modalEl.querySelector(".modal-dialog");
    const contentEl = modalEl.querySelector(".modal-content");

    // Ensure mode + dimension attributes are consistent with sizing classes.
    syncModalSizingModesForApply(modalEl, dialogEl, contentEl);

    const widthValue = readModalWidthValue(modalEl, dialogEl);
    const heightValue = readModalHeightValue(modalEl, contentEl);
    if (widthValue) {
        modalEl.setAttribute("data-modal-width", widthValue);
    }
    if (heightValue) {
        modalEl.setAttribute("data-modal-height", heightValue);
    }

    const widthModeAttr = modalEl.getAttribute("data-modal-width-mode") || "";
    const heightModeAttr = modalEl.getAttribute("data-modal-height-mode") || "";

    if (dialogEl) {
        if (widthModeAttr === "custom") {
            if (widthValue) {
                dialogEl.style.setProperty(CUSTOM_MODAL_WIDTH_CSS_VAR, widthValue);
            } else {
                dialogEl.style.removeProperty(CUSTOM_MODAL_WIDTH_CSS_VAR);
            }
        } else {
            dialogEl.style.removeProperty(CUSTOM_MODAL_WIDTH_CSS_VAR);
        }
    }
    if (contentEl) {
        if (heightModeAttr === "custom") {
            if (heightValue) {
                contentEl.style.setProperty(CUSTOM_MODAL_HEIGHT_CSS_VAR, heightValue);
            } else {
                contentEl.style.removeProperty(CUSTOM_MODAL_HEIGHT_CSS_VAR);
            }
        } else {
            contentEl.style.removeProperty(CUSTOM_MODAL_HEIGHT_CSS_VAR);
        }
    }
}
