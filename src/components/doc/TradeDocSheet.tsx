import { forwardRef } from "react";
import type { CompanyProfile, Customer, DocItem } from "@/lib/crm";
import { formatAmount, formatDate } from "@/lib/format";
import { DocFooter, DocHeader, DocTitleBar, InfoBlock } from "./DocChrome";
import { DOC } from "@/lib/branding";

export type TradeDoc = {
  code: string;
  date: string;
  secondaryDate: string | null;
  subject: string | null;
  subtotal: number;
  discount: number;
  grand_total: number;
  amount_words: string | null;
  terms: string | null;
  /** When false, totals and amount-in-words are hidden (option-list documents). */
  show_totals?: boolean | null;
};

type Props = {
  kind: "QUOTATION" | "INVOICE";
  company: CompanyProfile;
  customer: Customer | null | undefined;
  doc: TradeDoc;
  items: DocItem[];
};

/** A4 sheet used for both quotations and invoices. */
export const TradeDocSheet = forwardRef<HTMLDivElement, Props>(function TradeDocSheet(
  { kind, company, customer, doc, items },
  ref,
) {
  const numberLabel = kind === "QUOTATION" ? "Quotation No." : "Invoice No.";
  const detailRows: [string, string | null | undefined][] = [
    [numberLabel, doc.code],
    ["Date", formatDate(doc.date)],
  ];
  // Invoices are payable on presentation, so no due date is shown.
  if (kind === "QUOTATION") {
    detailRows.push(["Valid Till", doc.secondaryDate ? formatDate(doc.secondaryDate) : "—"]);
  }
  detailRows.push(["Customer ID", customer?.code]);

  return (
    <div ref={ref} className="doc-sheet mx-auto flex flex-col shadow-lg">
      <DocHeader company={company} />
      <DocTitleBar title={kind} />

      <div className="grid grid-cols-2 gap-8 px-10 pt-5">
        <InfoBlock
          heading={kind === "QUOTATION" ? "Quotation To" : "Billed To"}
          rows={[
            ["Name", customer?.name],
            ["Mobile", customer?.mobile],
            ["Address", customer?.site_address || customer?.billing_address],
            ["City", customer?.city],
          ]}
        />
        <div className="justify-self-end text-right">
          <InfoBlock
            heading="Details"
            rows={detailRows}
          />

        </div>
      </div>

      {doc.subject && (
        <p className="px-10 pt-4 text-[13px]">
          <span className="text-[#5A6B80]">Subject: </span>
          <span className="font-medium text-[#12233A]">{doc.subject}</span>
        </p>
      )}

      <div className="px-10 pt-5">
        <table className="w-full border-collapse text-[12.5px]">
          <thead>
            <tr style={{ backgroundColor: DOC.primary, color: DOC.primaryText }}>
              <th className="w-[38px] border border-[#123A70] px-2 py-2 text-center font-semibold">
                Sr
              </th>
              <th className="border border-[#123A70] px-2 py-2 text-left font-semibold">
                Particular
              </th>
              <th className="w-[58px] border border-[#123A70] px-2 py-2 text-center font-semibold">
                Unit
              </th>
              <th className="w-[54px] border border-[#123A70] px-2 py-2 text-center font-semibold">
                Qty
              </th>
              <th className="w-[82px] border border-[#123A70] px-2 py-2 text-right font-semibold">
                Rate
              </th>
              <th className="w-[96px] border border-[#123A70] px-2 py-2 text-right font-semibold">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="border border-[#CBD9EA] px-2 py-6 text-center text-[#5A6B80]">
                  No items added
                </td>
              </tr>
            )}
            {items.map((it, idx) => (
              <tr key={idx} style={{ backgroundColor: idx % 2 ? "#F7FAFD" : "#FFFFFF" }}>
                <td className="border border-[#CBD9EA] px-2 py-2 text-center align-top">{idx + 1}</td>
                <td className="border border-[#CBD9EA] px-2 py-2 align-top">
                  <span className="font-medium text-[#12233A]">{it.particular}</span>
                  {it.include_in_total === false && (
                    <span className="ml-2 rounded border border-[#CBD9EA] bg-[#EEF4FB] px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wider text-[#5A6B80]">
                      Option
                    </span>
                  )}
                </td>
                <td className="border border-[#CBD9EA] px-2 py-2 text-center align-top">
                  {it.unit || "—"}
                </td>
                <td className="border border-[#CBD9EA] px-2 py-2 text-center align-top">{it.qty}</td>
                <td className="border border-[#CBD9EA] px-2 py-2 text-right align-top">
                  {formatAmount(it.rate)}
                </td>
                <td className="border border-[#CBD9EA] px-2 py-2 text-right align-top font-medium">
                  {formatAmount(it.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {doc.show_totals !== false && (
      <div className="flex justify-end px-10 pt-4">
        <table className="w-[280px] text-[13px]">
          <tbody>
            <tr>
              <td className="py-1 text-[#5A6B80]">Sub Total</td>
              <td className="py-1 text-right font-medium">₹ {formatAmount(doc.subtotal)}</td>
            </tr>
            {Number(doc.discount) > 0 && (
              <tr>
                <td className="py-1 text-[#5A6B80]">
                  Discount
                  {Number(doc.subtotal) > 0
                    ? ` (${(((Number(doc.discount) / Number(doc.subtotal)) * 100).toFixed(1)).replace(/\.0$/, "")}%)`
                    : ""}
                </td>

                <td className="py-1 text-right font-medium">− ₹ {formatAmount(doc.discount)}</td>
              </tr>
            )}
            <tr>
              <td
                style={{ backgroundColor: DOC.primary, color: DOC.primaryText }}
                className="px-2 py-2 font-semibold"
              >
                Grand Total
              </td>
              <td
                style={{ backgroundColor: DOC.primary, color: DOC.primaryText }}
                className="px-2 py-2 text-right font-semibold"
              >
                ₹ {formatAmount(doc.grand_total)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      )}

      {doc.show_totals !== false && (
      <div
        style={{ backgroundColor: "#EEF4FB", borderColor: DOC.border }}
        className="mx-10 mt-4 border px-3 py-2 text-[12.5px]"
      >
        <span className="text-[#5A6B80]">Amount in words: </span>
        <span className="font-medium text-[#12233A]">{doc.amount_words || "—"}</span>
      </div>
      )}

      {doc.terms && (
        <div className="px-10 pt-5">
          <p
            style={{ color: DOC.primary }}
            className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em]"
          >
            Terms &amp; Conditions
          </p>
          <p className="whitespace-pre-line text-[11.5px] leading-[1.7] text-[#3C4C60]">
            {doc.terms}
          </p>
        </div>
      )}

      <DocFooter company={company} />
    </div>
  );
});
