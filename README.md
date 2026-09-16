# Owais Interior Designer CRM

A professional web-based CRM for **Owais Interior Designer** — from customer inquiry to quotation, invoice, and payment receipt, all in one platform.

**Live app:** https://owais-design-hub.lovable.app

| | |
|---|---|
| **Company** | Owais Interior Designer — "Turning your space into elegant design" |
| **Address** | Rahmat Nagar, Wadala, Nashik, Maharashtra |
| **Contact** | 7756043214 / 7721926290 · onlyw6469@gmail.com |
| **Currency** | INR (₹) · No GST |
| **Theme** | Navy Blue `#123A70` + Teal `#0E8F8C` + White |

---

## System Overview (Mind Map)

```text
                         OWAIS INTERIOR DESIGNER CRM
                                    │
        ┌─────────────┬─────────────┼─────────────┬──────────────┐
        │             │             │             │              │
     AUTH         CUSTOMERS     DOCUMENTS      MONEY TRACKING   SETTINGS
        │             │             │             │              │
   Admin login    Add / Edit    Quotations     Outstanding     Company profile
   Employee login Search        Invoices       Customer-wise   Logo / Stamp /
   Forgot pass    Auto code     Receipts       balances        Signature upload
   Roles          History       Inquiries      Payment modes   Default terms
                                (leads)        Paid / Partial  Change password
```

## Business Workflow

```text
 Inquiry ──convert──▶ Customer ──▶ Quotation ──approve──▶ Invoice ──pay──▶ Receipt
 (lead)                CUS-0001     QT-2026-0001           INV-2026-0001   RC-2026-0001
                                              │
                                              └── option items possible
                                                  (shown, but excluded from totals)
```

---

## Features (Phase 1)

### 1. Authentication & Roles
- Email + password login, Remember me, Forgot password (reset link flow)
- **Admin** — full access including Settings and user roles
- **Employee** — can manage customers, documents, inquiries; blocked from settings

### 2. Dashboard
- Summary cards: customers, quotations, invoices, outstanding amount
- Recent quotations / invoices / receipts
- Quick actions: New Quotation, New Invoice, New Receipt, New Customer

### 3. Customers
- Auto code `CUS-0001`, name, 10-digit mobile, email, addresses, city, notes
- Search by name / mobile / code / city
- Delete with cascade confirm (only if you accept linked documents going too)

### 4. Inquiries (Lead Tracking)
- Record walk-ins, calls, WhatsApp, Instagram leads with source + service
- Pipeline status: New → Contacted → Quotation Sent → Won / Lost
- **Convert to Customer** in one click
- Dashboard shows conversion rate — kitni inquiries se real business bana

### 5. Quotations
- Auto number `QT-2026-0001`, date, valid till, subject
- Line items: Sr · Particular · Unit (dropdown) · Qty · Rate · Amount (auto)
- **Optional items** — untick "Total me jodo" to show an option row that is
  printed with an `OPTION` badge but excluded from totals (multiple options
  for the same product)
- **Optional totals** — untick "Document par totals dikhao" to print a clean
  item-only document with no subtotal / discount / grand total
- Discount in %, amount-in-words auto (Indian format), editable terms
- Status: Draft / Sent / Approved / Rejected
- Print + PDF (A4), Duplicate, **Convert to Invoice**

### 6. Invoices
- Auto number `INV-2026-0001`; create fresh or convert from a quotation
- Same line-item editor, optional items and optional totals
- Status auto-syncs: Unpaid / Partially Paid / Paid / Cancelled
- Editable anytime — totals re-sync with payments
- **Record Payment** → opens a pre-filled receipt

### 7. Receipts
- Auto number `RC-2026-0001`
- Auto-pulls invoice total, previous paid, balance
- Payment mode dropdown: Cash / UPI / Bank Transfer / Cheque / Card / Other
- Amount in words auto-generated

### 8. Outstanding Report
- Customer-wise: total invoiced, paid, balance, pending invoice count
- Invoice-wise expandable detail, search + filters (overdue, partial…)
- FIFO settlement: receipts settle oldest pending invoices first

### 9. Settings (Admin only)
- Company profile, default terms & conditions
- Logo, stamp, signature upload (stamp prints as a light watermark)
- Change password

---

## A4 Document Template

```text
┌───────────────────────────────────────────────────────┐
│  NAVY HEADER:  Logo │ Company name + tagline │ Contact │
├───────────────────────────────────────────────────────┤
│  Teal rule                                            │
│  QUOTATION / INVOICE / RECEIPT   Code   Date          │
│  Bill To: customer details                            │
│ ┌────┬─────────────┬──────┬─────┬───────┬──────────┐ │
│ │ Sr │ Particular  │ Unit │ Qty │ Rate  │  Amount  │ │
│ └────┴─────────────┴──────┴─────┴───────┴──────────┘ │
│                          Sub Total   ₹  ─── (hidden   │
│                          Discount %  ₹    if totals   │
│                          GRAND TOTAL ₹    toggled off)│
│  Amount in words (italic teal)                        │
│  Terms & Conditions (numbered)                        │
│                  [stamp watermark]  Authorized Sign.  │
└───────────────────────────────────────────────────────┘
```

---

## Tech Stack

- **Frontend:** TanStack Start (React 19) + Tailwind CSS v4 + shadcn/ui
- **Backend:** Lovable Cloud (Postgres, Auth, Row Level Security)
- **PDF:** jsPDF + html2canvas-pro from the A4 print DOM
- **Routing:** file-based routes under `src/routes/`

## Database Tables

| Table | Purpose |
|---|---|
| `profiles` / `user_roles` | users + admin/employee roles (`has_role()`) |
| `company_profile` | singleton business info + branding asset URLs |
| `customers` | customer master with auto codes |
| `inquiries` | leads with source, service, status pipeline |
| `quotations` + `quotation_items` | quotes; items have `include_in_total` flag |
| `invoices` + `invoice_items` | bills; status synced from receipts |
| `receipts` | payments with mode, txn id, balance |

Auto-numbering is handled by Postgres sequences — no manual entry needed.

## Project Structure

```text
src/
├── routes/
│   ├── auth.tsx, reset-password.tsx        # public auth pages
│   └── _authenticated/                     # protected area
│       ├── dashboard.tsx                   # home
│       ├── customers.tsx  inquiries.tsx  outstanding.tsx
│       ├── quotations/  invoices/  receipts/   # list, new, $id, edit
│       └── settings.tsx
├── components/doc/                         # document system
│   ├── DocForm.tsx                         # line-item builder
│   ├── TradeDocSheet.tsx                   # A4 quotation/invoice layout
│   ├── ReceiptSheet.tsx                    # A4 receipt layout
│   └── CustomerPicker.tsx, DocActions.tsx, ConfirmDelete.tsx
├── lib/                                    # crm.ts (data), pdf.ts, format.ts,
│                                           # branding.ts, options.ts, image.ts
└── integrations/supabase/                  # generated client (do not edit)
```

## Running Locally

```sh
git clone <repo-url>
cd <repo>
npm i
npm run dev
```

---

Built with [Lovable](https://lovable.dev). Continue developing in the
[Lovable editor](https://lovable.dev/projects/b2ff8e0d-0184-422a-80de-a3dcc0790968).
