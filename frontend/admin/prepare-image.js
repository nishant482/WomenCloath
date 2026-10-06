// Keep phone uploads within the API limit without asking the admin to resize them.
export async function prepareImage(file, banner = false, product = false) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw Error('Choose a JPG, PNG or WebP image. For iPhone HEIC photos, export as JPG first.');
  if (file.size > 20 * 1024 * 1024) throw Error('Choose a photo smaller than 20 MB.');
  const bitmap = await createImageBitmap(file).catch(() => { throw Error('This photo could not be opened. Please export it as JPG and try again.'); });
  try {
    const canvas = document.createElement('canvas');
    const scale = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height));
    canvas.width = banner ? 1920 : product ? 1200 : Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = banner ? 800 : product ? 1600 : Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    if (banner || product) {
      // Fit the complete photograph; never cut off an outfit, face or banner text.
      ctx.fillStyle = '#FFECD1';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    const fit = Math.min(canvas.width / bitmap.width, canvas.height / bitmap.height);
    const width = bitmap.width * fit, height = bitmap.height * fit;
    ctx.drawImage(bitmap, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
    const type = file.type === 'image/jpeg' ? 'image/jpeg' : 'image/webp';
    for (const quality of [.95, .90, .85, .75]) {
      const blob = await new Promise(resolve => canvas.toBlob(resolve, type, quality));
      if (blob && blob.size <= 3 * 1024 * 1024) return new File([blob], file.name.replace(/\.[^.]+$/, '') + (type === 'image/jpeg' ? '.jpg' : '.webp'), {type: blob.type});
    }
    throw Error('This image is still too large. Please choose a smaller photo.');
  } finally { bitmap.close(); }
}
