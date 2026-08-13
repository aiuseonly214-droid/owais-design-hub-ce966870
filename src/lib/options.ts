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

export const INQUIRY_SOURCES = [
  { value: "walk_in", label: "Walk-in" },
  { value: "reference", label: "Reference" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "call", label: "Phone Call" },
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "google", label: "Google / Website" },
  { value: "other", label: "Other" },
] as const;

export const INQUIRY_STATUS = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "quoted", label: "Quotation Sent" },
  { value: "won", label: "Converted (Won)" },
  { value: "lost", label: "Lost" },
] as const;

export const SERVICES = [
  "Interior Design",
  "False Ceiling",
  "POP Work",
  "Modular Kitchen",
  "Wardrobe",
  "Furniture",
  "Painting",
  "Flooring",
  "Electrical",
  "Renovation",
  "Other",
] as const;
