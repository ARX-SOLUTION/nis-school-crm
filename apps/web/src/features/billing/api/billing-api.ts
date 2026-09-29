import { api } from '@/lib/api';
import type {
  BillingStatsDto,
  CreatePaymentRequestDto,
  DebtorStudentDto,
  PaginatedResponse,
  PaymentMethod,
  PaymentRecordDto,
  PaymentStatus,
} from '@nis/shared';

export interface PaymentsFilterParams {
  studentId?: string;
  month?: string;
  method?: PaymentMethod;
  status?: PaymentStatus;
  page?: number;
  limit?: number;
}

export const billingApi = {
  getStats: async (month?: string): Promise<BillingStatsDto> => {
    const res = await api.get<BillingStatsDto>('/billing/stats', {
      params: month ? { month } : undefined,
    });
    return res.data;
  },

  getDebtors: async (month?: string): Promise<DebtorStudentDto[]> => {
    const res = await api.get<DebtorStudentDto[]>('/billing/debtors', {
      params: month ? { month } : undefined,
    });
    return res.data;
  },

  listPayments: async (
    params?: PaymentsFilterParams,
  ): Promise<PaginatedResponse<PaymentRecordDto>> => {
    const res = await api.get<PaginatedResponse<PaymentRecordDto>>('/billing/payments', {
      params,
    });
    return res.data;
  },

  recordPayment: async (dto: CreatePaymentRequestDto): Promise<PaymentRecordDto> => {
    const res = await api.post<PaymentRecordDto>('/billing/payments', dto);
    return res.data;
  },

  getPaymentLink: async (
    studentCode: string,
    amount: number,
  ): Promise<{
    studentId: string;
    studentCode: string;
    studentName: string;
    amount: number;
    paymeUrl: string;
    clickUrl: string;
  }> => {
    const res = await api.get('/billing/payment-link', {
      params: { studentCode, amount },
    });
    return res.data;
  },

  simulatePaymePayment: async (studentCode: string, amountUzs: number) => {
    const paymeTransId = `sim-${Date.now()}`;
    const amountTiyin = Math.round(amountUzs * 100);
    await api.post('/billing/payme', {
      method: 'CreateTransaction',
      params: {
        id: paymeTransId,
        time: Date.now(),
        amount: amountTiyin,
        account: { student_code: studentCode },
      },
      id: 1,
    });
    const res = await api.post('/billing/payme', {
      method: 'PerformTransaction',
      params: { id: paymeTransId },
      id: 2,
    });
    return res.data;
  },

  simulateClickPayment: async (studentCode: string, amountUzs: number) => {
    const clickTransId = Date.now();
    const prep = await api.post<{ merchant_prepare_id?: string }>('/billing/click', {
      click_trans_id: clickTransId,
      service_id: 12345,
      click_paydoc_id: 9999,
      merchant_trans_id: studentCode,
      amount: amountUzs,
      action: 0,
      error: 0,
      sign_time: new Date().toISOString(),
      sign_string: 'dummy',
    });
    const prepareId = prep.data?.merchant_prepare_id;
    const res = await api.post('/billing/click', {
      click_trans_id: clickTransId,
      service_id: 12345,
      click_paydoc_id: 9999,
      merchant_trans_id: studentCode,
      merchant_prepare_id: prepareId,
      amount: amountUzs,
      action: 1,
      error: 0,
      sign_time: new Date().toISOString(),
      sign_string: 'dummy',
    });
    return res.data;
  },
};
