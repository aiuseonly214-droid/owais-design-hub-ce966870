## Technical notes

**Data.** One nullable column `group_name text` added to `quotation_items` and `invoice_items` (staged migration, additive only — existing rows stay NULL = ungrouped). Group order and item order keep using the existing `sr` sequence: rows are written in display order, so no extra ordering column is needed. No change to the documents' own `subtotal` / `discount` / `grand_total` columns.

**Types / data layer (`src/lib/crm.ts`).** `DocItem` gains `group_name?: string | null`; `saveQuotation` / `saveInvoice` write it through in the row mapping. Fetches already order by `sr`.

**Form (`src/components/doc/DocForm.tsx`).** Items stay a single flat array — grouping is derived from `group_name`, which keeps the save path and the existing "Total me jodo" / "show totals" logic untouched. Rendering groups the array by `group_name` in first-appearance order, with the ungrouped bucket rendered in its existing style. New controls: "Add section", inline rename, section delete (sets members' `group_name` to null), section reorder (splices the block in the array), item move up/down, and a "Move to section" select per item. Subtotal per section = sum of `qty * rate` for items with `include_in_total !== false`; `totals.subtotal` remains the sum over all counted items, so the grand total cannot double-count. Validation is unchanged (qty and rate > 0, at least one particular); empty sections are dropped on save.

**Print / PDF (`src/components/doc/TradeDocSheet.tsx`).** When any item has a `group_name`, the table renders a section header row (navy tinted, group name) before each block and a right-aligned "Subtotal" row after it; ungrouped items render as today. With no groups the table is byte-identical to the current output. html2canvas path in `src/lib/pdf.ts` needs no change since the new rows use the same inline-colour convention.

**Routes.** `quotations/$id_.edit.tsx`, `invoices/$id_.edit.tsx` and `invoices/new.tsx` already pass items straight through, so groups survive editing and quotation-to-invoice conversion with no edits there.

**Draft note.** The new column is staged and only applies when this draft is accepted, so grouped saving can be exercised end-to-end after acceptance; until then the UI and totals can be reviewed but grouped items will not persist.
