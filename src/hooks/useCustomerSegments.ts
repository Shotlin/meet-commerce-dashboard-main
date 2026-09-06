import { useQuery } from '@tanstack/react-query';
import { customerSegmentService } from '../services/customerSegmentService';

export function useCustomerSegments() {
  return useQuery({
    queryKey: ['customer-segments'],
    queryFn: customerSegmentService.getSegments,
    staleTime: 30_000,
  });
}
