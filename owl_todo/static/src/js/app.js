/** @odoo-module **/

import {registry} from "@web/core/registry";
import {TodoBoard} from "./components/board/todo_board";

registry.category("actions").add("owl_todo.client_action", TodoBoard);
