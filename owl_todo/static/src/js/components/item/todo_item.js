/** @odoo-module **/

import {Component} from "@odoo/owl";

export class TodoItem extends Component {
    static template = "owl_todo.TodoItem";
    static props = {
        task: Object,
        isDragging: {type: Boolean, optional: true},
        isDragOver: {type: Boolean, optional: true},
        onEdit: Function,
        onDelete: Function,
        onToggleDone: Function,
        onDragStart: Function,
        onDragOver: Function,
        onDrop: Function,
        onDragEnd: Function,
    };
}
