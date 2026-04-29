{
    "name": "Website Custom Modal",
    "summary": "Reusable website snippet with editable modal window",
    "version": "1.0.0",
    "category": "Website/Website",
    "author": "Dmitriy Shalberkin",
    "license": "LGPL-3",
    "depends": ["website", "web_editor"],
    "data": [
        "data/image_library.xml",
        "views/snippets/s_custom_modal.xml",
        "views/snippets/snippets.xml",
    ],
    "assets": {
        "web.assets_frontend": [
            "website_custom_modal/static/src/snippets/s_custom_modal/sizing_mode_sync.js",
            "website_custom_modal/static/src/snippets/s_custom_modal/s_custom_modal.js",
            "website_custom_modal/static/src/snippets/s_custom_modal/s_custom_modal.scss",
        ],
        "website.assets_wysiwyg": [
            "website_custom_modal/static/src/snippets/s_custom_modal/sizing_mode_sync.js",
            "website_custom_modal/static/src/snippets/s_custom_modal/options.js",
        ],
    },
    "installable": True,
    "application": False,
}
