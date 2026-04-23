import { useQuery } from '@tanstack/react-query';
import type { ClassResponseDto, StudentResponseDto } from '@nis/shared';
import type { ApiError } from '@/lib/api';
import { teacherSelfApi } from './teacher-self-api';

export function useMyClassQuery() {
  return useQuery<ClassResponseDto | null, ApiError>({
    queryKey: ['teachers', 'me', 'class'],
    queryFn: teacherSelfApi.myClass,
    staleTime: 60_000,
  });
}

export function useMyStudentsQuery() {
  return useQuery<StudentResponseDto[], ApiError>({
    queryKey: ['teachers', 'me', 'students'],
    queryFn: teacherSelfApi.myStudents,
    staleTime: 30_000,
  });
}
