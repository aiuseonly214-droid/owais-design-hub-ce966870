# Flexible Section and Final Totals

## What will change
- Fix the missing subtotal after the opening ungrouped rows in quotation and invoice PDFs.
- Show a subtotal after every item block whenever section subtotals are enabled, including rows placed before the first named section.
- Add two independent document options:
  1. **Show section subtotals** — controls only the subtotal row after each item block.
  2. **Show final totals** — controls only the final Sub Total, Discount, Grand Total, and Amount in Words.
- Keep item-level **Total me jodo** unchanged, so optional rows remain visible without affecting calculations.

## Supported combinations
| Section subtotals | Final totals | Printed result |
|---|---|---|
| On | On | Block subtotals and complete final totals |
| On | Off | Only block subtotals; no final subtotal/grand total |
| Off | On | No block subtotals; complete final totals |
| Off | Off | Item table only |

## Data and compatibility
- Add a `show_section_subtotals` setting to quotations and invoices, defaulting to on.
- Existing records remain compatible and will show section subtotals by default.
- Preserve this setting while editing and when converting a quotation into an invoice.
- Apply the same behavior to screen preview, print, and downloaded PDF.

## Verification
- Recreate the uploaded invoice structure and confirm the first two rows receive a subtotal.
- Test all four visibility combinations for quotations and invoices.
- Confirm excluded option rows do not enter block or final calculations.
