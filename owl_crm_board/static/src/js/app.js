/** @odoo-module **/

import {registry} from "@web/core/registry";
import {Board} from "./components/board/board";

registry.category("actions").add("owl_crm_board.client_action", Board);
