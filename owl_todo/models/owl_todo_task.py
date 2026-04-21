from odoo import _, api, fields, models
from odoo.exceptions import ValidationError


class OwlTodoTask(models.Model):
    _name = "owl_todo.task"
    _description = "OWL Todo Task"
    _order = "is_done asc, sequence asc, id asc"

    name = fields.Char(required=True)
    description = fields.Text()
    is_done = fields.Boolean(default=False)
    sequence = fields.Integer(default=10)

    @api.constrains("name")
    def _check_name_not_blank(self):
        for task in self:
            if not (task.name or "").strip():
                raise ValidationError(_("Task title cannot be empty."))
