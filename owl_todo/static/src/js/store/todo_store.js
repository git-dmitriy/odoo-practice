/** @odoo-module **/

export function makeInitialTodoState() {
    return {
        tasks: [],
        loading: false,
        error: "",
        query: "",
        done: "all",
    };
}

export function filterVisibleTasks(tasks, filters) {
    const normalizedQuery = (filters.query || "").trim().toLowerCase();
    const filtered = tasks.filter((task) => {
        const name = (task.name || "").toLowerCase();
        const description = (task.description || "").toLowerCase();
        const queryOk =
            !normalizedQuery || name.includes(normalizedQuery) || description.includes(normalizedQuery);
        const doneOk =
            filters.done === "all" ||
            (filters.done === "open" && !task.is_done) ||
            (filters.done === "done" && task.is_done);
        return queryOk && doneOk;
    });
    return [...filtered].sort((a, b) => {
        if (Boolean(a.is_done) !== Boolean(b.is_done)) {
            return Number(a.is_done) - Number(b.is_done);
        }
        if ((a.sequence || 0) !== (b.sequence || 0)) {
            return (a.sequence || 0) - (b.sequence || 0);
        }
        return a.id - b.id;
    });
}
