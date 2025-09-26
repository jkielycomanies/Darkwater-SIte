// Image compression utilities for client-side use

export interface CompressedImage {
  data: string;
  contentType: string;
  filename: string;
  size: number;
  uploadedAt: string;
}

export function compressImage(file: File, maxWidth: number = 800, maxHeight: number = 600, quality: number = 0.8): Promise<CompressedImage> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);
      
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      const base64Data = compressedDataUrl.split(',')[1];

      resolve({
        data: base64Data,
        contentType: 'image/jpeg',
        filename: file.name,
        size: base64Data.length,
        uploadedAt: new Date().toISOString()
      });
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

export function compressImages(files: FileList, maxWidth: number = 800, maxHeight: number = 600, quality: number = 0.8): Promise<CompressedImage[]> {
  const promises = Array.from(files).map(file => compressImage(file, maxWidth, maxHeight, quality));
  return Promise.all(promises);
}

export function validateImageSize(image: CompressedImage, maxSizeBytes: number = 1024 * 1024): boolean {
  return image.size <= maxSizeBytes;
}

export function getImageSizeInMB(image: CompressedImage): number {
  return image.size / (1024 * 1024);
}




