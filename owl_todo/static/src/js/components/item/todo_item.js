/** @odoo-module **/

import {Component} from "@odoo/owl";

export class TodoItem extends Component {
    static template = "owl_todo.TodoItem";
    static props = {
        task: Object,
        onEdit: Function,
        onDelete: Function,
    };
}
