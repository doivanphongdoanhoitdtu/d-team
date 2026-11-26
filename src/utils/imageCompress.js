// Client-side image compression for Spark free-tier Firestore storage (~60-140KB per proof)

const MAX_DIMENSION = 1024;
const JPEG_QUALITY = 0.72;
const MAX_RAW_FILE_BYTES = 15 * 1024 * 1024; // 15MB upload ceiling

export function compressImageDataUrl(dataUrl, maxDim = MAX_DIMENSION, quality = JPEG_QUALITY) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width >= height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      let output = canvas.toDataURL('image/jpeg', quality);
      // If still larger than ~350KB base64, step down quality once
      if (output.length > 480000) {
        output = canvas.toDataURL('image/jpeg', 0.55);
      }
      resolve(output);
    };
    img.onerror = () => reject(new Error('Không thể đọc dữ liệu hình ảnh.'));
    img.src = dataUrl;
  });
}

export function compressImageFile(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type || !file.type.startsWith('image/')) {
      return reject(new Error('Vui lòng chọn tệp hình ảnh hợp lệ (JPG, PNG, WebP).'));
    }
    if (file.size > MAX_RAW_FILE_BYTES) {
      return reject(new Error('Ảnh quá lớn (tối đa 15MB). Vui lòng chọn ảnh khác.'));
    }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const compressed = await compressImageDataUrl(ev.target.result);
        resolve(compressed);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Lỗi đọc tệp hình ảnh.'));
    reader.readAsDataURL(file);
  });
}

export function captureVideoFrameCompressed(videoEl, maxDim = MAX_DIMENSION, quality = JPEG_QUALITY) {
  if (!videoEl) return '';
  let width = videoEl.videoWidth || 800;
  let height = videoEl.videoHeight || 600;
  if (width > maxDim || height > maxDim) {
    if (width >= height) {
      height = Math.round((height * maxDim) / width);
      width = maxDim;
    } else {
      width = Math.round((width * maxDim) / height);
      height = maxDim;
    }
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(videoEl, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', quality);
}
