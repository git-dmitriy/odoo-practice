from odoo import fields, models


class OwlCrmLead(models.Model):
    _name = "owl.crm.lead"
    _description = "OWL CRM Lead"
    _order = "priority desc, id desc"

    name = fields.Char(required=True)
    partner_name = fields.Char(string="Customer")
    expected_revenue = fields.Float()
    priority = fields.Selection(
        [
            ("0", "Low"),
            ("1", "Normal"),
            ("2", "High"),
            ("3", "Very High"),
        ],
        default="1",
        required=True,
    )
    description = fields.Text()
    active = fields.Boolean(default=True)
    stage_id = fields.Many2one(
        "owl.crm.stage",
        required=True,
        ondelete="restrict",
        index=True,
    )
