import { Repository } from 'typeorm';
import { GradeRecord } from './entities/grade.entity';
import { GradesService } from './grades.service';

describe('GradesService', () => {
  let repo: jest.Mocked<Repository<GradeRecord>>;
  let service: GradesService;

  beforeEach(() => {
    repo = {
      create: jest.fn((dto) => ({ ...dto }) as GradeRecord),
      save: jest.fn(async (rec) => rec as GradeRecord),
      createQueryBuilder: jest.fn(),
    } as unknown as jest.Mocked<Repository<GradeRecord>>;

    service = new GradesService(repo);
  });

  describe('recordGrade', () => {
    it('creates and saves a grade record', async () => {
      const result = await service.recordGrade(
        {
          studentId: 'student-1',
          classId: 'class-1',
          subjectId: 'sub-1',
          date: '2026-09-28',
          score: 5,
          gradeType: 'CLASSWORK',
          comment: 'Excellent answer',
        },
        'teacher-1',
      );

      expect(result.score).toBe(5);
      expect(result.teacherId).toBe('teacher-1');
      expect(repo.save).toHaveBeenCalled();
    });
  });
});
