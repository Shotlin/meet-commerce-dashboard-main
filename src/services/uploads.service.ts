// Ported from bakaloo-dashboard's src/services/uploads.service.ts (image
// upload subset only — bulkImportProducts/createManualOrder are unrelated
// product/order features, out of scope for the theme builder port).
import type { UploadedFile, UploadedImage } from '../types/upload.types';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4500').replace(/\/$/, '');

type UploadProgressHandler = (progress: number) => void;

// XMLHttpRequest, not fetch, is used specifically here (and only here) —
// it's the only way to get real upload-progress events for onProgress,
// which fetch has no API for. Every other call in this app goes through
// apiClient's fetch-based methods; this mirrors apiClient's own auth-header
// logic rather than depending on it, since apiClient has no XHR path.
export function uploadViaXhr<T>(
  path: string,
  formData: FormData,
  onProgress?: UploadProgressHandler
): Promise<T> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE_URL}${path}`);

    const token = localStorage.getItem('mc_access_token');
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    if (onProgress) {
      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable) return;
        onProgress(Math.round((event.loaded / event.total) * 100));
      };
    }

    xhr.onload = () => {
      let body: any;
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        reject(new Error(`Upload failed: HTTP ${xhr.status}`));
        return;
      }
      if (xhr.status >= 200 && xhr.status < 300 && body?.success) {
        resolve(body.data as T);
      } else {
        reject(new Error(body?.message || `Upload failed: HTTP ${xhr.status}`));
      }
    };
    xhr.onerror = () => reject(new Error('Upload failed: network error'));
    xhr.send(formData);
  });
}

/** Upload a single image to Cloudinary via backend */
export async function uploadImage(file: File, onProgress?: UploadProgressHandler): Promise<UploadedImage> {
  const formData = new FormData();
  formData.append('image', file);
  return uploadViaXhr<UploadedImage>('/api/v1/uploads/image', formData, onProgress);
}

export async function uploadFile(file: File, onProgress?: UploadProgressHandler): Promise<UploadedFile> {
  const formData = new FormData();
  formData.append('file', file);
  return uploadViaXhr<UploadedFile>('/api/v1/uploads/file', formData, onProgress);
}

/** Upload multiple images in one request (backend defaults them into the shared `products/` Cloudinary folder). */
export async function uploadMultipleImages(files: File[], onProgress?: UploadProgressHandler): Promise<UploadedImage[]> {
  const formData = new FormData();
  files.forEach((f) => formData.append('images', f));
  return uploadViaXhr<UploadedImage[]>('/api/v1/uploads/images', formData, onProgress);
}

/** Delete an uploaded image by publicId */
export async function deleteImage(publicId: string): Promise<null> {
  const { apiClient } = await import('./apiClient');
  const res = await apiClient.deleteWithBody<null>('/api/v1/uploads/image', { publicId });
  if (res.success) return res.data;
  throw new Error(res.message || 'Failed to delete image');
}
