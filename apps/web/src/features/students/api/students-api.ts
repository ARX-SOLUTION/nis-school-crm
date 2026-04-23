import type {
  ArchiveStudentRequestDto,
  AssignClassRequestDto,
  CreateStudentRequestDto,
  PaginatedResponse,
  StudentResponseDto,
  StudentsListQueryDto,
  UpdateStudentRequestDto,
} from '@nis/shared';
import { api } from '@/lib/api';

export interface ClassHistoryResponseDto {
  id: string;
  studentId: string;
  classId: string;
  assignedAt: string;
  removedAt: string | null;
  assignedById: string | null;
  reason: string | null;
}

export const studentsApi = {
  list: (query: StudentsListQueryDto): Promise<PaginatedResponse<StudentResponseDto>> =>
    api
      .get<PaginatedResponse<StudentResponseDto>>('/students', { params: query })
      .then((r) => r.data),

  get: (id: string): Promise<StudentResponseDto> =>
    api.get<StudentResponseDto>(`/students/${id}`).then((r) => r.data),

  create: (body: CreateStudentRequestDto): Promise<StudentResponseDto> =>
    api.post<StudentResponseDto>('/students', body).then((r) => r.data),

  update: (id: string, body: UpdateStudentRequestDto): Promise<StudentResponseDto> =>
    api.patch<StudentResponseDto>(`/students/${id}`, body).then((r) => r.data),

  assignClass: (id: string, body: AssignClassRequestDto): Promise<StudentResponseDto> =>
    api.patch<StudentResponseDto>(`/students/${id}/assign-class`, body).then((r) => r.data),

  archive: (id: string, body: ArchiveStudentRequestDto): Promise<StudentResponseDto> =>
    api.delete<StudentResponseDto>(`/students/${id}`, { data: body }).then((r) => r.data),

  history: (id: string): Promise<ClassHistoryResponseDto[]> =>
    api.get<ClassHistoryResponseDto[]>(`/students/${id}/class-history`).then((r) => r.data),

  exportCsv: async (): Promise<Blob> => {
    const res = await api.get<Blob>('/students/export', { responseType: 'blob' });
    return res.data;
  },
};
