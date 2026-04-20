{
    "name": "OWL CRM Board",
    "summary": "Practice module with OWL kanban board",
    "version": "1.0.0",
    "category": "Sales/CRM",
    "author": "Dmitriy Shalberkin",
    "license": "LGPL-3",

    "installable": True,
    "application": True,
    "depends": ["base", "web"],
    "data": [
        "security/ir.model.access.csv",
        "data/owl_crm_stage_data.xml",
        "views/owl_crm_stage_views.xml",
        "views/owl_crm_lead_views.xml",
        "views/owl_crm_menu.xml",
    ],
    "assets": {
        "web.assets_backend": [
            "owl_crm_board/static/src/js/**/*.js",
            "owl_crm_board/static/src/**/*.xml",
            "owl_crm_board/static/src/scss/**/*.scss",
        ],
        "web.qunit_suite_tests": [
            "owl_crm_board/static/src/tests/**/*.test.js",
        ],
    },
}
