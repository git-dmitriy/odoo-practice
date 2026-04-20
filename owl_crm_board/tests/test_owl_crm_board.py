from odoo.tests import tagged
from odoo.tests.common import TransactionCase


@tagged("-at_install", "post_install")
class TestOwlCrmBoard(TransactionCase):
    def test_seed_stages_exist(self):
        stages = self.env["owl.crm.stage"].search([])
        self.assertGreaterEqual(len(stages), 4)

    def test_create_lead(self):
        stage = self.env.ref("owl_crm_board.owl_crm_stage_new")
        lead = self.env["owl.crm.lead"].create(
            {
                "name": "Demo lead",
                "partner_name": "ACME",
                "stage_id": stage.id,
                "priority": "1",
            }
        )
        self.assertTrue(lead.id)
        self.assertEqual(lead.stage_id.id, stage.id)
