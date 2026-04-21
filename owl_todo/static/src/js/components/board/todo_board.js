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
        this.drag = useState({
            draggingTaskId: null,
            dragOverTaskId: null,
        });
        this.api = new TodoApi(this.env);
        this.loadRequestId = 0;
        this.loadData = this.loadData.bind(this);
        this.onFiltersChanged = this.onFiltersChanged.bind(this);
        this.openCreateDialog = this.openCreateDialog.bind(this);
        this.openEditDialog = this.openEditDialog.bind(this);
        this.askDeleteTask = this.askDeleteTask.bind(this);
        this.toggleTaskDone = this.toggleTaskDone.bind(this);
        this.onTaskDragStart = this.onTaskDragStart.bind(this);
        this.onTaskDragOver = this.onTaskDragOver.bind(this);
        this.onTaskDrop = this.onTaskDrop.bind(this);
        this.onTaskDragEnd = this.onTaskDragEnd.bind(this);

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

    getTaskById(taskId) {
        return this.state.tasks.find((task) => task.id === taskId) || null;
    }

    onTaskDragStart(task, event) {
        this.drag.draggingTaskId = task.id;
        this.drag.dragOverTaskId = null;
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", String(task.id));
    }

    onTaskDragOver(task, event) {
        if (!this.drag.draggingTaskId || this.drag.draggingTaskId === task.id) {
            return;
        }
        event.preventDefault();
        this.drag.dragOverTaskId = task.id;
        event.dataTransfer.dropEffect = "move";
    }

    onTaskDragEnd() {
        this.drag.draggingTaskId = null;
        this.drag.dragOverTaskId = null;
    }

    async onTaskDrop(targetTask, event) {
        event.preventDefault();
        const draggedTask = this.getTaskById(this.drag.draggingTaskId);
        if (!draggedTask || draggedTask.id === targetTask.id) {
            this.onTaskDragEnd();
            return;
        }
        if (Boolean(draggedTask.is_done) !== Boolean(targetTask.is_done)) {
            this.onTaskDragEnd();
            this.notification.add("You can only reorder tasks within the same status.", {
                type: "warning",
            });
            return;
        }

        const snapshot = this.state.tasks.map((task) => ({...task}));
        const sameStatus = this.state.tasks
            .filter((task) => Boolean(task.is_done) === Boolean(draggedTask.is_done))
            .sort((a, b) => {
                if ((a.sequence || 0) !== (b.sequence || 0)) {
                    return (a.sequence || 0) - (b.sequence || 0);
                }
                return a.id - b.id;
            });
        const fromPos = sameStatus.findIndex((task) => task.id === draggedTask.id);
        const toPos = sameStatus.findIndex((task) => task.id === targetTask.id);
        if (fromPos < 0 || toPos < 0) {
            this.onTaskDragEnd();
            return;
        }
        const reordered = [...sameStatus];
        const [moved] = reordered.splice(fromPos, 1);
        reordered.splice(toPos, 0, moved);

        const sequenceById = new Map();
        reordered.forEach((task, index) => {
            sequenceById.set(task.id, (index + 1) * 10);
        });

        this.state.tasks = this.state.tasks.map((task) => {
            if (!sequenceById.has(task.id)) {
                return task;
            }
            return {
                ...task,
                sequence: sequenceById.get(task.id),
            };
        });
        this.onTaskDragEnd();

        try {
            const updates = reordered
                .filter((task) => (task.sequence || 0) !== sequenceById.get(task.id))
                .map((task) => this.api.updateTask(task.id, {sequence: sequenceById.get(task.id)}));
            await Promise.all(updates);
        } catch (error) {
            this.state.tasks = snapshot;
            this.notifyError("Failed to reorder tasks", error);
        }
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

    async toggleTaskDone(task) {
        const next = !task.is_done;
        const snapshot = this.state.tasks.map((t) => ({...t}));
        this.state.tasks = this.state.tasks.map((t) => (t.id === task.id ? {...t, is_done: next} : t));
        try {
            await this.api.updateTask(task.id, {is_done: next});
        } catch (error) {
            this.state.tasks = snapshot;
            this.notifyError("Failed to update task", error);
        }
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
