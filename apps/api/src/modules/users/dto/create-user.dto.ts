import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { RoleName } from '../../../common/enums/role.enum';

export class CreateUserDto {
  @ApiProperty({ example: 'manager@nis.uz' })
  @IsEmail()
  @MaxLength(150)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email!: string;

  @ApiProperty({ example: 'Ali Valiyev' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  fullName!: string;

  @ApiProperty({ enum: RoleName, example: RoleName.MANAGER })
  @IsEnum(RoleName)
  role!: RoleName;

  @ApiProperty({ required: false, example: '+998901234567' })
  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9]{7,15}$/, { message: 'phone must be a valid international number' })
  phone?: string;

  @ApiProperty({ required: false, example: 'alivaliyev' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.replace(/^@+/, '').trim() : value,
  )
  telegramUsername?: string;
}
