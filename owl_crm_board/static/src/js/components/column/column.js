/** @odoo-module **/

import {Component} from "@odoo/owl";
import {getDragPayload} from "../../utils/dnd";
import {LeadCard} from "../card/card";

export class BoardColumn extends Component {
    static template = "owl_crm_board.BoardColumn";
    static components = {LeadCard};
    static props = {
        stage: Object,
        leads: Array,
        onCreate: Function,
        onEdit: Function,
        onArchive: Function,
        onMove: Function,
    };

    onDragOver(event) {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
    }

    onDrop(event) {
        event.preventDefault();
        const payload = getDragPayload(event);
        if (!payload || !payload.leadId) {
            return;
        }
        this.props.onMove({
            leadId: payload.leadId,
            targetStageId: this.props.stage.id,
        });
    }
}
