from dateutil.relativedelta import relativedelta
from odoo import fields, models

class EstateProperty(models.Model):
    _name = 'estate.property'
    _description = 'Description for Estate Property'

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
