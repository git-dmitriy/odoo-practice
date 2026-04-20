/** @odoo-module **/

import {Component, useState} from "@odoo/owl";
import {Dialog} from "@web/core/dialog/dialog";

export class LeadFormDialog extends Component {
    static template = "owl_crm_board.LeadFormDialog";
    static components = {Dialog};
    static props = {
        close: Function,
        title: String,
        stages: Array,
        defaultStageId: Number,
        lead: {type: Object, optional: true},
        onSave: Function,
    };

    setup() {
        const lead = this.props.lead || {};
        const defaultStageId = (lead.stage_id && lead.stage_id[0]) || this.props.defaultStageId || false;
        this.form = useState({
            name: lead.name || "",
            partner_name: lead.partner_name || "",
            expected_revenue: lead.expected_revenue || 0,
            priority: lead.priority || "1",
            description: lead.description || "",
            stage_id: defaultStageId,
        });
        this.state = useState({
            saving: false,
            error: defaultStageId ? "" : "Stage is required. Create a stage first.",
        });
    }

    async onSubmit(event) {
        event.preventDefault();
        if (!this.form.name.trim()) {
            this.state.error = "Name is required.";
            return;
        }
        if (!this.form.stage_id) {
            this.state.error = "Stage is required.";
            return;
        }
        this.state.saving = true;
        this.state.error = "";
        try {
            await this.props.onSave({
                ...this.form,
                name: this.form.name.trim(),
                expected_revenue: Number(this.form.expected_revenue || 0),
            });
            this.props.close();
        } catch (error) {
            this.state.error = error.message || "Failed to save lead.";
        } finally {
            this.state.saving = false;
        }
    }
}
