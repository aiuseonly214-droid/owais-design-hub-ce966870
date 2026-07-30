import { forwardRef } from "react";
import type { CompanyProfile, Customer, DocItem } from "@/lib/crm";
import { formatAmount, formatDate } from "@/lib/format";
import { DocFooter, DocHeader, DocTitleBar, InfoBlock } from "./DocChrome";

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
  const secondaryLabel = kind === "QUOTATION" ? "Valid Till" : "Due Date";
  const numberLabel = kind === "QUOTATION" ? "Quotation No." : "Invoice No.";

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
            rows={[
              [numberLabel, doc.code],
              ["Date", formatDate(doc.date)],
              [secondaryLabel, doc.secondaryDate ? formatDate(doc.secondaryDate) : "—"],
              ["Customer ID", customer?.code],
            ]}
          />
        </div>
      </div>

      {doc.subject && (
        <p className="px-10 pt-4 text-[12px]">
          <span className="text-[#7A6A70]">Subject: </span>
          <span className="font-medium text-[#241318]">{doc.subject}</span>
        </p>
      )}

      <div className="px-10 pt-5">
        <table className="w-full border-collapse text-[11.5px]">
          <thead>
            <tr style={{ backgroundColor: "#6B1024", color: "#FFF8F0" }}>
              <th className="w-[38px] border border-[#6B1024] px-2 py-2 text-center font-semibold">
                Sr
              </th>
              <th className="border border-[#6B1024] px-2 py-2 text-left font-semibold">
                Particular
              </th>
              <th className="w-[58px] border border-[#6B1024] px-2 py-2 text-center font-semibold">
                Unit
              </th>
              <th className="w-[54px] border border-[#6B1024] px-2 py-2 text-center font-semibold">
                Qty
              </th>
              <th className="w-[82px] border border-[#6B1024] px-2 py-2 text-right font-semibold">
                Rate
              </th>
              <th className="w-[96px] border border-[#6B1024] px-2 py-2 text-right font-semibold">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="border border-[#E0D3D6] px-2 py-6 text-center text-[#7A6A70]">
                  No items added
                </td>
              </tr>
            )}
            {items.map((it, idx) => (
              <tr key={idx} style={{ backgroundColor: idx % 2 ? "#FBF7F2" : "#FFFFFF" }}>
                <td className="border border-[#E0D3D6] px-2 py-2 text-center align-top">{idx + 1}</td>
                <td className="border border-[#E0D3D6] px-2 py-2 align-top">
                  <span className="font-medium text-[#241318]">{it.particular}</span>
                  {it.description && (
                    <span className="block text-[10.5px] leading-snug text-[#7A6A70]">
                      {it.description}
                    </span>
                  )}
                </td>
                <td className="border border-[#E0D3D6] px-2 py-2 text-center align-top">
                  {it.unit || "—"}
                </td>
                <td className="border border-[#E0D3D6] px-2 py-2 text-center align-top">{it.qty}</td>
                <td className="border border-[#E0D3D6] px-2 py-2 text-right align-top">
                  {formatAmount(it.rate)}
                </td>
                <td className="border border-[#E0D3D6] px-2 py-2 text-right align-top font-medium">
                  {formatAmount(it.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end px-10 pt-4">
        <table className="w-[280px] text-[12px]">
          <tbody>
            <tr>
              <td className="py-1 text-[#7A6A70]">Sub Total</td>
              <td className="py-1 text-right font-medium">₹ {formatAmount(doc.subtotal)}</td>
            </tr>
            {Number(doc.discount) > 0 && (
              <tr>
                <td className="py-1 text-[#7A6A70]">Discount</td>
                <td className="py-1 text-right font-medium">− ₹ {formatAmount(doc.discount)}</td>
              </tr>
            )}
            <tr>
              <td
                style={{ backgroundColor: "#6B1024", color: "#FFF8F0" }}
                className="px-2 py-2 font-semibold"
              >
                Grand Total
              </td>
              <td
                style={{ backgroundColor: "#6B1024", color: "#FFF8F0" }}
                className="px-2 py-2 text-right font-semibold"
              >
                ₹ {formatAmount(doc.grand_total)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        style={{ backgroundColor: "#FBF3E4", borderColor: "#E5D7B8" }}
        className="mx-10 mt-4 border px-3 py-2 text-[11.5px]"
      >
        <span className="text-[#7A6A70]">Amount in words: </span>
        <span className="font-medium text-[#241318]">{doc.amount_words || "—"}</span>
      </div>

      {doc.terms && (
        <div className="px-10 pt-5">
          <p
            style={{ color: "#6B1024" }}
            className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em]"
          >
            Terms &amp; Conditions
          </p>
          <p className="whitespace-pre-line text-[10.5px] leading-[1.7] text-[#5A4A50]">
            {doc.terms}
          </p>
        </div>
      )}

      <DocFooter company={company} />
    </div>
  );
});
