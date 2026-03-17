from dateutil.relativedelta import relativedelta

from odoo import api, fields, models
from odoo.exceptions import UserError

class EstateProperty(models.Model):
    _name = 'estate.property'
    _description = 'Description for Estate Property'
    _sql_constraints = [
        ('expected_price_positive', 'CHECK(expected_price > 0)', 'Expected price must be strictly positive.'),
        ('selling_price_positive', 'CHECK(selling_price >= 0)', 'Selling price must be positive.'),
    ]

    active = fields.Boolean(default=True)
    state = fields.Selection(
        string='State',
        selection=[
            ('new', 'Новое'),
            ('offer_received', 'Предложение получено'),
            ('offer_accepted', 'Предложение принято'),
            ('sold', 'Продано'),
            ('cancelled', 'Отменено'),
        ],
        required=True,
        copy=False,
        default='new',
    )
    name = fields.Char(required=True)
    property_type_id = fields.Many2one('estate.property.type', string='Property Type')
    tag_ids = fields.Many2many('estate.property.tag', string='Tags')
    offer_ids = fields.One2many('estate.property.offer', 'property_id', string='Offers')
    buyer_id = fields.Many2one('res.partner', string='Buyer', copy=False)
    seller_id = fields.Many2one('res.users', string='Salesperson', default=lambda self: self.env.user, copy=False)
    description = fields.Text()
    postcode = fields.Char()
    date_availability = fields.Date(
        copy=False,
        default=lambda self: fields.Date.today() + relativedelta(months=3),
    )
    expected_price = fields.Float(required=True)
    selling_price = fields.Float(readonly=True, copy=False)
    bedrooms = fields.Integer(default=2)
    living_area = fields.Integer()
    total_area = fields.Integer(
        string='Total Area',
        compute='_compute_total_area',
        store=True,
        readonly=True,
    )
    facades = fields.Integer()
    garage = fields.Boolean()
    garden = fields.Boolean()
    garden_area = fields.Integer()
    garden_orientation = fields.Selection(
        string='Garden Orientation',
        selection=[
            ('north', 'North'),
            ('south', 'South'),
            ('east', 'East'),
            ('west', 'West'),]
    )
    best_price = fields.Float(
        string='Best Offer',
        compute='_compute_best_price',
        store=True,
        readonly=True,
    )

    @api.depends('living_area', 'garden_area')
    def _compute_total_area(self):
        for record in self:
            record.total_area = (record.living_area or 0) + (record.garden_area or 0)

    @api.depends('offer_ids.price')
    def _compute_best_price(self):
        for record in self:
            record.best_price = max(record.offer_ids.mapped('price') or [0])

    @api.onchange('garden')
    def _onchange_garden(self):
        if self.garden:
            if not self.garden_area:
                self.garden_area = 10
            if not self.garden_orientation:
                self.garden_orientation = 'north'
        else:
            self.garden_area = False
            self.garden_orientation = False

    def action_sold(self):
        for record in self:
            if record.state == 'cancelled':
                raise UserError("A cancelled property cannot be sold.")
            record.state = 'sold'

    def action_cancel(self):
        for record in self:
            if record.state == 'sold':
                raise UserError("A sold property cannot be cancelled.")
            record.state = 'cancelled'
