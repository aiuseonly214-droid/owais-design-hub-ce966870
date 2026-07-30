import { forwardRef } from "react";
import type { CompanyProfile, Customer, Receipt } from "@/lib/crm";
import { formatAmount, formatDate } from "@/lib/format";
import { DocFooter, DocHeader, DocTitleBar, InfoBlock } from "./DocChrome";

const MODE_LABEL: Record<string, string> = {
  cash: "Cash",
  upi: "UPI",
  bank: "Bank Transfer",
  cheque: "Cheque",
};

export const ReceiptSheet = forwardRef<
  HTMLDivElement,
  { company: CompanyProfile; customer: Customer | null | undefined; receipt: Receipt }
>(function ReceiptSheet({ company, customer, receipt }, ref) {
  return (
    <div ref={ref} className="doc-sheet mx-auto flex flex-col shadow-lg">
      <DocHeader company={company} />
      <DocTitleBar title="Payment Receipt" />

      <div className="grid grid-cols-2 gap-8 px-10 pt-5">
        <InfoBlock
          heading="Received From"
          rows={[
            ["Name", customer?.name],
            ["Mobile", customer?.mobile],
            ["Address", customer?.billing_address || customer?.site_address],
            ["City", customer?.city],
          ]}
        />
        <div className="justify-self-end text-right">
          <InfoBlock
            heading="Details"
            rows={[
              ["Receipt No.", receipt.code],
              ["Date", formatDate(receipt.date)],
              ["Payment Mode", MODE_LABEL[receipt.mode] ?? receipt.mode],
              ["Transaction ID", receipt.txn_id],
            ]}
          />
        </div>
      </div>

      <div className="px-10 pt-6">
        <div
          style={{ backgroundColor: "#6B1024", color: "#FFF8F0" }}
          className="flex items-center justify-between px-5 py-4"
        >
          <span className="text-[12px] uppercase tracking-[0.22em]">Amount Received</span>
          <span className="font-display text-[28px]">₹ {formatAmount(receipt.amount_received)}</span>
        </div>
      </div>

      <div className="px-10 pt-5">
        <table className="w-full border-collapse text-[12px]">
          <tbody>
            {[
              ["Total Project / Invoice Amount", receipt.total_amount],
              ["Previously Paid", receipt.previous_paid],
              ["Amount Received Now", receipt.amount_received],
            ].map(([label, value]) => (
              <tr key={String(label)}>
                <td className="border border-[#E0D3D6] px-3 py-2.5 text-[#5A4A50]">{label}</td>
                <td className="w-[150px] border border-[#E0D3D6] px-3 py-2.5 text-right font-medium">
                  ₹ {formatAmount(value as number)}
                </td>
              </tr>
            ))}
            <tr style={{ backgroundColor: "#FBF3E4" }}>
              <td className="border border-[#E0D3D6] px-3 py-2.5 font-semibold text-[#6B1024]">
                Balance Amount
              </td>
              <td className="border border-[#E0D3D6] px-3 py-2.5 text-right font-semibold text-[#6B1024]">
                ₹ {formatAmount(receipt.balance)}
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
        <span className="font-medium text-[#241318]">{receipt.amount_words || "—"}</span>
      </div>

      {receipt.notes && (
        <div className="px-10 pt-5">
          <p
            style={{ color: "#6B1024" }}
            className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em]"
          >
            Notes
          </p>
          <p className="whitespace-pre-line text-[10.5px] leading-[1.7] text-[#5A4A50]">
            {receipt.notes}
          </p>
        </div>
      )}

      <DocFooter company={company} leftLabel="Customer Signature" />
    </div>
  );
});
