import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'classes' })
@Unique('uq_classes_name_year', ['name', 'academicYear'])
@Index('idx_classes_academic_year', ['academicYear'])
@Index('idx_classes_teacher', ['classTeacherId'])
export class ClassEntity extends BaseEntity {
  @Column({ name: 'name', type: 'varchar', length: 20 })
  name!: string;

  @Column({ name: 'grade_level', type: 'int' })
  gradeLevel!: number;

  @Column({ name: 'academic_year', type: 'varchar', length: 10 })
  academicYear!: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'class_teacher_id' })
  classTeacher!: User | null;

  @Column({ name: 'class_teacher_id', type: 'uuid', nullable: true })
  classTeacherId!: string | null;

  @Column({ name: 'max_students', type: 'int', default: 30 })
  maxStudents!: number;

  @Column({ name: 'room_number', type: 'varchar', length: 20, nullable: true })
  roomNumber!: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;
}
