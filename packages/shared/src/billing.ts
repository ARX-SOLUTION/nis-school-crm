export const PAYMENT_METHODS = ['CASH', 'CARD', 'CLICK', 'PAYME', 'BANK_TRANSFER'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_STATUSES = ['CONFIRMED', 'PENDING', 'REFUNDED'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export interface PaymentRecordDto {
  id: string;
  studentId: string;
  studentName?: string;
  studentCode?: string;
  className?: string | null;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  receiptNumber: string;
  month: string;
  paidAt: string | Date;
  comment?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface CreatePaymentRequestDto {
  studentId: string;
  amount: number;
  method: PaymentMethod;
  month: string;
  paidAt?: string;
  comment?: string;
}

export interface BillingStatsDto {
  totalCollectedThisMonth: number;
  expectedThisMonth: number;
  debtorCount: number;
  collectionRate: number;
  month: string;
}

export interface DebtorStudentDto {
  studentId: string;
  studentName: string;
  studentCode: string;
  className?: string | null;
  parentPhone?: string | null;
  monthlyFee: number;
  paidAmount: number;
  debtAmount: number;
  month: string;
}

export type PaymentGatewayProvider = 'PAYME' | 'CLICK';

export interface PaymentLinkResponseDto {
  studentId: string;
  studentCode: string;
  studentName: string;
  amount: number;
  paymeUrl: string;
  clickUrl: string;
}

export interface PaymentGatewayTransactionDto {
  id: string;
  provider: PaymentGatewayProvider;
  providerTransId: string;
  studentId: string;
  studentCode: string;
  amount: number;
  state: number;
  status: string;
  paymentRecordId?: string | null;
  performTime?: string | Date | null;
  cancelTime?: string | Date | null;
  createdAt: string | Date;
}
