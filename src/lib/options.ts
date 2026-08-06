/** Shared dropdown option lists used across the CRM forms. */

export const UNITS = [
  "Nos",
  "Sqft",
  "Rft",
  "Sqm",
  "Rmt",
  "Set",
  "Piece",
  "Panel",
  "Sheet",
  "Box",
  "Kg",
  "Litre",
  "Day",
  "Job",
  "Lumpsum",
] as const;

export const PAYMENT_MODES = [
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "bank", label: "Bank Transfer" },
  { value: "cheque", label: "Cheque" },
  { value: "card", label: "Card" },
  { value: "other", label: "Other" },
] as const;

export const QUOTATION_STATUS = [
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
] as const;

export const INVOICE_STATUS = [
  { value: "unpaid", label: "Unpaid" },
  { value: "partial", label: "Partially Paid" },
  { value: "paid", label: "Paid" },
  { value: "cancelled", label: "Cancelled" },
] as const;

export function labelOf(
  list: ReadonlyArray<{ value: string; label: string }>,
  value: string,
): string {
  return list.find((o) => o.value === value)?.label ?? value;
}
