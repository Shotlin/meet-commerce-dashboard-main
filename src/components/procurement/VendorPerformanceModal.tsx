import { useQuery } from '@tanstack/react-query';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { getVendorPerformance, getVendorReviews } from '../../services/procurementService';
import { formatDateTime, formatMoney } from '../../utils/procurementStatus';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  vendorId: string | null;
  vendorName?: string;
}

export default function VendorPerformanceModal({ isOpen, onClose, vendorId, vendorName }: Props) {
  const performanceQuery = useQuery({
    queryKey: ['procurement', 'vendor-performance', vendorId],
    queryFn: () => getVendorPerformance(vendorId as string),
    enabled: isOpen && Boolean(vendorId),
  });
  const reviewsQuery = useQuery({
    queryKey: ['procurement', 'vendor-reviews', vendorId],
    queryFn: () => getVendorReviews(vendorId as string),
    enabled: isOpen && Boolean(vendorId),
  });

  const performance = performanceQuery.data?.performance;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Vendor performance" subtitle={vendorName} maxWidth="xl">
      {performance ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Metric label="Avg rating" value={`${performance.avg_rating} ★`} />
            <Metric label="On-time rate" value={performance.on_time_rate != null ? `${performance.on_time_rate}%` : '—'} />
            <Metric label="Completed" value={String(performance.completed_supplies)} />
            <Metric label="Active" value={String(performance.active_supplies)} />
            <Metric label="Month value" value={formatMoney(performance.month_value)} />
            <Metric label="Month qty" value={`${Number(performance.month_quantity).toFixed(1)}`} />
            <Metric label="Reviews" value={String(performance.review_count)} />
            <Metric label="Issues" value={String(performance.issue_count)} />
          </div>
          <div>
            <div className="text-[11px] font-bold text-muted uppercase mb-2">Recent feedback</div>
            {(reviewsQuery.data ?? []).length === 0 ? (
              <p className="text-xs text-muted">No reviews yet.</p>
            ) : (
              <div className="space-y-2">
                {(reviewsQuery.data ?? []).slice(0, 5).map((review) => (
                  <div key={review.id} className="rounded-[10px] border border-border px-3 py-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-ink">
                        {review.rating_overall} ★ · {review.shop_name}
                      </span>
                      {review.issue_category && <Badge variant="danger">{review.issue_category.replace(/_/g, ' ').toLowerCase()}</Badge>}
                    </div>
                    {review.comment && <p className="text-[11px] text-muted mt-1">{review.comment}</p>}
                    <p className="text-[10px] text-subtle mt-1">{review.supply_number} · {formatDateTime(review.created_at)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted">Loading performance…</p>
      )}
    </Modal>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[10px] border border-border p-2.5">
      <div className="text-[10px] font-bold text-muted uppercase">{label}</div>
      <div className="text-sm font-bold text-ink mt-1">{value}</div>
    </div>
  );
}
