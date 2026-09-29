import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import type { LeadSource, LeadStage } from '@nis/shared';

@Entity({ name: 'leads' })
@Index('idx_leads_stage', ['stage'])
@Index('idx_leads_phone', ['phone'])
export class Lead extends BaseEntity {
  @Column({ name: 'full_name', type: 'varchar', length: 150 })
  fullName!: string;

  @Column({ name: 'phone', type: 'varchar', length: 25 })
  phone!: string;

  @Column({ name: 'parent_name', type: 'varchar', length: 150, nullable: true })
  parentName!: string | null;

  @Column({ name: 'target_grade_level', type: 'int', nullable: true })
  targetGradeLevel!: number | null;

  @Column({ name: 'source', type: 'varchar', length: 30, default: 'TELEGRAM' })
  source!: LeadSource;

  @Column({ name: 'stage', type: 'varchar', length: 30, default: 'NEW' })
  stage!: LeadStage;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes!: string | null;

  @Column({ name: 'converted_student_id', type: 'uuid', nullable: true })
  convertedStudentId!: string | null;
}
