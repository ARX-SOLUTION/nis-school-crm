import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';

@Entity({ name: 'subjects' })
@Index('idx_subjects_active', ['isActive'], { where: '"deleted_at" IS NULL' })
export class Subject extends BaseEntity {
  @Column({ name: 'code', type: 'varchar', length: 20, unique: true })
  code!: string;

  @Column({ name: 'name', type: 'varchar', length: 200 })
  name!: string;

  /**
   * Array of grade levels (1..11) this subject is taught in.
   * DB CHECK: each element must be between 1 and 11.
   */
  @Column({
    name: 'grade_levels',
    type: 'int',
    array: true,
    nullable: false,
    default: '{}',
  })
  gradeLevels!: number[];

  /**
   * Default weekly hours when assigning this subject to a class.
   * DB CHECK: BETWEEN 1 AND 40.
   */
  @Column({ name: 'default_hours_per_week', type: 'int', default: 2 })
  defaultHoursPerWeek!: number;

  /**
   * Soft-disable: inactive subjects are hidden from dropdowns but retain
   * historical grade data. Distinct from soft-delete (deletedAt).
   */
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;
}
