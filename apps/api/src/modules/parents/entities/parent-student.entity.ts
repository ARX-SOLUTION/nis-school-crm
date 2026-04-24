import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { Student } from '../../students/entities/student.entity';
import { User } from '../../users/entities/user.entity';
import { PARENT_RELATIONSHIP_VALUES, ParentRelationship } from './parent-invite.entity';

// Re-export so consumers can import from this module without depending on parent-invite.
export { PARENT_RELATIONSHIP_VALUES, ParentRelationship };

/**
 * Many-to-many join between PARENT-role users and students they are
 * authorised to view. A student can have multiple parents; a parent can
 * be linked to multiple students (siblings).
 *
 * The UNIQUE constraint on (parent_user_id, student_id) prevents duplicate
 * links. ON DELETE CASCADE on both FKs means that deleting a parent user or
 * a student automatically removes the link — this is intentional because the
 * link has no standalone meaning without both sides.
 *
 * `isPrimary` flags the primary guardian for notification routing. At most one
 * row per student should have isPrimary = true; this is enforced at the service
 * layer (a partial unique index is not added here to avoid complexity when
 * switching the primary guardian).
 */
@Entity({ name: 'parent_students' })
@Unique('uq_parent_students_parent_student', ['parentUserId', 'studentId'])
@Index('idx_parent_students_parent_user', ['parentUserId'])
@Index('idx_parent_students_student', ['studentId'])
export class ParentStudent extends BaseEntity {
  /** The PARENT-role user acting as guardian. */
  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'parent_user_id' })
  parentUser!: User;

  @Column({ name: 'parent_user_id', type: 'uuid' })
  parentUserId!: string;

  @ManyToOne(() => Student, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'student_id' })
  student!: Student;

  @Column({ name: 'student_id', type: 'uuid' })
  studentId!: string;

  /**
   * Relationship label. Constrained to PARENT_RELATIONSHIP_VALUES by a DB
   * CHECK constraint added in migration 1745366440000.
   */
  @Column({ name: 'relationship', type: 'varchar', length: 30, nullable: true })
  relationship!: ParentRelationship | null;

  /**
   * Marks this guardian as the primary contact for the student.
   * Used for notification routing (Telegram messages, report cards, etc.).
   */
  @Column({ name: 'is_primary', type: 'boolean', default: false })
  isPrimary!: boolean;
}
