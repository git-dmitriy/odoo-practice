from . import models


# def pre_init_hook(env):
#     # Ensure legacy data won't block SQL constraints on upgrade/install
#     env.cr.execute("""
#         UPDATE estate_property
#            SET expected_price = 1
#          WHERE expected_price IS NOT NULL
#            AND expected_price <= 0
#     """)
