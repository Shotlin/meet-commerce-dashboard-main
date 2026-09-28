import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  getOrderNotificationSettings,
  updateOrderNotificationSetting,
  sendOrderNotificationTest,
} from '../services/orderNotificationSettings.service';
import type { UpdateOrderNotificationSettingPayload } from '../types/orderNotificationSettings.types';

const QUERY_KEY = ['order-notification-settings'];

export function useOrderNotificationSettings() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: getOrderNotificationSettings,
    staleTime: 30_000,
  });
}

export function useUpdateOrderNotificationSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventKey, payload }: { eventKey: string; payload: UpdateOrderNotificationSettingPayload }) =>
      updateOrderNotificationSetting(eventKey, payload),
    onSuccess: () => {
      toast.success('Saved');
      qc.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to save'),
  });
}

export function useSendOrderNotificationTest() {
  return useMutation({
    mutationFn: ({ eventKey, draft }: { eventKey: string; draft?: { title?: string; message?: string } }) =>
      sendOrderNotificationTest(eventKey, draft),
    onSuccess: () => toast.success('Test notification sent — check your own account'),
    onError: (err: Error) => toast.error(err.message || 'Failed to send test'),
  });
}
