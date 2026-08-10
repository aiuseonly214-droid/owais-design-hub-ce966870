import { useState } from "react";
import { Download, Loader2, Printer } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { exportElementToPdf, printDocument } from "@/lib/pdf";

/** Wraps an A4 sheet with print / PDF actions and extra buttons. */
export function DocActions({
  filename,
  targetRef,
  children,
}: {
  filename: string;
  targetRef: React.RefObject<HTMLDivElement | null>;
  children?: React.ReactNode;
}) {
  const [busy, setBusy] = useState(false);

  async function download() {
    if (busy) return;
    const el = targetRef.current;
    if (!el) return toast.error("The document is still loading");
    setBusy(true);
    const id = toast.loading("Generating PDF…");
    try {
      await exportElementToPdf(el, filename);
      toast.success("PDF downloaded", { id });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create the PDF", { id });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mb-5 flex flex-wrap gap-2 no-print">
      <Button size="sm" onClick={() => printDocument()}>
        <Printer className="size-4" /> Print
      </Button>
      <Button size="sm" variant="secondary" onClick={download} disabled={busy}>
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
        Download PDF
      </Button>
      {children}
    </div>
  );
}
