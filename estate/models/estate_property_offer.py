from datetime import timedelta

from odoo import api, fields, models


class EstatePropertyOffer(models.Model):
    _name = 'estate.property.offer'
    _description = 'Estate Property Offer'

    price = fields.Float()
    status = fields.Selection(
        selection=[
            ('accepted', 'Accepted'),
            ('refused', 'Refused'),
        ],
        copy=False,
    )
    partner_id = fields.Many2one('res.partner', required=True)
    property_id = fields.Many2one('estate.property', required=True)
    validity = fields.Integer(default=7)
    date_deadline = fields.Date(
        compute='_compute_date_deadline',
        store=True,
        readonly=False,
        inverse='_inverse_date_deadline',
    )

    @api.depends('validity', 'create_date')
    def _compute_date_deadline(self):
        for record in self:
            base = (record.create_date or fields.Datetime.now()).date()
            record.date_deadline = base + timedelta(days=record.validity or 0)

    def _inverse_date_deadline(self):
        for record in self:
            base = (record.create_date or fields.Datetime.now()).date()
            if record.date_deadline:
                record.validity = (record.date_deadline - base).days
