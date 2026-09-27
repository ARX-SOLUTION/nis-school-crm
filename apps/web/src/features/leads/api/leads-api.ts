import { api } from '@/lib/api';
import type {
  ConvertToStudentRequestDto,
  CreateLeadRequestDto,
  LeadDto,
  LeadPipelineStatsDto,
  LeadSource,
  LeadStage,
  UpdateLeadStageRequestDto,
} from '@nis/shared';

export interface LeadsFilterParams {
  stage?: LeadStage;
  source?: LeadSource;
  search?: string;
}

export const leadsApi = {
  list: async (params?: LeadsFilterParams): Promise<LeadDto[]> => {
    const res = await api.get<LeadDto[]>('/leads', { params });
    return res.data;
  },

  getStats: async (): Promise<LeadPipelineStatsDto> => {
    const res = await api.get<LeadPipelineStatsDto>('/leads/stats');
    return res.data;
  },

  getOne: async (id: string): Promise<LeadDto> => {
    const res = await api.get<LeadDto>(`/leads/${id}`);
    return res.data;
  },

  create: async (dto: CreateLeadRequestDto): Promise<LeadDto> => {
    const res = await api.post<LeadDto>('/leads', dto);
    return res.data;
  },

  updateStage: async (id: string, dto: UpdateLeadStageRequestDto): Promise<LeadDto> => {
    const res = await api.patch<LeadDto>(`/leads/${id}/stage`, dto);
    return res.data;
  },

  convertToStudent: async (
    id: string,
    dto: ConvertToStudentRequestDto,
  ): Promise<{ lead: LeadDto; studentId: string }> => {
    const res = await api.post<{ lead: LeadDto; studentId: string }>(`/leads/${id}/convert`, dto);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/leads/${id}`);
  },
};
