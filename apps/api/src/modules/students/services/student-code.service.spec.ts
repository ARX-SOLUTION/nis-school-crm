import { DataSource } from 'typeorm';
import { StudentCodeService } from './student-code.service';

const mockManager = (seq: number): { query: jest.Mock } => ({
  query: jest.fn().mockResolvedValue([{ nextval: String(seq) }]),
});

describe('StudentCodeService', () => {
  it('should_format_code_with_year_and_5_digit_padding', async () => {
    const manager = mockManager(1);
    const dataSource = {
      manager: { query: manager.query },
    } as unknown as DataSource;
    const service = new StudentCodeService(dataSource);
    const code = await service.next(2026);
    expect(code).toBe('NIS-2026-00001');
  });

  it('should_not_truncate_when_sequence_exceeds_5_digits', async () => {
    const manager = mockManager(123456);
    const dataSource = {
      manager: { query: manager.query },
    } as unknown as DataSource;
    const service = new StudentCodeService(dataSource);
    expect(await service.next(2026)).toBe('NIS-2026-123456');
  });

  it('should_parse_academic_year_start', () => {
    expect(StudentCodeService.academicYearStart('2026-2027')).toBe(2026);
  });

  it('should_reject_malformed_academic_year', () => {
    expect(() => StudentCodeService.academicYearStart('2026/2027')).toThrow();
    expect(() => StudentCodeService.academicYearStart('2026')).toThrow();
  });
});
