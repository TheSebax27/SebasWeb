import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Redimensiona y comprime una imagen antes de subir.
 * maxDim: lado máximo en px. quality: 0–1 para JPEG.
 * Si falla, devuelve el archivo original sin error.
 */
export async function compressImage(
  file: File,
  maxDim = 1200,
  quality = 0.82,
): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;

      if (width > maxDim || height > maxDim) {
        if (width >= height) {
          height = Math.round(height * maxDim / width);
          width  = maxDim;
        } else {
          width  = Math.round(width * maxDim / height);
          height = maxDim;
        }
      } else if (width <= maxDim && height <= maxDim) {
        // Si ya es pequeña, solo recodifica para quitar metadatos EXIF pesados
      }

      const canvas = document.createElement('canvas');
      canvas.width  = width;
      canvas.height = height;
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return; }
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }));
        },
        'image/jpeg',
        quality,
      );
    };

    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}
