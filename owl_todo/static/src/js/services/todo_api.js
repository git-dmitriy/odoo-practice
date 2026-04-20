/** @odoo-module **/

export class TodoApi {
    constructor(env) {
        this.orm = env.services.orm;
    }

    async loadTasks() {
        return this.orm.searchRead("owl_todo.task", [], ["name", "description", "is_done", "sequence"]);
    }

    async createTask(values) {
        return this.orm.create("owl_todo.task", [values]);
    }

    async updateTask(taskId, values) {
        return this.orm.write("owl_todo.task", [taskId], values);
    }

    async deleteTask(taskId) {
        return this.orm.unlink("owl_todo.task", [taskId]);
    }
}
