# OWL CRM Board

Small Odoo module for OWL practice. It provides a lightweight CRM-like kanban board with:

- custom `ir.actions.client` entrypoint
- OWL components hierarchy (`Board`, `Column`, `Card`, `Toolbar`, `LeadFormDialog`)
- backend models for leads and stages
- lead CRUD actions from OWL dialogs
- drag-and-drop move between stages
- filters, sorting, loading/error states

## Models

- `owl.crm.stage`: name, sequence, fold
- `owl.crm.lead`: name, partner_name, expected_revenue, priority, description, active, stage_id

## How to run

1. Add this repository to your Odoo addons path.
2. Update app list in Odoo.
3. Install module `OWL CRM Board`.
4. Open menu `OWL CRM Board -> Board`.

## Practice checklist

- Read data using `orm` service.
- Handle async states (`loading`, `error`, retry).
- Implement optimistic update + rollback for drag-and-drop.
- Use dialogs for create/edit.
- Add automated tests (JS and Python).
