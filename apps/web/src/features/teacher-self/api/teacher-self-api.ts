import type { ClassResponseDto, StudentResponseDto } from '@nis/shared';
import { api } from '@/lib/api';

export const teacherSelfApi = {
  myClass: (): Promise<ClassResponseDto | null> =>
    api.get<ClassResponseDto | null>('/teachers/me/class').then((r) => r.data),

  myStudents: (): Promise<StudentResponseDto[]> =>
    api.get<StudentResponseDto[]>('/teachers/me/students').then((r) => r.data),
};
