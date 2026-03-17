from odoo import fields, models


class EstatePropertyTag(models.Model):
    _name = 'estate.property.tag'
    _description = 'Estate Property Tag'
    _order = 'name'
    _sql_constraints = [
        ('estate_property_tag_name_uniq', 'UNIQUE(name)', 'Property tag name must be unique.'),
    ]

    name = fields.Char(required=True)
