from odoo.tests import tagged
from odoo.tests.common import TransactionCase


@tagged("-at_install", "post_install")
class TestOwlTodo(TransactionCase):
    def test_create_update_delete_task(self):
        Task = self.env["owl_todo.task"]
        task = Task.create(
            {
                "name": "Buy milk",
                "sequence": 10,
            }
        )
        self.assertFalse(task.is_done)
        task.write({"is_done": True, "description": "2%"})
        self.assertTrue(task.is_done)
        task_id = task.id
        task.unlink()
        self.assertFalse(Task.search([("id", "=", task_id)]))
