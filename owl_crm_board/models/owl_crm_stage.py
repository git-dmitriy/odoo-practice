from odoo import fields, models


class OwlCrmStage(models.Model):
    _name = "owl.crm.stage"
    _description = "OWL CRM Stage"
    _order = "sequence, id"

    name = fields.Char(required=True, translate=True)
    sequence = fields.Integer(default=10)
    fold = fields.Boolean(
        string="Folded in Kanban",
        help="If enabled, stage is folded by default in kanban.",
    )
    lead_ids = fields.One2many("owl.crm.lead", "stage_id", string="Leads")
