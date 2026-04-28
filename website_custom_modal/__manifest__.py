{
    "name": "Website Custom Modal",
    "summary": "Reusable website snippet with editable modal window",
    "version": "17.0.1.0.0",
    "category": "Website/Website",
    "author": "Dmitriy Shalberkin",
    "license": "LGPL-3",
    "depends": ["website"],
    "data": [
        "data/image_library.xml",
        "views/snippets/s_popup.xml",
        "views/snippets/snippets.xml",
    ],
    "assets": {
        "web.assets_frontend": [
            "website_custom_modal/static/src/snippets/s_popup/sizing_mode_sync.js",
            "website_custom_modal/static/src/snippets/s_popup/000.js",
            "website_custom_modal/static/src/snippets/s_popup/001.scss",
        ],
        "website.assets_wysiwyg": [
            "website_custom_modal/static/src/snippets/s_popup/sizing_mode_sync.js",
            "website_custom_modal/static/src/snippets/s_popup/options.js",
        ],
    },
    "installable": True,
    "application": False,
}
