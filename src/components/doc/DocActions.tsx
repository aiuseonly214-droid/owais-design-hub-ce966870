import { useRef } from "react";
import { Download, Printer } from "lucide-react";
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
  const busy = useRef(false);

  async function download() {
    if (busy.current) return;
    const el = targetRef.current;
    if (!el) return;
    busy.current = true;
    try {
      await exportElementToPdf(el, filename);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create the PDF");
    } finally {
      busy.current = false;
    }
  }

  return (
    <div className="mb-5 flex flex-wrap gap-2 no-print">
      <Button size="sm" onClick={() => printDocument()}>
        <Printer className="size-4" /> Print
      </Button>
      <Button size="sm" variant="secondary" onClick={download}>
        <Download className="size-4" /> Download PDF
      </Button>
      {children}
    </div>
  );
}
