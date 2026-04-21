{
    "name": "OWL Todo",
    "summary": "Single-list todo with OWL: create, edit, delete",
    "version": "17.0.1.0.0",
    "category": "Productivity",
    "author": "Dmitriy Shalberkin",
    "license": "LGPL-3",
    "installable": True,
    "application": True,
    "depends": ["base", "web"],
    "data": [
        "security/ir.model.access.csv",
        "views/owl_todo_task_views.xml",
        "views/owl_todo_menu.xml",
    ],
    "assets": {
        "web.assets_backend": [
            "owl_todo/static/src/js/**/*.js",
            "owl_todo/static/src/**/*.xml",
            "owl_todo/static/src/scss/**/*.scss",
        ],
        "web.qunit_suite_tests": [
            "owl_todo/static/src/tests/**/*.test.js",
        ],
    },
}
