/** Render a DOM node to a downloadable A4 PDF. */

async function toDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { mode: "cors", credentials: "omit" });
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result));
      fr.onerror = () => reject(fr.error);
      fr.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/** Swap remote <img> sources for data URLs so the canvas never gets tainted. */
async function inlineImages(el: HTMLElement): Promise<() => void> {
  const imgs = Array.from(el.querySelectorAll("img"));
  const restores: Array<() => void> = [];
  await Promise.all(
    imgs.map(async (img) => {
      const src = img.getAttribute("src");
      if (!src || src.startsWith("data:")) return;
      const data = await toDataUrl(src);
      if (!data) return;
      restores.push(() => img.setAttribute("src", src));
      img.setAttribute("src", data);
      await img.decode().catch(() => undefined);
    }),
  );
  return () => restores.forEach((r) => r());
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Inside sandboxed previews a download can be blocked — open it instead.
  const inIframe = window.self !== window.top;
  if (inIframe) window.open(url, "_blank", "noopener");
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/** Wait until fonts and every <img> inside the node are really painted. */
async function waitForPaint(el: HTMLElement) {
  try {
    await (document as Document & { fonts?: FontFaceSet }).fonts?.ready;
  } catch {
    /* ignore */
  }
  await Promise.all(
    Array.from(el.querySelectorAll("img")).map((img) =>
      img.complete ? img.decode().catch(() => undefined) : new Promise<void>((res) => {
        img.addEventListener("load", () => res(), { once: true });
        img.addEventListener("error", () => res(), { once: true });
      }),
    ),
  );
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(null))));
}

export async function exportElementToPdf(el: HTMLElement, filename: string) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas-pro"),
    import("jspdf"),
  ]);

  const restore = await inlineImages(el);
  await waitForPaint(el);
  // Safe page-break points (CSS px from the sheet top): bottom of every item
  // row, and the start of the totals/terms/signature block.
  const top = el.getBoundingClientRect().top;
  const cssH = el.scrollHeight;
  const breaks: number[] = [];
  el.querySelectorAll("[data-pdf-rows] tr").forEach((tr) => {
    breaks.push(tr.getBoundingClientRect().bottom - top);
  });
  const keep = el.querySelector("[data-pdf-keepstart]");
  if (keep) breaks.push(keep.getBoundingClientRect().top - top);
  breaks.sort((a, b) => a - b);
  let canvas: HTMLCanvasElement;
  try {
    canvas = await html2canvas(el, {
      scale: Math.min(2, window.devicePixelRatio || 1) * 2,
      backgroundColor: "#ffffff",
      useCORS: true,
      allowTaint: false,
      logging: false,
      windowWidth: el.scrollWidth,
      onclone: (_doc, clone) => {
        // Re-apply each element's own inline colours as !important so a
        // missed style never leaves the letterhead / table header blank white.
        clone.querySelectorAll<HTMLElement>("*").forEach((n) => {
          const bg = n.style.backgroundColor;
          const fg = n.style.color;
          if (bg) n.style.setProperty("background-color", bg, "important");
          if (fg) n.style.setProperty("color", fg, "important");
          n.style.setProperty("-webkit-print-color-adjust", "exact");
        });


      },
    });
  } finally {
    restore();
  }

  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const pxPerMm = canvas.width / pageW;
  const cssToPx = canvas.height / cssH;
  const TOP = 10; // mm top margin on continuation pages
  const BOTTOM = 10; // mm reserved for the page counter

  if (canvas.height <= Math.floor(pageH * pxPerMm) * 1.04) {
    const h = Math.min(pageH, canvas.height / pxPerMm);
    const w = (canvas.width / pxPerMm) * (h / (canvas.height / pxPerMm));
    pdf.addImage(canvas.toDataURL("image/jpeg", 0.95), "JPEG", (pageW - w) / 2, 0, w, h);
  } else {
    const bp = breaks.map((b) => Math.round(b * cssToPx));
    let y = 0;
    let page = 0;
    while (y < canvas.height - 4) {
      const offset = page === 0 ? 0 : TOP;
      const room = Math.floor((pageH - offset - BOTTOM) * pxPerMm);
      let end = Math.min(y + room, canvas.height);
      if (end < canvas.height) {
        // Cut at the last row boundary that fits, never through a row/signature.
        const safe = bp.filter((b) => b > y + room * 0.3 && b <= y + room);
        if (safe.length) end = safe[safe.length - 1];
      }
      const sliceH = end - y;
      const slice = document.createElement("canvas");
      slice.width = canvas.width;
      slice.height = sliceH;
      const ctx = slice.getContext("2d");
      if (!ctx) break;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, slice.width, slice.height);
      ctx.drawImage(canvas, 0, y, canvas.width, sliceH, 0, 0, canvas.width, sliceH);
      if (page > 0) pdf.addPage();
      pdf.addImage(slice.toDataURL("image/jpeg", 0.95), "JPEG", 0, offset, pageW, sliceH / pxPerMm);
      page++;
      y = end;
    }
    const total = pdf.getNumberOfPages();
    for (let i = 1; i <= total; i++) {
      pdf.setPage(i);
      pdf.setFontSize(9);
      pdf.setTextColor(110, 120, 135);
      pdf.text(`Page ${i} of ${total}`, pageW / 2, pageH - 4, { align: "center" });
    }
  }

  const name = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
  saveBlob(pdf.output("blob"), name);
}

export function printDocument() {
  window.print();
}
