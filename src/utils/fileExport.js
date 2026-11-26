// File download & Excel export helpers (lazy-loads SheetJS on demand)

export function isMobileDevice() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const isTouch = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 1);
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) || (isTouch && window.innerWidth <= 1024);
}

export async function downloadBlobOrFile(blob, fileName, mimeType = 'application/octet-stream', notify = null) {
  try {
    if (isMobileDevice() && typeof navigator !== 'undefined' && typeof navigator.share === 'function' && typeof File !== 'undefined') {
      try {
        const file = new File([blob], fileName, { type: mimeType || blob.type || 'application/octet-stream' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: fileName });
          notify?.(`Đã xuất tệp "${fileName}".`, 'success');
          return true;
        }
      } catch (shareErr) {
        if (shareErr?.name === 'AbortError') return true;
      }
    }

    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;
    if (/iPhone|iPad|iPod/i.test(navigator.userAgent || '')) {
      link.target = '_blank';
      link.rel = 'noopener';
    }
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      if (document.body.contains(link)) document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    }, 60000);

    notify?.(`Đã xuất tệp "${fileName}".`, 'success');
    return true;
  } catch (err) {
    console.error('Lỗi tải tệp:', err);
    notify?.(`Không thể xuất tệp: ${err?.message || err}`, 'error');
    return false;
  }
}

export async function exportExcelWorkbook(XLSX, workbook, fileName, notify = null) {
  try {
    const safeFileName = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;
    const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array', compression: true });
    const mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
    const blob = new Blob([wbout], { type: mimeType });
    return await downloadBlobOrFile(blob, safeFileName, mimeType, notify);
  } catch (err) {
    console.error('Lỗi xuất Excel:', err);
    notify?.(`Không thể tạo tệp Excel: ${err?.message || err}`, 'error');
    return false;
  }
}

export async function downloadBase64File(base64Data, fileName, notify = null) {
  try {
    if (!base64Data) {
      notify?.('Không có dữ liệu ảnh để tải về.', 'error');
      return false;
    }

    if (base64Data.startsWith('data:')) {
      const parts = base64Data.split(',');
      const mimeMatch = parts[0].match(/:(.*?);/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      const byteChars = atob(parts[1] || '');
      const byteArr = new Uint8Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) {
        byteArr[i] = byteChars.charCodeAt(i);
      }
      const blob = new Blob([byteArr], { type: mimeType });
      return await downloadBlobOrFile(blob, fileName, mimeType, notify);
    }

    const link = document.createElement('a');
    link.href = base64Data;
    link.download = fileName;
    link.target = '_blank';
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      if (document.body.contains(link)) document.body.removeChild(link);
    }, 5000);
    notify?.(`Đã tải ảnh "${fileName}".`, 'success');
    return true;
  } catch (err) {
    console.error('Lỗi tải ảnh:', err);
    notify?.(`Lỗi tải ảnh: ${err?.message || err}`, 'error');
    return false;
  }
}
