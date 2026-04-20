/** @odoo-module **/

export function setDragPayload(event, payload) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("application/json", JSON.stringify(payload));
}

export function getDragPayload(event) {
    const raw = event.dataTransfer.getData("application/json");
    if (!raw) {
        return null;
    }
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}
