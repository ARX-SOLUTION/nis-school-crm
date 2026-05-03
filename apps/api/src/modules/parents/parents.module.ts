import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Student } from '../students/entities/student.entity';
import { User } from '../users/entities/user.entity';
import { ParentInvite } from './entities/parent-invite.entity';
import { ParentStudent } from './entities/parent-student.entity';
import { ParentInviteService } from './services/parent-invite.service';

/**
 * Encapsulates parent-invite and parent-student link data + service.
 *
 * Exports ParentInviteService so AuthModule can import it for the
 * Telegram invite-accept flow. No controller is registered here —
 * @api-developer will add one in the next step.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([ParentInvite, ParentStudent, Student, User]),
    forwardRef(() => AuthModule),
  ],
  providers: [ParentInviteService],
  exports: [ParentInviteService],
})
export class ParentsModule {}
