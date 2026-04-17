from odoo import http
from odoo.http import request


class ThemeBootstrapCookiesController(http.Controller):
    @http.route(
        "/theme_bootstrap_cookies/set_theme_mode",
        type="http",
        auth="public",
        methods=["POST"],
        csrf=False,
    )
    def set_theme_mode(self, mode=None, **kwargs):
        theme_mode = mode if mode in ("light", "dark") else "light"
        response = request.make_json_response({"ok": True, "mode": theme_mode})
        response.set_cookie(
            "website_theme_mode",
            theme_mode,
            max_age=60 * 60 * 24 * 365,
            samesite="Lax",
            path="/",
        )
        return response
