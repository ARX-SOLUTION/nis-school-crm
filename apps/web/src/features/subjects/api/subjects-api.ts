import { api } from '@/lib/api';
import type {
  CreateSubjectRequestDto,
  PaginatedResponse,
  SubjectResponseDto,
  UpdateSubjectRequestDto,
} from '@nis/shared';

export interface SubjectsFilterParams {
  search?: string;
  gradeLevel?: number;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export const subjectsApi = {
  list: (params?: SubjectsFilterParams) =>
    api.get<PaginatedResponse<SubjectResponseDto>>('/subjects', { params }).then((res) => res.data),

  getById: (id: string) => api.get<SubjectResponseDto>(`/subjects/${id}`).then((res) => res.data),

  create: (dto: CreateSubjectRequestDto) =>
    api.post<SubjectResponseDto>('/subjects', dto).then((res) => res.data),

  update: (id: string, dto: UpdateSubjectRequestDto) =>
    api.patch<SubjectResponseDto>(`/subjects/${id}`, dto).then((res) => res.data),

  remove: (id: string) => api.delete<void>(`/subjects/${id}`).then((res) => res.data),
};
