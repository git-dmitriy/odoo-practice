/** @odoo-module **/

import {groupLeadsByStage} from "../js/store/board_store";

QUnit.module("owl_crm_board > board_store", () => {
    QUnit.test("groups leads by stage and applies priority filter", (assert) => {
        const stages = [{id: 1}, {id: 2}];
        const leads = [
            {id: 10, stage_id: [1, "New"], priority: "1", name: "A"},
            {id: 11, stage_id: [2, "Won"], priority: "2", name: "B"},
        ];

        const grouped = groupLeadsByStage(stages, leads, {
            query: "",
            priority: "2",
            sortBy: "priority",
        });

        assert.strictEqual(grouped[1].length, 0);
        assert.strictEqual(grouped[2].length, 1);
        assert.strictEqual(grouped[2][0].id, 11);
    });
});
