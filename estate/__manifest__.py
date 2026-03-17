{
    'name': 'Real Estate',
    'installable': True,
    'depends': [
        'base'
    ],
    # 'pre_init_hook': 'pre_init_hook',
    'data': [
        'security/ir.model.access.csv',
        'views/estate_property_type_views.xml',
        'views/estate_property_tag_views.xml',
        'views/estate_property_offer_views.xml',
        'views/estate_property_views.xml',
        'views/estate_menus.xml',
    ]
}