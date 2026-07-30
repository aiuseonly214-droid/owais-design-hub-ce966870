/** Render a DOM node to a downloadable A4 PDF. */
export async function exportElementToPdf(el: HTMLElement, filename: string) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas-pro"),
    import("jspdf"),
  ]);

  const canvas = await html2canvas(el, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true,
    logging: false,
  });

  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const imgH = (canvas.height * pageW) / canvas.width;
  const img = canvas.toDataURL("image/jpeg", 0.95);

  if (imgH <= pageH) {
    pdf.addImage(img, "JPEG", 0, 0, pageW, imgH);
  } else {
    let remaining = imgH;
    let offset = 0;
    while (remaining > 0) {
      pdf.addImage(img, "JPEG", 0, -offset, pageW, imgH);
      remaining -= pageH;
      offset += pageH;
      if (remaining > 0) pdf.addPage();
    }
  }

  pdf.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
}

export function printDocument() {
  window.print();
}
