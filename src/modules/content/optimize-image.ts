export const IMAGE_UPLOAD_MAX_DIMENSION = 2400;
export const IMAGE_UPLOAD_MAX_SIZE_BYTES = 10 * 1024 * 1024;
export const IMAGE_UPLOAD_ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
/** Same browser conversion pipeline as Koru, with explicit MIME validation. */
export async function optimizeImageForUpload(file: File): Promise<File> {
  if (!IMAGE_UPLOAD_ACCEPTED_TYPES.includes(file.type)) throw new Error("Elegí una imagen JPEG, PNG, WebP o AVIF.");
  const source = await createImageBitmap(file);
  try {
    const scale = Math.min(1, IMAGE_UPLOAD_MAX_DIMENSION / Math.max(source.width, source.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(source.width * scale));
    canvas.height = Math.max(1, Math.round(source.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("No pudimos preparar la imagen.");
    context.drawImage(source, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.84, 0.72, 0.6, 0.5]) {
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/webp", quality));
      if (blob && blob.type !== "image/webp") throw new Error("Este navegador no permite convertir la imagen a WebP.");
      if (blob && blob.size <= IMAGE_UPLOAD_MAX_SIZE_BYTES) return new File([blob], `${file.name.replace(/\.[^.]+$/, "") || "imagen"}.webp`, { type: "image/webp" });
    }
    throw new Error("No pudimos optimizar la imagen por debajo de 10 MB.");
  } finally { source.close(); }
}
