/** @odoo-module **/

export function makeInitialBoardState() {
    return {
        stages: [],
        leads: [],
        loading: false,
        error: "",
        query: "",
        priority: "all",
        sortBy: "priority",
    };
}

export function groupLeadsByStage(stages, leads, filters) {
    const grouped = {};
    for (const stage of stages) {
        grouped[stage.id] = [];
    }

    const normalizedQuery = (filters.query || "").trim().toLowerCase();
    const filtered = leads.filter((lead) => {
        const name = (lead.name || "").toLowerCase();
        const customer = (lead.partner_name || "").toLowerCase();
        const queryOk = !normalizedQuery || name.includes(normalizedQuery) || customer.includes(normalizedQuery);
        const priorityOk = filters.priority === "all" || lead.priority === filters.priority;
        return queryOk && priorityOk;
    });

    for (const lead of filtered) {
        const stage = lead.stage_id && lead.stage_id[0];
        if (stage && grouped[stage]) {
            grouped[stage].push(lead);
        }
    }

    for (const stageId of Object.keys(grouped)) {
        grouped[stageId].sort((a, b) => {
            if (filters.sortBy === "name") {
                return (a.name || "").localeCompare(b.name || "");
            }
            return Number(b.priority || 0) - Number(a.priority || 0);
        });
    }
    return grouped;
}
