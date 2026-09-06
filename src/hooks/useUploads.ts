import { useMutation } from '@tanstack/react-query';
import {
  uploadImage,
  uploadMultipleImages,
  deleteImage,
} from '../services/uploads.service';
import { toast } from 'sonner';

export function useUploadImage() {
  return useMutation({
    mutationFn: (file: File) => uploadImage(file),
    onError: (e: Error) => toast.error(e.message || 'Image upload failed'),
  });
}

export function useUploadMultipleImages() {
  return useMutation({
    mutationFn: (files: File[]) => uploadMultipleImages(files),
    onError: (e: Error) => toast.error(e.message || 'Image upload failed'),
  });
}

export function useDeleteImage() {
  return useMutation({
    mutationFn: (publicId: string) => deleteImage(publicId),
    onError: (e: Error) => toast.error(e.message || 'Delete failed'),
  });
}
