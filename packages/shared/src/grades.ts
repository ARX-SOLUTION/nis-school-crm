export const GRADE_TYPES = ['CLASSWORK', 'HOMEWORK', 'EXAM', 'QUARTER'] as const;
export type GradeType = (typeof GRADE_TYPES)[number];

export interface GradeRecordDto {
  id: string;
  studentId: string;
  studentName?: string;
  classId: string;
  subjectId: string;
  subjectName?: string;
  date: string;
  score: number;
  maxScore: number;
  gradeType: GradeType;
  comment?: string | null;
  teacherId?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface CreateGradeRequestDto {
  studentId: string;
  classId: string;
  subjectId: string;
  date: string;
  score: number;
  maxScore?: number;
  gradeType?: GradeType;
  comment?: string;
}

export interface StudentGradeSummaryDto {
  studentId: string;
  studentName: string;
  grades: GradeRecordDto[];
  averageScore: number;
}
