/** @odoo-module **/

import {Component, onWillStart, useState} from "@odoo/owl";
import {useService} from "@web/core/utils/hooks";
import {ConfirmationDialog} from "@web/core/confirmation_dialog/confirmation_dialog";
import {BoardApi} from "../../services/board_api";
import {groupLeadsByStage, makeInitialBoardState} from "../../store/board_store";
import {BoardToolbar} from "../toolbar/toolbar";
import {BoardColumn} from "../column/column";
import {LeadFormDialog} from "../lead_form_dialog/lead_form_dialog";

export class Board extends Component {
    static template = "owl_crm_board.Board";
    static components = {BoardToolbar, BoardColumn};

    setup() {
        this.notification = useService("notification");
        this.dialog = useService("dialog");
        this.state = useState(makeInitialBoardState());
        this.api = new BoardApi(this.env);
        this.loadRequestId = 0;
        this.loadData = this.loadData.bind(this);
        this.onFiltersChanged = this.onFiltersChanged.bind(this);
        this.openCreateDialog = this.openCreateDialog.bind(this);
        this.openEditDialog = this.openEditDialog.bind(this);
        this.askArchiveLead = this.askArchiveLead.bind(this);
        this.onMoveLead = this.onMoveLead.bind(this);

        onWillStart(async () => {
            await this.loadData();
        });
    }

    get groupedLeads() {
        return groupLeadsByStage(this.state.stages, this.state.leads, {
            query: this.state.query,
            priority: this.state.priority,
            sortBy: this.state.sortBy,
        });
    }

    get hasLeads() {
        return this.state.leads.length > 0;
    }

    async loadData() {
        const requestId = ++this.loadRequestId;
        this.state.loading = true;
        this.state.error = "";
        try {
            const [stages, leads] = await Promise.all([this.api.loadStages(), this.api.loadLeads()]);
            if (requestId !== this.loadRequestId) {
                return;
            }
            this.state.stages = stages;
            this.state.leads = leads;
        } catch (error) {
            if (requestId !== this.loadRequestId) {
                return;
            }
            this.state.error = error.message || "Failed to load board.";
        } finally {
            if (requestId !== this.loadRequestId) {
                return;
            }
            this.state.loading = false;
        }
    }

    onFiltersChanged(filters) {
        this.state.query = filters.query;
        this.state.priority = filters.priority;
        this.state.sortBy = filters.sortBy;
    }

    openCreateDialog(stageId) {
        this.dialog.add(LeadFormDialog, {
            title: "Create lead",
            stages: this.state.stages,
            defaultStageId: stageId || (this.state.stages[0] && this.state.stages[0].id),
            onSave: async (values) => {
                await this.api.createLead(values);
                this.notification.add("Lead created", {type: "success"});
                await this.loadData();
            },
        });
    }

    openEditDialog(lead) {
        this.dialog.add(LeadFormDialog, {
            title: "Edit lead",
            stages: this.state.stages,
            lead,
            defaultStageId: lead.stage_id && lead.stage_id[0],
            onSave: async (values) => {
                await this.api.updateLead(lead.id, values);
                this.notification.add("Lead updated", {type: "success"});
                await this.loadData();
            },
        });
    }

    askArchiveLead(lead) {
        this.dialog.add(ConfirmationDialog, {
            body: `Archive "${lead.name}"?`,
            confirmLabel: "Archive",
            confirm: async () => {
                await this.api.archiveLead(lead.id);
                this.notification.add("Lead archived", {type: "success"});
                await this.loadData();
            },
        });
    }

    async onMoveLead({leadId, targetStageId}) {
        const leadsSnapshot = this.state.leads.map((item) => ({...item}));
        const lead = this.state.leads.find((item) => item.id === leadId);
        if (!lead || !targetStageId) {
            return;
        }
        const targetStage = this.state.stages.find((stage) => stage.id === targetStageId);
        lead.stage_id = [targetStageId, targetStage ? targetStage.name : ""];
        try {
            await this.api.moveLead(leadId, targetStageId);
            await this.loadData();
        } catch {
            this.state.leads = leadsSnapshot;
            this.notification.add("Failed to move lead", {type: "danger"});
        }
    }
}
