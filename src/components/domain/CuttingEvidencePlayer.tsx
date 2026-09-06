import React, { useState } from 'react';
import { Play, Pause, Video, CheckCircle, XCircle, Clock, ShieldCheck } from 'lucide-react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { VideoModerationStatus } from '../../types';

interface CuttingEvidencePlayerProps {
  orderNumber: string;
  videoUrl?: string;
  moderationStatus?: VideoModerationStatus;
  weightVarianceKg?: number;
  onModerated?: (status: VideoModerationStatus) => void;
}

export const CuttingEvidencePlayer: React.FC<CuttingEvidencePlayerProps> = ({
  orderNumber,
  videoUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  moderationStatus = 'Pending Review',
  weightVarianceKg = 0.045,
  onModerated,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<VideoModerationStatus>(moderationStatus);

  const timestamps = [
    { time: '00:04', label: 'Carcass Tag Scan & Inspection' },
    { time: '00:12', label: 'Primary Cut & Trim Started' },
    { time: '00:28', label: 'Digital Scale Weight Verification' },
    { time: '00:40', label: 'Vacuum Pack & Seal Stamp' },
  ];

  const handleApprove = () => {
    setCurrentStatus('Approved');
    if (onModerated) onModerated('Approved');
  };

  const handleReject = () => {
    setCurrentStatus('Rejected');
    if (onModerated) onModerated('Rejected');
  };

  const getStatusBadge = (status: VideoModerationStatus) => {
    switch (status) {
      case 'Approved':
        return <Badge variant="success" icon={<CheckCircle className="w-3.5 h-3.5" />}>Approved Evidence</Badge>;
      case 'Rejected':
        return <Badge variant="danger" icon={<XCircle className="w-3.5 h-3.5" />}>Rejected (Resubmit)</Badge>;
      default:
        return <Badge variant="warning" icon={<Clock className="w-3.5 h-3.5" />}>Pending Review</Badge>;
    }
  };

  return (
    <div className="bg-surface border border-border rounded-[12px] p-5 shadow-card">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Video className="w-5 h-5 text-brand-berry" />
          <h3 className="text-sm font-bold text-ink">Vendor Cutting Evidence Audit</h3>
          <span className="font-mono-num text-xs text-brand-berry bg-rose-100 px-2 py-0.5 rounded-full font-semibold">
            {orderNumber}
          </span>
        </div>
        {getStatusBadge(currentStatus)}
      </div>

      {/* Video Canvas Container */}
      <div className="relative aspect-video bg-ink rounded-[12px] overflow-hidden group shadow-inner mb-4">
        <video
          src={videoUrl}
          controls
          className="w-full h-full object-cover"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
      </div>

      {/* Timestamp Markers */}
      <div className="mb-4">
        <p className="text-xs font-bold text-ink mb-2">Audit Timestamp Bookmarks:</p>
        <div className="grid grid-cols-2 gap-2">
          {timestamps.map((ts, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 border border-border/80 rounded-[12px] hover:border-brand-raspberry cursor-pointer transition-colors"
            >
              <span className="font-mono-num text-xs font-bold text-brand-raspberry bg-white px-1.5 py-0.5 rounded border border-border">
                {ts.time}
              </span>
              <span className="text-xs text-ink/90 font-medium truncate">{ts.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Weight Variance Metadata */}
      <div className="p-3 bg-rose-50 border border-border rounded-[12px] flex items-center justify-between mb-4">
        <div>
          <span className="text-xs text-status-neutral">Weight Variance (Declared vs Actual):</span>
          <p className="font-mono-num text-sm font-bold text-brand-berry mt-0.5">
            {weightVarianceKg >= 0 ? `+${weightVarianceKg.toFixed(3)} kg` : `${weightVarianceKg.toFixed(3)} kg`}
          </p>
        </div>
        <Badge variant={Math.abs(weightVarianceKg) <= 0.05 ? 'success' : 'warning'}>
          {Math.abs(weightVarianceKg) <= 0.05 ? 'Within SLA Tolerance' : 'Manual Review Required'}
        </Badge>
      </div>

      {/* Moderation Controls */}
      <div className="flex items-center justify-between pt-3 border-t border-border">
        <span className="text-xs text-status-neutral flex items-center gap-1">
          <ShieldCheck className="w-4 h-4 text-status-success" /> Tamper-Evident Video Ledger Verified
        </span>
        <div className="flex items-center gap-2">
          <Button variant="danger" size="sm" onClick={handleReject} disabled={currentStatus === 'Rejected'}>
            Reject Proof
          </Button>
          <Button variant="primary" size="sm" onClick={handleApprove} disabled={currentStatus === 'Approved'}>
            Approve & Release Order
          </Button>
        </div>
      </div>
    </div>
  );
};
