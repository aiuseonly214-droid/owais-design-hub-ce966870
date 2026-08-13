/** Convert an image File to a size-capped base64 data URL (stored inline in the DB). */
export async function fileToDataUrl(file: File, maxSize = 700): Promise<string> {
  const raw = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the file"));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("Could not load the image"));
    el.src = raw;
  });

  const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
  if (scale >= 1 && raw.length < 400_000) return raw;

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return raw;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/png");
}

/**
 * Knock the white/near-white paper out of a scanned stamp or signature so it
 * sits transparently on the letterhead, and optionally soften the ink a bit.
 */
export async function removeWhiteBackground(
  file: File,
  maxSize = 600,
  threshold = 225,
): Promise<string> {
  const dataUrl = await fileToDataUrl(file, maxSize);
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("Could not load the image"));
    el.src = dataUrl;
  });

  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0);

  const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const px = frame.data;
  for (let i = 0; i < px.length; i += 4) {
    const r = px[i]!;
    const g = px[i + 1]!;
    const b = px[i + 2]!;
    const light = (r + g + b) / 3;
    if (light >= threshold) {
      px[i + 3] = 0; // paper -> fully transparent
    } else if (light > threshold - 45) {
      // feather the edge so the cut-out does not look jagged
      px[i + 3] = Math.round(px[i + 3]! * ((threshold - light) / 45));
    }
  }
  ctx.putImageData(frame, 0, 0);
  return canvas.toDataURL("image/png");
}
