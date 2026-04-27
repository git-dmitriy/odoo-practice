/** @odoo-module **/

// Mirrors data-set-modal-width-mode / data-set-modal-height-mode on snippet we-buttons (s_popup.xml).
// Width classes live on .modal-dialog, height classes — on .modal-content.
// Order matters: custom > preset_* > content (more specific wins on conflicts).

const WIDTH_CLASS_TO_MODE = [
    ["scm_width_custom", "custom"],
    ["scm_width_sm", "preset_w_sm"],
    ["scm_width_md", "preset_w_md"],
    ["scm_width_lg", "preset_w_lg"],
    ["scm_width_xl", "preset_w_xl"],
    ["scm_width_full", "preset_w_full"],
    ["scm_width_content", "content"],
];

const HEIGHT_CLASS_TO_MODE = [
    ["scm_height_custom", "custom"],
    ["scm_height_auto", "preset_h_auto"],
    ["scm_height_compact", "preset_h_compact"],
    ["scm_height_medium", "preset_h_medium"],
    ["scm_height_tall", "preset_h_tall"],
    ["scm_height_content", "content"],
];

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
        dialogEl?.classList.contains("scm_width_custom") &&
        modalEl.getAttribute("data-modal-width-mode") !== "custom"
    ) {
        modalEl.setAttribute("data-modal-width-mode", "custom");
    }
    if (
        heightValue &&
        contentEl?.classList.contains("scm_height_custom") &&
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
