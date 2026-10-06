// Keep phone uploads within the API limit without asking the admin to resize them.
export async function prepareImage(file, banner = false) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw Error('Choose a JPG, PNG or WebP image. For iPhone HEIC photos, export as JPG first.');
  if (file.size > 20 * 1024 * 1024) throw Error('Choose a photo smaller than 20 MB.');
  if (file.size <= 3 * 1024 * 1024) return file;
  const bitmap = await createImageBitmap(file).catch(() => { throw Error('This photo could not be opened. Please export it as JPG and try again.'); });
  try {
    const scale = Math.min(1, (banner ? 2400 : 2000) / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const type = file.type === 'image/jpeg' ? 'image/jpeg' : 'image/webp';
    for (const quality of [.88, .75, .6]) {
      const blob = await new Promise(resolve => canvas.toBlob(resolve, type, quality));
      if (blob && blob.size <= 3 * 1024 * 1024) return new File([blob], file.name.replace(/\.[^.]+$/, '') + (type === 'image/jpeg' ? '.jpg' : '.webp'), {type: blob.type});
    }
    throw Error('This image is still too large. Please choose a smaller photo.');
  } finally { bitmap.close(); }
}
