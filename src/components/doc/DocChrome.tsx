import type { CompanyProfile } from "@/lib/crm";
import { DEFAULT_LOGO_URL, DEFAULT_SIGNATURE_URL } from "@/lib/branding";


/** Maroon + gold letterhead shared by quotation, invoice and receipt sheets. */
export function DocHeader({ company }: { company: CompanyProfile }) {
  const logo = company.logo_url || DEFAULT_LOGO_URL;
  return (
    <div>
      <div
        style={{ backgroundColor: "#6B1024", color: "#FFF8F0" }}
        className="flex items-center gap-5 px-10 py-6"
      >
        <img
          src={logo}
          alt={`${company.name} logo`}
          crossOrigin="anonymous"
          className="h-[70px] w-[70px] shrink-0 rounded-full bg-white object-contain p-1"
        />


        <div className="min-w-0 flex-1">
          <h1 className="font-display text-[26px] leading-tight tracking-wide">{company.name}</h1>
          <p style={{ color: "#E8C874" }} className="text-[12px] italic">
            {company.tagline}
          </p>
        </div>

        <div className="shrink-0 text-right text-[11px] leading-[1.6]">
          <p className="max-w-[190px]">{company.address}</p>
          <p>
            {company.mobile1}
            {company.mobile2 ? ` / ${company.mobile2}` : ""}
          </p>
          <p>{company.email}</p>
          {company.website && <p>{company.website}</p>}
        </div>
      </div>
      <div style={{ backgroundColor: "#C9A227" }} className="h-[5px] w-full" />
    </div>
  );
}

export function DocTitleBar({ title }: { title: string }) {
  return (
    <div className="px-10 pt-7">
      <h2
        style={{ color: "#6B1024", borderColor: "#E5D7B8" }}
        className="border-b pb-2 text-center font-display text-[19px] uppercase tracking-[0.35em]"
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
          <div style={{ borderColor: "#9A8B6A" }} className="mb-1 h-[54px] border-b border-dashed" />
          <p className="text-[11px] text-[#5A4A50]">{leftLabel}</p>
        </div>

        <div className="relative w-[240px] text-center">
          <div className="flex h-[54px] items-end justify-center gap-2">
            {company.stamp_url && (
              <img
                src={company.stamp_url}
                alt="Company stamp"
                crossOrigin="anonymous"
                className="h-[54px] object-contain"
              />
            )}
            <img
              src={company.signature_url || DEFAULT_SIGNATURE_URL}
              alt="Authorised signature"
              crossOrigin="anonymous"
              className="h-[44px] object-contain mix-blend-multiply"
            />
          </div>

          <div style={{ borderColor: "#9A8B6A" }} className="mb-1 border-b border-dashed" />
          <p className="text-[11px] font-medium text-[#5A4A50]">
            For {company.name} — Authorised Signatory
          </p>
        </div>
      </div>

      <div
        style={{ backgroundColor: "#6B1024", color: "#F2DFC2" }}
        className="px-10 py-2.5 text-center text-[10px] tracking-wide"
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
        style={{ color: "#6B1024" }}
        className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.18em]"
      >
        {heading}
      </p>
      <table className="text-[11.5px] leading-[1.7]">
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k}>
              <td className="pr-3 align-top text-[#7A6A70] whitespace-nowrap">{k}</td>
              <td className="align-top font-medium text-[#241318]">{v || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
