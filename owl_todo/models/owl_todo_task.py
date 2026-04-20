from odoo import fields, models


class OwlTodoTask(models.Model):
    _name = "owl_todo.task"
    _description = "OWL Todo Task"
    _order = "is_done asc, sequence asc, id asc"

    name = fields.Char(required=True)
    description = fields.Text()
    is_done = fields.Boolean(default=False)
    sequence = fields.Integer(default=10)
