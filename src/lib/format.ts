const ONES = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];

const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function twoDigits(n: number): string {
  if (n < 20) return ONES[n];
  const t = Math.floor(n / 10);
  const o = n % 10;
  return TENS[t] + (o ? " " + ONES[o] : "");
}

function threeDigits(n: number): string {
  const h = Math.floor(n / 100);
  const rest = n % 100;
  let out = "";
  if (h) out += ONES[h] + " Hundred";
  if (rest) out += (out ? " " : "") + twoDigits(rest);
  return out;
}

/** Indian numbering system: crore / lakh / thousand / hundred */
export function numberToIndianWords(value: number): string {
  const n = Math.floor(Math.abs(value));
  if (n === 0) return "Zero";

  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const hundred = n % 1000;

  const parts: string[] = [];
  if (crore) parts.push(twoDigitsOrMore(crore) + " Crore");
  if (lakh) parts.push(twoDigits(lakh) + " Lakh");
  if (thousand) parts.push(twoDigits(thousand) + " Thousand");
  if (hundred) parts.push(threeDigits(hundred));

  return parts.join(" ").replace(/\s+/g, " ").trim();
}

function twoDigitsOrMore(n: number): string {
  if (n < 100) return twoDigits(n);
  return numberToIndianWords(n);
}

/** "Rupees Twelve Thousand Five Hundred and Fifty Paise Only" */
export function amountInWords(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  const rupees = Math.floor(Math.abs(safe));
  const paise = Math.round((Math.abs(safe) - rupees) * 100);

  let out = "Rupees " + numberToIndianWords(rupees);
  if (paise > 0) out += " and " + numberToIndianWords(paise) + " Paise";
  return out + " Only";
}

const inr = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** 12500.5 -> "12,500.50" */
export function formatAmount(value: number | string | null | undefined): string {
  const n = typeof value === "string" ? parseFloat(value) : (value ?? 0);
  return inr.format(Number.isFinite(n) ? n : 0);
}

/** 12500.5 -> "₹ 12,500.50" */
export function formatINR(value: number | string | null | undefined): string {
  return "\u20B9 " + formatAmount(value);
}

/** "2026-07-29" -> "29 Jul 2026" */
export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value + (value.length === 10 ? "T00:00:00" : ""));
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function todayISO(): string {
  const d = new Date();
  const p = (x: number) => String(x).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function addDaysISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const p = (x: number) => String(x).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function toNumber(value: unknown): number {
  const n = typeof value === "number" ? value : parseFloat(String(value ?? ""));
  return Number.isFinite(n) ? n : 0;
}
