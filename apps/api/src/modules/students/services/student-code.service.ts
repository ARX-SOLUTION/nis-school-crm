import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager } from 'typeorm';

const SEQUENCE_NAME = 'students_code_seq';

@Injectable()
export class StudentCodeService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  /**
   * Atomically produce the next student code using the Postgres sequence.
   * Format: NIS-{academicYear}-{5-digit zero-padded sequence value}.
   * Uniqueness is guaranteed by the DB sequence + the `students.student_code`
   * unique constraint as a belt-and-suspenders check.
   */
  async next(academicYear: number, manager?: EntityManager): Promise<string> {
    const runner = manager ?? this.dataSource.manager;
    // SEQUENCE_NAME is a module-level constant (no user input ever flows
    // into it). Parameterised binding is not supported for Postgres
    // identifiers, so interpolation is unavoidable here — a static lint
    // rule would flag any future change that lets a variable reach this
    // string.
    const rows = await runner.query<Array<{ nextval: string }>>(
      `SELECT nextval('${SEQUENCE_NAME}') AS nextval`,
    );
    const raw = rows[0]?.nextval;
    if (!raw) {
      throw new Error('Failed to advance students_code_seq');
    }
    const n = parseInt(raw, 10);
    return `NIS-${academicYear}-${n.toString().padStart(5, '0')}`;
  }

  /** Parse academic year start from an "NNNN-NNNN" string, else throw. */
  static academicYearStart(academicYear: string): number {
    const m = /^(\d{4})-(\d{4})$/.exec(academicYear);
    if (!m) throw new Error(`academicYear must be YYYY-YYYY, got: ${academicYear}`);
    return parseInt(m[1] as string, 10);
  }
}
