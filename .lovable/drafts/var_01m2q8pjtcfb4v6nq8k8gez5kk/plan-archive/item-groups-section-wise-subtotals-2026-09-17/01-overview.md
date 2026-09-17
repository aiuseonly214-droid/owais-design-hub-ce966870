# Item Groups / Section-wise Subtotals

Add optional sections to quotations and invoices. Items can sit inside named groups (Plot Work, Material, Labour, ...), each group shows its own subtotal, and the grand total is the sum of the group subtotals. Nothing else in the app changes.

## How it behaves

- A new "Add section" button in the items area of the quotation/invoice form.
- Unlimited sections, each with an editable name and its own items.
- Items keep the exact fields they have today: Particular, Unit, Qty, Rate, Amount, and the existing "Total me jodo" option tick.
- Amount stays Qty x Rate, computed automatically; a section subtotal is the sum of its counted items; the grand total is the sum of section subtotals. Discount % keeps working on the grand total exactly as now.
- Controls per item: edit, delete, move up/down, and a "Move to section" picker. Controls per section: rename, delete (its items fall back to ungrouped instead of being lost), move section up/down.
- If no section is created, the form and the printed document look and behave exactly as today. Old invoices and quotations stay ungrouped and unchanged.
