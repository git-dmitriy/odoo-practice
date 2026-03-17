from datetime import timedelta

from odoo import api, fields, models
from odoo.exceptions import UserError
from odoo.tools import float_compare


class EstatePropertyOffer(models.Model):
    _name = 'estate.property.offer'
    _description = 'Estate Property Offer'
    _order = 'price desc'
    _sql_constraints = [
        ('offer_price_positive', 'CHECK(price > 0)', 'Offer price must be strictly positive.'),
    ]

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
    property_type_id = fields.Many2one(
        related='property_id.property_type_id',
        store=True,
        readonly=True,
    )
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
            base = (record.create_date.date() if record.create_date else fields.Date.context_today(record))
            record.date_deadline = base + timedelta(days=record.validity or 0)

    def _inverse_date_deadline(self):
        for record in self:
            base = (record.create_date.date() if record.create_date else fields.Date.context_today(record))
            if record.date_deadline:
                record.validity = (record.date_deadline - base).days

    @api.model_create_multi
    def create(self, vals_list):
        for vals in vals_list:
            property_id = vals.get('property_id')
            if not property_id:
                continue

            prop = self.env['estate.property'].browse(property_id)
            if prop.state in ('offer_accepted', 'sold', 'cancelled'):
                raise UserError("You cannot create an offer for a property in this state.")

            new_price = vals.get('price') or 0.0
            if prop.offer_ids:
                max_price = max(prop.offer_ids.mapped('price') or [0.0])
                if float_compare(new_price, max_price, precision_digits=2) < 0:
                    raise UserError("You cannot create an offer lower than an existing offer.")

        offers = super().create(vals_list)
        for offer in offers:
            if offer.property_id.state == 'new':
                offer.property_id.state = 'offer_received'
        return offers

    def action_accept(self):
        for offer in self:
            if offer.property_id.state in ('sold', 'cancelled'):
                raise UserError("You cannot accept an offer for a sold/cancelled property.")
            accepted = offer.property_id.offer_ids.filtered(lambda o: o.status == 'accepted')
            if accepted and offer not in accepted:
                raise UserError("Only one offer can be accepted for a property.")

            offer.status = 'accepted'
            (offer.property_id.offer_ids - offer).write({'status': 'refused'})
            offer.property_id.write({
                'buyer_id': offer.partner_id.id,
                'selling_price': offer.price,
                'state': 'offer_accepted',
            })

    def action_refuse(self):
        for offer in self:
            if offer.status == 'accepted':
                raise UserError("You cannot refuse an already accepted offer.")
            offer.status = 'refused'
