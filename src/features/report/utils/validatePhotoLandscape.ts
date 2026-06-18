const LANDSCAPE_REQUIRED_MESSAGE =
  'La photo doit être prise en mode paysage (téléphone horizontal).';

async function readImageDimensions(
  file: File,
): Promise<{ width: number; height: number } | null> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file);
      const dimensions = { width: bitmap.width, height: bitmap.height };
      bitmap.close();
      return dimensions;
    } catch {
      // Fallback ci-dessous
    }
  }

  return new Promise((resolve) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(null);
    };

    image.src = objectUrl;
  });
}

/** Largeur >= hauteur (createImageBitmap tient compte de l’orientation EXIF). */
export async function isLandscapePhoto(file: File): Promise<boolean> {
  const dimensions = await readImageDimensions(file);
  if (!dimensions) {
    return true;
  }

  return dimensions.width >= dimensions.height;
}

export async function validatePhotoLandscape(
  file: File,
): Promise<{ valid: true } | { valid: false; message: string }> {
  const isLandscape = await isLandscapePhoto(file);
  if (isLandscape) {
    return { valid: true };
  }

  return { valid: false, message: LANDSCAPE_REQUIRED_MESSAGE };
}

export { LANDSCAPE_REQUIRED_MESSAGE };
