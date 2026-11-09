/**
 * HTML5 Canvas Square Image Transformer
 * 
 * Rules:
 * - Uses the longest dimension as basis for a 1:1 square canvas (max 1600x1600px).
 * - Fills background with clean white (#FFFFFF).
 * - Centers the original image without any cropping or distortion.
 * - Exports as high quality JPEG Blob.
 */

export async function convertToSquareJpegBlob(
  fileOrUrl: File | string,
  maxDimension: number = 1600
): Promise<{ blob: Blob; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    let objectUrlToRevoke: string | null = null;

    if (typeof fileOrUrl === 'string') {
      img.src = fileOrUrl;
    } else {
      objectUrlToRevoke = URL.createObjectURL(fileOrUrl);
      img.src = objectUrlToRevoke;
    }

    img.onload = () => {
      try {
        const naturalWidth = img.naturalWidth || img.width;
        const naturalHeight = img.naturalHeight || img.height;

        if (!naturalWidth || !naturalHeight) {
          throw new Error('이미지 크기를 계산할 수 없습니다.');
        }

        const longestSide = Math.max(naturalWidth, naturalHeight);
        const squareSize = Math.min(maxDimension, Math.max(longestSide, 400));

        const canvas = document.createElement('canvas');
        canvas.width = squareSize;
        canvas.height = squareSize;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('2D 캔버스 컨텍스트를 생성할 수 없습니다.');
        }

        // Fill background with clean Bauhaus white
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, squareSize, squareSize);

        // Calculate scaling to preserve aspect ratio without cropping
        const scale = squareSize / longestSide;
        const drawWidth = naturalWidth * scale;
        const drawHeight = naturalHeight * scale;
        const offsetX = (squareSize - drawWidth) / 2;
        const offsetY = (squareSize - drawHeight) / 2;

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

        canvas.toBlob(
          (blob) => {
            if (objectUrlToRevoke) {
              URL.revokeObjectURL(objectUrlToRevoke);
            }
            if (!blob) {
              reject(new Error('JPEG Blob 변환에 실패했습니다.'));
              return;
            }
            resolve({ blob, dataUrl });
          },
          'image/jpeg',
          0.92
        );
      } catch (err) {
        if (objectUrlToRevoke) {
          URL.revokeObjectURL(objectUrlToRevoke);
        }
        reject(err);
      }
    };

    img.onerror = (e) => {
      if (objectUrlToRevoke) {
        URL.revokeObjectURL(objectUrlToRevoke);
      }
      reject(new Error('이미지를 로드하지 못했습니다. 유효한 이미지 파일인지 확인해주세요.'));
    };
  });
}
