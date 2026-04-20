/** @odoo-module **/

export class BoardApi {
    constructor(env) {
        this.orm = env.services.orm;
    }

    async loadStages() {
        return this.orm.searchRead(
            "owl.crm.stage",
            [],
            ["name", "sequence", "fold"],
            {order: "sequence,id"}
        );
    }

    async loadLeads() {
        return this.orm.searchRead(
            "owl.crm.lead",
            [["active", "=", true]],
            ["name", "partner_name", "expected_revenue", "priority", "description", "stage_id", "active"]
        );
    }

    async createLead(values) {
        return this.orm.create("owl.crm.lead", [values]);
    }

    async updateLead(leadId, values) {
        return this.orm.write("owl.crm.lead", [leadId], values);
    }

    async archiveLead(leadId) {
        return this.updateLead(leadId, {active: false});
    }

    async moveLead(leadId, stageId) {
        return this.updateLead(leadId, {stage_id: stageId});
    }
}
