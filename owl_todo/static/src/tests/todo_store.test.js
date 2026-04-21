/** @odoo-module **/

import {filterVisibleTasks} from "../js/store/todo_store";

QUnit.module("owl_todo > todo_store", () => {
    QUnit.test("filters open tasks and sorts by done then sequence", (assert) => {
        const tasks = [
            {id: 2, is_done: true, sequence: 10, name: "b"},
            {id: 1, is_done: false, sequence: 20, name: "a"},
        ];

        const visible = filterVisibleTasks(tasks, {query: "", done: "open"});

        assert.strictEqual(visible.length, 1);
        assert.strictEqual(visible[0].id, 1);
    });
});
