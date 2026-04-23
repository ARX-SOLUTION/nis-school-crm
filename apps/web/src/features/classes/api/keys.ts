import type { ClassesListQueryDto } from '@nis/shared';

export const classesKeys = {
  all: ['classes'] as const,
  lists: () => [...classesKeys.all, 'list'] as const,
  list: (query: ClassesListQueryDto) => [...classesKeys.lists(), query] as const,
  detail: (id: string) => [...classesKeys.all, 'detail', id] as const,
  students: (id: string) => [...classesKeys.all, 'students', id] as const,
};
