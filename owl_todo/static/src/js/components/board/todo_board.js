/** @odoo-module **/

import {Component, onWillStart, useState} from "@odoo/owl";
import {useService} from "@web/core/utils/hooks";
import {ConfirmationDialog} from "@web/core/confirmation_dialog/confirmation_dialog";
import {TodoApi} from "../../services/todo_api";
import {filterVisibleTasks, makeInitialTodoState} from "../../store/todo_store";
import {TodoToolbar} from "../toolbar/todo_toolbar";
import {TodoItem} from "../item/todo_item";
import {TaskFormDialog} from "../task_form_dialog/task_form_dialog";

export class TodoBoard extends Component {
    static template = "owl_todo.TodoBoard";
    static components = {TodoToolbar, TodoItem};

    setup() {
        this.notification = useService("notification");
        this.dialog = useService("dialog");
        this.state = useState(makeInitialTodoState());
        this.api = new TodoApi(this.env);
        this.loadRequestId = 0;
        this.loadData = this.loadData.bind(this);
        this.onFiltersChanged = this.onFiltersChanged.bind(this);
        this.openCreateDialog = this.openCreateDialog.bind(this);
        this.openEditDialog = this.openEditDialog.bind(this);
        this.askDeleteTask = this.askDeleteTask.bind(this);

        onWillStart(async () => {
            await this.loadData();
        });
    }

    get visibleTasks() {
        return filterVisibleTasks(this.state.tasks, {
            query: this.state.query,
            done: this.state.done,
        });
    }

    nextSequence() {
        const maxSeq = this.state.tasks.reduce((max, task) => Math.max(max, task.sequence || 0), 0);
        return maxSeq + 10;
    }

    async loadData() {
        const requestId = ++this.loadRequestId;
        this.state.loading = true;
        this.state.error = "";
        try {
            const tasks = await this.api.loadTasks();
            if (requestId !== this.loadRequestId) {
                return;
            }
            this.state.tasks = tasks;
        } catch (error) {
            if (requestId !== this.loadRequestId) {
                return;
            }
            this.state.error = error.message || "Failed to load tasks.";
        } finally {
            if (requestId !== this.loadRequestId) {
                return;
            }
            this.state.loading = false;
        }
    }

    onFiltersChanged(filters) {
        this.state.query = filters.query;
        this.state.done = filters.done;
    }

    notifyError(message, error) {
        const details = error && error.message ? `: ${error.message}` : "";
        this.notification.add(`${message}${details}`, {type: "danger"});
    }

    openCreateDialog() {
        this.dialog.add(TaskFormDialog, {
            title: "New task",
            onSave: async (values) => {
                const payload = {...values, sequence: this.nextSequence()};
                try {
                    await this.api.createTask(payload);
                    this.notification.add("Task created", {type: "success"});
                    await this.loadData();
                } catch (error) {
                    this.notifyError("Failed to create task", error);
                    throw error;
                }
            },
        });
    }

    openEditDialog(task) {
        this.dialog.add(TaskFormDialog, {
            title: "Edit task",
            task,
            onSave: async (values) => {
                try {
                    await this.api.updateTask(task.id, values);
                    this.notification.add("Task updated", {type: "success"});
                    await this.loadData();
                } catch (error) {
                    this.notifyError("Failed to update task", error);
                    throw error;
                }
            },
        });
    }

    askDeleteTask(task) {
        this.dialog.add(ConfirmationDialog, {
            body: `Delete "${task.name}"?`,
            confirmLabel: "Delete",
            confirm: async () => {
                try {
                    await this.api.deleteTask(task.id);
                    this.notification.add("Task deleted", {type: "success"});
                    await this.loadData();
                } catch (error) {
                    this.notifyError("Failed to delete task", error);
                }
            },
        });
    }
}
