import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreatePaymentRequestDto } from '@nis/shared';
import { billingApi, type PaymentsFilterParams } from './billing-api';

export const billingKeys = {
  all: ['billing'] as const,
  stats: (month?: string) => [...billingKeys.all, 'stats', month] as const,
  debtors: (month?: string) => [...billingKeys.all, 'debtors', month] as const,
  payments: (params?: PaymentsFilterParams) => [...billingKeys.all, 'payments', params] as const,
};

export function useBillingStatsQuery(month?: string) {
  return useQuery({
    queryKey: billingKeys.stats(month),
    queryFn: () => billingApi.getStats(month),
    staleTime: 30_000,
  });
}

export function useDebtorsQuery(month?: string) {
  return useQuery({
    queryKey: billingKeys.debtors(month),
    queryFn: () => billingApi.getDebtors(month),
    staleTime: 30_000,
  });
}

export function usePaymentsQuery(params?: PaymentsFilterParams) {
  return useQuery({
    queryKey: billingKeys.payments(params),
    queryFn: () => billingApi.listPayments(params),
    staleTime: 15_000,
  });
}

export function useRecordPaymentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreatePaymentRequestDto) => billingApi.recordPayment(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: billingKeys.all });
    },
  });
}
