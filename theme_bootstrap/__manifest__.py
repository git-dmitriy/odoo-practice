{
    "name": "Bootstrap Theme Template",
    "summary": "Minimal website theme template based on Bootstrap",
    "version": "17.0.1.0.0",
    "category": "Theme/Website",
    "author": "Dmitriy Shalberkin",
    "license": "LGPL-3",
    "depends": ["website"],
    "data": [
        "views/theme_templates.xml",
    ],
    "assets": {
        "web._assets_primary_variables": [
            "theme_bootstrap/static/src/scss/primary_variables.scss",
        ],
        "web.assets_frontend": [
            "theme_bootstrap/static/src/scss/theme.scss",
            "theme_bootstrap/static/src/js/theme_toggle.js",
        ],
    },
    "installable": True,
    "application": False,
    "theme": True,
}
