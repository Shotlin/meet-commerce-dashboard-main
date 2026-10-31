import { useEffect, useState } from 'react';
import { Link2, UploadCloud } from 'lucide-react';

import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { useAttachInHouseEvidence } from '../../hooks/useProcurement';
import { uploadVideo } from '../../services/uploads.service';
import type { SupplyOrderDetail } from '../../types/procurement.types';

const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];

type Mode = 'UPLOAD' | 'LINK';

interface InHouseEvidencePanelProps {
  supply: SupplyOrderDetail;
  disabled?: boolean;
  hasVideo?: boolean;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Could not attach the video';
}

/**
 * Admin-side evidence for an in-house purchase. Vendor evidence still arrives
 * from the vendor app automatically; this panel exists because there is no
 * vendor to upload it for an in-house purchase.
 */
export function InHouseEvidencePanel({ supply, disabled = false, hasVideo = false }: InHouseEvidencePanelProps) {
  const attachMutation = useAttachInHouseEvidence();

  const [mode, setMode] = useState<Mode>('UPLOAD');
  const [file, setFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  const [link, setLink] = useState('');
  const [linkError, setLinkError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    };
  }, [filePreviewUrl]);

  function clearFile() {
    if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    setFile(null);
    setFilePreviewUrl(null);
    setFileError(null);
    setFileInputKey((key) => key + 1);
    setProgress(0);
  }

  function handleFile(selected: File | null) {
    setFileError(null);
    clearFile();
    if (!selected) return;
    if (!ALLOWED_VIDEO_TYPES.includes(selected.type)) {
      setFileError('Use an MP4, MOV or WebM video.');
      return;
    }
    if (selected.size > MAX_VIDEO_BYTES) {
      setFileError('Video is larger than 100 MB.');
      return;
    }
    setFile(selected);
    setFilePreviewUrl(URL.createObjectURL(selected));
  }

  async function handleUpload() {
    if (!file) {
      setFileError('Choose a video first.');
      return;
    }
    setFileError(null);
    setUploading(true);
    setProgress(0);
    try {
      const uploaded = await uploadVideo(file, setProgress);
      await attachMutation.mutateAsync({
        supplyId: supply.id,
        payload: {
          media_public_id: uploaded.publicId,
          media_url: uploaded.url,
          mime_type: file.type,
          duration_seconds:
            uploaded.duration && uploaded.duration > 0 ? Math.round(uploaded.duration) : undefined,
          size_bytes: uploaded.bytes ?? undefined,
          attachment_source: 'UPLOAD',
        },
      });
      clearFile();
    } catch (error) {
      setFileError(errorMessage(error));
    } finally {
      setUploading(false);
    }
  }

  async function handleLink() {
    const value = link.trim();
    if (!/^https?:\/\//i.test(value)) {
      setLinkError('Enter a valid http(s) video link.');
      return;
    }
    setLinkError(null);
    try {
      await attachMutation.mutateAsync({
        supplyId: supply.id,
        payload: {
          media_url: value,
          attachment_source: 'EXTERNAL_LINK',
        },
      });
      setLink('');
    } catch (error) {
      setLinkError(errorMessage(error));
    }
  }

  if (disabled) {
    return (
      <div className="rounded-[12px] border border-border bg-muted/30 px-3 py-2 text-[11px] text-status-neutral">
        Video evidence is locked after receipt is confirmed.
      </div>
    );
  }

  const busy = uploading || attachMutation.isPending;

  return (
    <div className="rounded-[12px] border border-dashed border-rose-300 bg-rose-50/50 p-3 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-ink">
            {hasVideo ? 'Add another quality video' : 'Attach quality video'}
          </p>
          <p className="text-[11px] text-status-neutral">
            {hasVideo
              ? 'A video is attached. Add another if this purchase needs more evidence.'
              : 'Required before receipt. The customer app shows this video through the existing order QR.'}
          </p>
        </div>
        <Badge variant={hasVideo ? 'success' : 'warning'} size="sm">
          {hasVideo ? 'Attached' : 'Required'}
        </Badge>
      </div>

      <div className="flex items-center gap-1 p-1 bg-white border border-border rounded-[10px] w-fit">
        <button
          type="button"
          onClick={() => setMode('UPLOAD')}
          className={`px-3 py-1 rounded-[8px] text-[11px] font-bold ${
            mode === 'UPLOAD' ? 'bg-rose-100 text-ink' : 'text-status-neutral hover:text-ink'
          }`}
        >
          Upload video
        </button>
        <button
          type="button"
          onClick={() => setMode('LINK')}
          className={`px-3 py-1 rounded-[8px] text-[11px] font-bold ${
            mode === 'LINK' ? 'bg-rose-100 text-ink' : 'text-status-neutral hover:text-ink'
          }`}
        >
          Paste link
        </button>
      </div>

      {mode === 'UPLOAD' ? (
        <div className="space-y-2">
          <label className="flex flex-col items-center justify-center gap-1 rounded-[10px] border border-dashed border-border bg-white px-3 py-4 text-center cursor-pointer hover:border-rose-400">
            <UploadCloud className="w-5 h-5 text-ink-2" />
            <span className="text-[11px] font-bold text-ink">
              {file ? file.name : 'Choose MP4, MOV or WebM (max 100 MB)'}
            </span>
            <input
              key={fileInputKey}
              type="file"
              accept="video/mp4,video/quicktime,video/webm"
              className="sr-only"
              onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
              disabled={busy}
            />
          </label>
          {uploading && (
            <div className="h-1.5 w-full rounded-full bg-rose-100 overflow-hidden">
              <div
                className="h-full bg-brand-raspberry transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
          {fileError && <p className="text-[11px] font-semibold text-status-danger">{fileError}</p>}
          <Button
            size="sm"
            onClick={handleUpload}
            isLoading={uploading || attachMutation.isPending}
            disabled={!file || busy}
          >
            Upload &amp; attach
          </Button>
          {filePreviewUrl && (
            <video
              src={filePreviewUrl}
              controls
              className="w-full max-h-48 rounded-[10px] bg-black"
            />
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2 rounded-[10px] border border-border bg-white px-3 py-2">
            <Link2 className="w-3.5 h-3.5 shrink-0 text-status-neutral" />
            <input
              className="w-full border-0 p-0 text-xs focus:outline-none focus:ring-0"
              placeholder="https://…/quality-video.mp4"
              value={link}
              onChange={(event) => {
                setLink(event.target.value);
                setLinkError(null);
              }}
              disabled={busy}
            />
          </div>
          {linkError && <p className="text-[11px] font-semibold text-status-danger">{linkError}</p>}
          <Button
            size="sm"
            onClick={handleLink}
            isLoading={attachMutation.isPending}
            disabled={!link.trim() || busy}
          >
            Attach link
          </Button>
          {/^https?:\/\//i.test(link.trim()) && (
            <video
              key={link}
              src={link.trim()}
              controls
              className="w-full max-h-48 rounded-[10px] bg-black"
              onError={() => setLinkError('This link does not play as a direct video. Use an MP4/WebM/MOV file URL.')}
            />
          )}
        </div>
      )}

      <p className="text-[10px] leading-4 text-status-neutral">
        Upload is recommended. YouTube, Vimeo and Google Drive page links do not play in the customer app;
        use a direct video file URL or upload the file.
      </p>
    </div>
  );
}
