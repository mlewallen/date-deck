/*
 * Uploaded photos travel inside share links, so they're shrunk hard in the
 * browser: a ~520px long edge, re-encoded until they fit a small budget.
 * Nothing is uploaded to a server.
 */

const LONG_EDGE = 520;
const TARGET_BYTES = 20_000;
const DATA_URL = /^data:image\/(jpeg|webp|png);base64,[A-Za-z0-9+/=]+$/;

export function isPhotoData(value: string) {
  return DATA_URL.test(value);
}

/** Approximate decoded size of a data URL, in bytes. */
export function dataUrlBytes(value: string) {
  return Math.round(((value.length - value.indexOf(',') - 1) * 3) / 4);
}

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('unreadable'));
    };
    image.src = url;
  });
}

export async function compressPhoto(file: File): Promise<string> {
  if (!file.type.startsWith('image/') && !/\.(heic|heif)$/i.test(file.name)) throw new Error('not-image');
  const image = await loadImage(file);
  let scale = Math.min(1, LONG_EDGE / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) throw new Error('no-canvas');

  // Prefer WebP; Safari before 17 silently returns PNG for it, so fall back to JPEG.
  const supportsWebp = canvas.toDataURL('image/webp').startsWith('data:image/webp');
  const type = supportsWebp ? 'image/webp' : 'image/jpeg';

  let result = '';
  for (let attempt = 0; attempt < 6; attempt++) {
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    context.fillStyle = '#1c2a25';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.7, 0.58, 0.46]) {
      result = canvas.toDataURL(type, quality);
      if (dataUrlBytes(result) <= TARGET_BYTES) return result;
    }
    scale *= 0.8;
  }
  return result;
}
