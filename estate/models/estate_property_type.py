from odoo import fields, models


class EstatePropertyType(models.Model):
    _name = 'estate.property.type'
    _description = 'Estate Property Type'
    _sql_constraints = [
        ('estate_property_type_name_uniq', 'UNIQUE(name)', 'Property type name must be unique.'),
    ]

    name = fields.Char(required=True)
