export const LEAD_STAGES = [
  'NEW',
  'CONTACTED',
  'TRIAL_SCHEDULED',
  'CONTRACT_SENT',
  'ENROLLED',
  'LOST',
] as const;
export type LeadStage = (typeof LEAD_STAGES)[number];

export const LEAD_SOURCES = [
  'TELEGRAM',
  'INSTAGRAM',
  'FACEBOOK',
  'WEBSITE',
  'RECOMMENDATION',
  'WALK_IN',
  'OTHER',
] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];

export interface LeadDto {
  id: string;
  fullName: string;
  phone: string;
  parentName?: string | null;
  targetGradeLevel?: number | null;
  source: LeadSource;
  stage: LeadStage;
  notes?: string | null;
  convertedStudentId?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface CreateLeadRequestDto {
  fullName: string;
  phone: string;
  parentName?: string;
  targetGradeLevel?: number;
  source?: LeadSource;
  notes?: string;
}

export interface UpdateLeadStageRequestDto {
  stage: LeadStage;
  notes?: string;
}

export interface ConvertToStudentRequestDto {
  classId?: string;
  birthDate?: string;
  gender?: 'MALE' | 'FEMALE';
}

export interface LeadPipelineStatsDto {
  total: number;
  byStage: Record<LeadStage, number>;
  conversionRate: number;
}
