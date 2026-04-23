import { Column, Entity, Index, JoinColumn, OneToOne } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'teacher_profiles' })
@Index('idx_teacher_profiles_user', ['userId'], { unique: true })
export class TeacherProfile extends BaseEntity {
  @OneToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'subject', type: 'varchar', length: 100, nullable: true })
  subject!: string | null;

  @Column({ name: 'experience_years', type: 'int', default: 0 })
  experienceYears!: number;

  @Column({ name: 'education', type: 'varchar', length: 500, nullable: true })
  education!: string | null;

  @Column({ name: 'bio', type: 'text', nullable: true })
  bio!: string | null;
}
