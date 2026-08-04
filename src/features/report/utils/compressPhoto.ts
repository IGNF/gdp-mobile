const MAX_DIMENSION = 1920;
const JPEG_QUALITY = 0.8;

/** Redimensionne et ré-encode en JPEG pour réduire le poids avant envoi. */
export async function compressPhotoFile(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) {
    return file;
  }

  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const targetWidth = Math.round(bitmap.width * scale);
  const targetHeight = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const context = canvas.getContext('2d');
  if (!context) {
    bitmap.close();
    return file;
  }

  context.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY);
  });
  if (!blob) {
    return file;
  }

  const fileName = `${file.name.replace(/\.\w+$/, '')}.jpg`;
  return new File([blob], fileName, { type: 'image/jpeg', lastModified: file.lastModified });
}
