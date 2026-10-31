/* ── Upload Types ─────────────────────────── */

export interface UploadedImage {
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

export interface UploadedFile {
  url: string;
  publicId: string;
}

export interface UploadedVideo {
  url: string;
  publicId: string;
  duration: number | null;
  format: string | null;
  bytes: number | null;
}
