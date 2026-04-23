import type { StudentsListQueryDto } from '@nis/shared';

export const studentsKeys = {
  all: ['students'] as const,
  lists: () => [...studentsKeys.all, 'list'] as const,
  list: (query: StudentsListQueryDto) => [...studentsKeys.lists(), query] as const,
  detail: (id: string) => [...studentsKeys.all, 'detail', id] as const,
  history: (id: string) => [...studentsKeys.all, 'history', id] as const,
};
