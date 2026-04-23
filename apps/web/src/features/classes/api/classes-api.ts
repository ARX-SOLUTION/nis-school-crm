import type {
  AssignTeacherRequestDto,
  ClassResponseDto,
  ClassesListQueryDto,
  CreateClassRequestDto,
  PaginatedResponse,
  UpdateClassRequestDto,
} from '@nis/shared';
import { api } from '@/lib/api';

export const classesApi = {
  list: (query: ClassesListQueryDto): Promise<PaginatedResponse<ClassResponseDto>> =>
    api.get<PaginatedResponse<ClassResponseDto>>('/classes', { params: query }).then((r) => r.data),

  get: (id: string): Promise<ClassResponseDto> =>
    api.get<ClassResponseDto>(`/classes/${id}`).then((r) => r.data),

  create: (body: CreateClassRequestDto): Promise<ClassResponseDto> =>
    api.post<ClassResponseDto>('/classes', body).then((r) => r.data),

  update: (id: string, body: UpdateClassRequestDto): Promise<ClassResponseDto> =>
    api.patch<ClassResponseDto>(`/classes/${id}`, body).then((r) => r.data),

  remove: (id: string): Promise<void> => api.delete<void>(`/classes/${id}`).then(() => undefined),

  assignTeacher: (id: string, body: AssignTeacherRequestDto): Promise<ClassResponseDto> =>
    api.patch<ClassResponseDto>(`/classes/${id}/assign-teacher`, body).then((r) => r.data),
};
