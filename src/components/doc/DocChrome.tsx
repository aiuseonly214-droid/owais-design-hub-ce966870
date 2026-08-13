import type { CompanyProfile } from "@/lib/crm";
import { DEFAULT_LOGO_URL, DEFAULT_SIGNATURE_URL, DOC } from "@/lib/branding";

/** Blue + white letterhead shared by quotation, invoice and receipt sheets. */
export function DocHeader({ company }: { company: CompanyProfile }) {
  const logo = company.logo_url || DEFAULT_LOGO_URL;
  return (
    <div>
      <div
        style={{ backgroundColor: DOC.primary, color: DOC.primaryText }}
        className="flex items-center gap-5 px-10 py-6"
      >
        <img
          src={logo}
          alt={`${company.name} logo`}
          crossOrigin="anonymous"
          className="h-[76px] w-[76px] shrink-0 rounded-full bg-white object-contain p-1"
        />

        <div className="min-w-0 flex-1">
          <h1 className="font-display text-[29px] leading-tight tracking-wide">{company.name}</h1>
          <p style={{ color: "#BFE4E3" }} className="text-[13px] italic">
            {company.tagline}
          </p>
        </div>

        <div className="shrink-0 text-right text-[12px] leading-[1.65]">
          <p className="max-w-[200px]">{company.address}</p>
          <p>
            {company.mobile1}
            {company.mobile2 ? ` / ${company.mobile2}` : ""}
          </p>
          <p>{company.email}</p>
          {company.website && <p>{company.website}</p>}
        </div>
      </div>
      <div style={{ backgroundColor: DOC.accent }} className="h-[5px] w-full" />
    </div>
  );
}

export function DocTitleBar({ title }: { title: string }) {
  return (
    <div className="px-10 pt-7">
      <h2
        style={{ color: DOC.primary, borderColor: DOC.border }}
        className="border-b pb-2 text-center font-display text-[21px] uppercase tracking-[0.35em]"
      >
        {title}
      </h2>
    </div>
  );
}

export function DocFooter({
  company,
  leftLabel = "Customer Signature",
}: {
  company: CompanyProfile;
  leftLabel?: string;
}) {
  return (
    <div className="mt-auto">
      <div className="flex items-end justify-between gap-8 px-10 pb-6 pt-10">
        <div className="w-[210px] text-center">
          <div style={{ borderColor: DOC.border }} className="mb-1 h-[56px] border-b border-dashed" />
          <p className="text-[12px]" style={{ color: DOC.muted }}>
            {leftLabel}
          </p>
        </div>

        <div className="relative w-[240px] text-center">
          <div className="relative flex h-[56px] items-end justify-center">
            <img
              src={company.signature_url || DEFAULT_SIGNATURE_URL}
              alt="Authorised signature"
              crossOrigin="anonymous"
              className="h-[48px] object-contain"
            />

            {/* Stamp sits lightly over the signature, like a real rubber stamp. */}
            {company.stamp_url && (
              <img
                src={company.stamp_url}
                alt="Company stamp"
                crossOrigin="anonymous"
                style={{ opacity: 0.55, transform: "rotate(-12deg)" }}
                className="pointer-events-none absolute -top-[18px] right-[6px] h-[86px] w-[86px] object-contain"
              />
            )}
          </div>

          <div style={{ borderColor: DOC.border }} className="mb-1 border-b border-dashed" />
          <p className="text-[12px] font-medium" style={{ color: DOC.muted }}>
            For {company.name} — Authorised Signatory
          </p>
        </div>
      </div>

      <div
        style={{ backgroundColor: DOC.primary, color: "#DCE9F7" }}
        className="px-10 py-2.5 text-center text-[11px] tracking-wide"
      >
        Thank you for your business · {company.mobile1}
        {company.mobile2 ? ` / ${company.mobile2}` : ""} · {company.email}
      </div>
    </div>
  );
}

export function InfoBlock({
  heading,
  rows,
}: {
  heading: string;
  rows: Array<[string, string | null | undefined]>;
}) {
  return (
    <div>
      <p
        style={{ color: DOC.primary }}
        className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.18em]"
      >
        {heading}
      </p>
      <table className="text-[12.5px] leading-[1.7]">
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k}>
              <td className="pr-3 align-top whitespace-nowrap" style={{ color: DOC.muted }}>
                {k}
              </td>
              <td className="align-top font-medium" style={{ color: DOC.text }}>
                {v || "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
