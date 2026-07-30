# Owais Interior Designer CRM — Build Plan

**Phase 1 (build now):** Quotation + Invoice/Receipt generator.
**Phase 2+ (planned, built later):** rest of the CRM.

## Business Details (locked in)
- Owais Interior Designer — "Turning your space into elegant design"
- Rahmat Nagar, Wadala, Nashik, Maharashtra
- 7756043214 / 7721926290 · onlyw6469@gmail.com
- Currency ₹ INR · No GST · No bank details
- Users: 1 Admin + 1 Employee
- Theme: Premium Maroon `#800020` + Gold `#C9A227` + White

## Assets to upload in chat (I'll wire them in as they arrive)
1. Logo (PNG, transparent)
2. Company stamp (PNG, transparent)
3. Owner signature (PNG, transparent)

Until uploaded I'll use a styled text logo so nothing is blocked.

---

# PHASE 1 — Quotation & Invoice (building now)

## Backend (Lovable Cloud)
```text
company_profile  singleton: name, tagline, address, mobile1, mobile2, email,
                 logo_url, stamp_url, signature_url, currency 'INR'
customers        code CUS-0001, name, mobile, alt_mobile, email,
                 site_address, billing_address, city, notes
quotations       code QT-2026-0001, customer_id, date, valid_till,
                 subtotal, discount, grand_total, amount_words, terms, status
quotation_items  quotation_id, sr, particular, description, unit, qty, rate, amount
invoices         code INV-2026-0001, customer_id, quotation_id?, date,
                 subtotal, discount, grand_total, amount_words, status
invoice_items    same shape as quotation_items
receipts         code RC-2026-0001, customer_id, invoice_id?, date, total_amount,
                 previous_paid, amount_received, balance,
                 mode cash|upi|bank|cheque, txn_id, amount_words
```
Auth: email/password login. `user_roles` table (`admin` / `employee`) + `has_role()` security-definer function. RLS on every table. Auto-numbering via Postgres sequences. Storage bucket for logo/stamp/signature.

## Screens
```text
/auth                     Login + Remember me + Forgot password
/reset-password           Set new password
/                         Home: quick actions + recent quotations/invoices/receipts
/customers                List, search by name/mobile, add/edit/delete
/quotations               List + search by quote no.
/quotations/new           Line-item builder
/quotations/$id           A4 preview → Print / Download PDF / Duplicate / Edit
                          → "Convert to Invoice" button
/invoices                 List + search
/invoices/new             Same builder, or auto-filled from a quotation
/invoices/$id             A4 preview → Print / PDF / Edit / "Record Payment"
/receipts                 List
/receipts/new             Auto-pulls total, previous paid, balance
/receipts/$id             A4 preview → Print / PDF
/settings                 Company profile + logo/stamp/signature upload,
                          change password, terms & conditions default text
```

## Document Builder (shared by Quotation & Invoice)
- Pick customer (or add inline)
- Add rows: Sr No · Particular · Description · Unit · Qty · Rate · Amount (auto)
- Live totals: Sub Total → Discount (₹ or %) → Grand Total
- Amount in words auto-generated (Indian Rupees format)
- Editable Terms & Conditions with a saved default
- Footer: Authorized Signature + Company Stamp images

## A4 Print Template
Maroon header band with logo + company name + tagline + contact, gold rule, clean item table, totals block right-aligned, amount-in-words, terms, signature/stamp row. Exact same layout for print and PDF (jsPDF + html2canvas). Mobile-friendly forms, print-only CSS.

---

# PHASE 2+ — Remaining CRM (planned, not built yet)

| Phase | Modules |
|---|---|
| 2 | Dashboard widgets, revenue + project-status charts, notifications (pending payments, follow-ups) |
| 3 | Project Management: PRJ-2026-0001, status pipeline, progress %, before/after photo upload |
| 4 | Payment Management: per-customer ledger, advance/balance, pending vs paid |
| 5 | Reports: Customer / Quotation / Invoice / Receipt / Project / Payment + PDF & Excel export |
| 6 | Global search (⌘K), customer history tabs, DB backup export |
| V2 | WhatsApp, employee management, attendance, inventory, expenses, P&L, digital signature, SMS/email, analytics, multi-branch, AI estimate, multi-language |

Schema and role system in Phase 1 are designed so these later phases plug in without rework.

---

## Phase 1 Build Order
1. Enable Lovable Cloud + run migrations (tables, RLS, sequences, storage)
2. Maroon/gold design tokens + app shell with sidebar
3. Auth, roles, protected routes
4. Settings → company profile + asset uploads
5. Customers
6. Quotation builder + A4 template + PDF
7. Invoice (convert-from-quotation) + A4 template + PDF
8. Receipt + A4 template + PDF
9. Home screen + QA screenshot pass on every page

**Approve to start building Phase 1.**
