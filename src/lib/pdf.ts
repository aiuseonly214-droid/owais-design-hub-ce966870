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
        // Force the brand colours onto the clone so a missed style never
        // leaves the letterhead / table header blank white in the export.
        clone.querySelectorAll<HTMLElement>("[style*='123A70']").forEach((n) => {
          n.style.setProperty("background-color", "#123A70", "important");
          n.style.setProperty("color", "#FFFFFF", "important");
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
  const pageHpx = Math.floor(pageH * pxPerMm);

  // A sheet that is only slightly taller than A4 is scaled down to fit one page
  // instead of spilling a near-empty second page.
  if (canvas.height <= pageHpx * 1.3) {
    const h = Math.min(pageH, canvas.height / pxPerMm);
    const w = (canvas.width / pxPerMm) * (h / (canvas.height / pxPerMm));
    pdf.addImage(canvas.toDataURL("image/jpeg", 0.95), "JPEG", (pageW - w) / 2, 0, w, h);

  } else {
    // Slice the tall canvas into real A4 pages so nothing overlaps.
    let y = 0;
    let first = true;
    while (y < canvas.height) {
      const sliceH = Math.min(pageHpx, canvas.height - y);
      // Skip a trailing sliver of empty whitespace.
      if (!first && sliceH < pageHpx * 0.12) break;
      const slice = document.createElement("canvas");
      slice.width = canvas.width;
      slice.height = sliceH;
      const ctx = slice.getContext("2d");
      if (!ctx) break;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, slice.width, slice.height);
      ctx.drawImage(canvas, 0, y, canvas.width, sliceH, 0, 0, canvas.width, sliceH);
      if (!first) pdf.addPage();
      pdf.addImage(slice.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, pageW, sliceH / pxPerMm);
      first = false;
      y += sliceH;
    }

  }

  const name = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
  saveBlob(pdf.output("blob"), name);
}

export function printDocument() {
  window.print();
}
