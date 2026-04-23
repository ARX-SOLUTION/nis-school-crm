import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from '../../users/dto/user-response.dto';
import { TeacherProfile } from '../entities/teacher-profile.entity';
import { User } from '../../users/entities/user.entity';

export class TeacherResponseDto {
  @ApiProperty({ type: UserResponseDto })
  user!: UserResponseDto;

  @ApiProperty({ nullable: true })
  subject!: string | null;

  @ApiProperty()
  experienceYears!: number;

  @ApiProperty({ nullable: true })
  education!: string | null;

  @ApiProperty({ nullable: true })
  bio!: string | null;

  static fromEntities(user: User, profile: TeacherProfile): TeacherResponseDto {
    const dto = new TeacherResponseDto();
    dto.user = UserResponseDto.fromEntity(user);
    dto.subject = profile.subject;
    dto.experienceYears = profile.experienceYears;
    dto.education = profile.education;
    dto.bio = profile.bio;
    return dto;
  }
}
