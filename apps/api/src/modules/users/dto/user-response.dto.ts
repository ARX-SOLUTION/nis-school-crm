import { ApiProperty } from '@nestjs/swagger';
import { RoleName } from '../../../common/enums/role.enum';
import { User } from '../entities/user.entity';

export class UserResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  fullName!: string;

  @ApiProperty({ nullable: true })
  phone!: string | null;

  @ApiProperty({ enum: RoleName })
  role!: RoleName;

  @ApiProperty({ nullable: true })
  telegramUsername!: string | null;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  mustChangePassword!: boolean;

  @ApiProperty({ type: 'string', format: 'date-time', nullable: true })
  lastLoginAt!: Date | null;

  @ApiProperty({ type: 'string', format: 'date-time' })
  createdAt!: Date;

  static fromEntity(user: User): UserResponseDto {
    const dto = new UserResponseDto();
    dto.id = user.id;
    dto.email = user.email;
    dto.fullName = user.fullName;
    dto.phone = user.phone;
    dto.role = user.role;
    dto.telegramUsername = user.telegramUsername;
    dto.isActive = user.isActive;
    dto.mustChangePassword = user.mustChangePassword;
    dto.lastLoginAt = user.lastLoginAt;
    dto.createdAt = user.createdAt;
    return dto;
  }
}
