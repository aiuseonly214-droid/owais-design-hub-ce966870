# OWAIS INTERIOR DESIGNER CRM — Phase 1 Prototype SRS
## Software Requirement Specification (for Quotation + Invoice + Receipt)

**Version:** 1.0 — Prototype Scope
**Project:** Owais Interior Designer CRM
**Prepared for:** Academic Semester Prototype
**Date:** 06 Aug 2026

---

## 1. Project Scope

Build a working web-based prototype for Phase 1 only.

**Modules included in Phase 1:**
1. Authentication & Role-based Login
2. Company Profile / Settings
3. Customer Management
4. Quotation Management
5. Invoice Management
6. Receipt Management

**Modules NOT in Phase 1 (future semesters):**
Dashboard analytics, project management, payment ledger, reports, global search, notifications, multi-branch, employee attendance, inventory, expenses, WhatsApp/SMS integration.

---

## 2. Business Details

| Field | Value |
|---|---|
| Company Name | Owais Interior Designer |
| Tagline | Turning your space into elegant design |
| Address | Rahmat Nagar, Wadala, Nashik, Maharashtra |
| Mobile 1 | 7756043214 |
| Mobile 2 | 7721926290 |
| Email | onlyw6469@gmail.com |
| Currency | INR (₹) |
| GST | No |
| Bank Details | No |
| Users | 1 Admin + 1 Employee |
| Theme | Premium Maroon (#800020) + Gold (#C9A227) + White |

---

## 3. User Roles

| Role | Access |
|---|---|
| **Admin** | Full access: settings, customers, quotations, invoices, receipts, user management |
| **Employee** | Can create/view customers, quotations, invoices, receipts. Cannot change company settings or manage users. |

---

## 4. Database Schema (Phase 1)

### Tables

#### `company_profile` (singleton)
- id, name, tagline, address, mobile1, mobile2, email, website
- logo_url, stamp_url, signature_url, currency, default_terms

#### `user_roles`
- id, user_id (FK auth.users), role (admin|employee)
- `has_role(user_id, role)` security function

#### `customers`
- id, code (CUS-0001), name, mobile, alt_mobile, email
- site_address, billing_address, city, notes, created_at

#### `quotations`
- id, code (QT-2026-0001), customer_id, date, valid_till
- subject, subtotal, discount, grand_total, amount_words, terms, status
- created_at

#### `quotation_items`
- id, quotation_id, sr, particular, description, unit, qty, rate, amount

#### `invoices`
- id, code (INV-2026-0001), customer_id, quotation_id (nullable), date, due_date
- subject, subtotal, discount, grand_total, amount_words, terms, status
- created_at

#### `invoice_items`
- id, invoice_id, sr, particular, description, unit, qty, rate, amount

#### `receipts`
- id, code (RC-2026-0001), customer_id, invoice_id (nullable), date
- total_amount, previous_paid, amount_received, balance
- mode (cash|upi|bank|cheque), txn_id, amount_words, notes, created_at

### Auto-Numbering
- Postgres sequences generate next codes: CUS-0001, QT-2026-0001, INV-2026-0001, RC-2026-0001.

---

## 5. Functional Requirements

### 5.1 Authentication
- Login with email + password
- “Remember me” option
- Forgot password → reset link → `/reset-password` page
- After login, redirect to home dashboard
- Session managed via Supabase Auth

### 5.2 Home / Dashboard
- Quick action buttons: New Quotation, New Invoice, New Receipt, New Customer
- Recent 5 quotations, 5 invoices, 5 receipts
- Summary cards: Total Customers, Total Quotations, Total Invoices, Outstanding Amount

### 5.3 Customers
- List all customers with search by name/mobile/code/city
- Add new customer with auto-generated code
- Edit customer details
- Delete customer (only if no linked documents)

### 5.4 Quotation Builder
- Pick existing customer or add inline
- Document header: QT-YYYY-XXXX, date, valid till, subject
- Line items table:
  - Sr No
  - Particular
  - Description
  - Unit
  - Qty
  - Rate
  - Amount (auto = qty × rate)
- Live totals:
  - Subtotal (sum of line amounts)
  - Discount (flat ₹ or %)
  - Grand Total
- Amount in words auto-generated (Indian format)
- Editable Terms & Conditions (default pulled from company profile)
- Status: Draft, Sent, Approved, Rejected
- Actions: Save, Print, Download PDF, Duplicate, Edit, Convert to Invoice

### 5.5 Invoice Builder
- Pick customer or auto-fill from a quotation
- Document header: INV-YYYY-XXXX, date, due date, subject
- Same line-item editor and total logic as quotation
- Amount in words auto-generated
- Editable terms
- Status: Draft, Sent, Paid, Overdue, Cancelled
- Actions: Save, Print, PDF, Edit, Record Payment

### 5.6 Receipt
- Created when “Record Payment” is clicked on an invoice
- Auto-pulls: total amount, previous paid, balance due
- User enters: amount received, mode (cash/upi/bank/cheque), txn id, date, notes
- Receipt code: RC-YYYY-XXXX
- Actions: Save, Print, PDF

### 5.7 Settings / Company Profile
- Edit company name, tagline, address, mobile, email
- Upload logo, stamp, signature (stored as base64 for PDF reliability)
- Set default Terms & Conditions
- Change password

---

## 6. A4 Document Template Requirements

All documents (Quotation, Invoice, Receipt) must share a premium A4 layout:

- **Top header band:** Maroon (#800020) background, gold (#C9A227) text
  - Left: Logo (or styled text logo until asset uploaded)
  - Center: Company name + tagline
  - Right: Address, mobile, email
- **Gold horizontal rule** below header
- **Document title bar:** Document type (QUOTATION / INVOICE / RECEIPT), code, date, validity/due date
- **Customer block:** To / Bill To with customer details
- **Items table:** Clean table with maroon header, gold accent borders, white body rows
- **Totals block:** Right-aligned, subtotal → discount → grand total
- **Amount in words:** Below totals in italic gold text
- **Terms & Conditions:** Numbered list
- **Footer:** Authorized signature area + company stamp image
- **Print-only CSS:** Hide sidebar, buttons, and form chrome; force A4 page size

---

## 7. Non-Functional Requirements

- **Responsive:** Forms must work on mobile; print/PDF layout is fixed A4.
- **Tech Stack:** TanStack Start + React + Tailwind CSS + Lovable Cloud (Supabase)
- **PDF Engine:** jsPDF + html2canvas-pro from a hidden A4 print DOM
- **Security:** Row Level Security (RLS) on all tables; users see only their own data
- **Offline-friendly:** No offline requirement; always online via Supabase

---

## 8. Routes / Screens

| Route | Purpose |
|---|---|
| `/auth` | Login page |
| `/reset-password` | Set new password |
| `/` | Home dashboard |
| `/customers` | Customer list + search |
| `/quotations` | Quotation list + search |
| `/quotations/new` | Create quotation |
| `/quotations/$id` | View quotation + print/PDF/duplicate/edit/convert |
| `/invoices` | Invoice list + search |
| `/invoices/new` | Create invoice |
| `/invoices/$id` | View invoice + print/PDF/edit/record payment |
| `/receipts` | Receipt list |
| `/receipts/new` | Create receipt (usually from invoice) |
| `/receipts/$id` | View receipt + print/PDF |
| `/settings` | Company profile + uploads + password |

---

## 9. Pending Information Needed

Before final prototype build, the following details are still required:

1. **Logo / Stamp / Signature assets** — PNG with transparent background (or confirm we use styled text logo for now).
2. **Default Terms & Conditions text** — the standard terms to appear on every quotation and invoice.
3. **Quotation validity default** — e.g., 15 days, 30 days, or custom.
4. **Invoice due date default** — e.g., 7 days, 15 days, or none.
5. **Admin/Employee login credentials** — email and password for the first admin (employee can be added later).
6. **Receipt mode preference** — default payment mode (cash/upi/bank/cheque) or always manual.
7. **Line-item default unit** — e.g., “nos”, “sqft”, “rft”, “set”.
8. **Any additional footer text** — e.g., “Thank you for your business” or custom note.

---

## 10. Acceptance Criteria

- Admin can log in and see dashboard.
- Admin can add customers and see them in list.
- Admin can create a quotation with 3+ line items, totals are correct, amount in words is correct.
- Quotation can be printed and downloaded as PDF in A4 maroon/gold template.
- Quotation can be converted to invoice with auto-copied items.
- Invoice can be marked with a payment; receipt auto-pulls totals and balance.
- Receipt can be printed/PDF in same template style.
- Employee can log in and use builders but cannot change company settings.
- All data persists after refresh.

---

## 11. Out of Scope (Phase 1)

- Dashboard charts and revenue graphs
- Project management (PRJ codes, status pipeline, progress photos)
- Payment ledger and pending-balance reports
- Global search (⌘K)
- Notifications (pending payments, follow-ups)
- Reports export to Excel
- Multi-branch, multi-language, WhatsApp, SMS, email
- Inventory, expenses, attendance, profit & loss
- Digital signature capture

---

**End of Phase 1 Prototype SRS**
