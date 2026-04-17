{
    "name": "Bootstrap Theme Cookies",
    "summary": "Website bootstrap theme with cookie-based mode persistence",
    "version": "17.0.1.0.0",
    "category": "Theme/Website",
    "author": "Dmitriy Shalberkin",
    "license": "LGPL-3",
    "depends": ["website"],
    "data": [
        "views/theme_templates.xml",
    ],
    "assets": {
        "web.assets_frontend": [
            "theme_bootstrap_cookies/static/src/scss/theme.scss",
            "theme_bootstrap_cookies/static/src/js/theme_toggle.js",
        ],
    },
    "installable": True,
    "application": False,
    "theme": True,
}
