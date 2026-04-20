/** @odoo-module **/

import {Component} from "@odoo/owl";
import {setDragPayload} from "../../utils/dnd";

export class LeadCard extends Component {
    static template = "owl_crm_board.LeadCard";
    static props = {
        lead: Object,
        onEdit: Function,
        onArchive: Function,
    };

    onDragStart(event) {
        setDragPayload(event, {leadId: this.props.lead.id});
    }
}
