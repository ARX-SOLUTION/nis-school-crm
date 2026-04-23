import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator';

export class CreateSubjectDto {
  @ApiProperty({
    description: 'Unique subject code — uppercase letters, digits, underscores or hyphens',
    example: 'MATH_7',
  })
  @IsString()
  @Length(1, 20)
  @Matches(/^[A-Z0-9_-]+$/, { message: 'code must contain only uppercase letters, digits, _ or -' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toUpperCase() : value,
  )
  code!: string;

  @ApiProperty({ description: 'Full subject name', example: 'Mathematics' })
  @IsString()
  @Length(1, 200)
  name!: string;

  @ApiProperty({
    description: 'Grade levels (1–11) this subject is taught in',
    example: [7, 8],
    type: [Number],
  })
  @IsArray()
  @ArrayUnique()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Max(11, { each: true })
  gradeLevels!: number[];

  @ApiPropertyOptional({
    description: 'Default weekly hours when assigning to a class',
    example: 2,
    minimum: 1,
    maximum: 40,
    default: 2,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(40)
  defaultHoursPerWeek?: number;

  @ApiPropertyOptional({
    description: 'Whether the subject is active (visible in dropdowns)',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
