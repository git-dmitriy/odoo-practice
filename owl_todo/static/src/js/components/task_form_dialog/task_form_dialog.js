/** @odoo-module **/

import {Component, useState} from "@odoo/owl";
import {Dialog} from "@web/core/dialog/dialog";

export class TaskFormDialog extends Component {
    static template = "owl_todo.TaskFormDialog";
    static components = {Dialog};
    static props = {
        close: Function,
        title: String,
        task: {type: Object, optional: true},
        onSave: Function,
    };

    setup() {
        const task = this.props.task || {};
        this.form = useState({
            name: task.name || "",
            description: task.description || "",
            is_done: Boolean(task.is_done),
        });
        this.state = useState({
            saving: false,
            error: "",
        });
    }

    async onSubmit(event) {
        event.preventDefault();
        if (!this.form.name.trim()) {
            this.state.error = "Name is required.";
            return;
        }
        this.state.saving = true;
        this.state.error = "";
        try {
            await this.props.onSave({
                name: this.form.name.trim(),
                description: (this.form.description && this.form.description.trim()) || false,
                is_done: this.form.is_done,
            });
            this.props.close();
        } catch (error) {
            this.state.error = error.message || "Failed to save task.";
        } finally {
            this.state.saving = false;
        }
    }
}
