import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsUUID, Length } from 'class-validator';
import {
  PARENT_RELATIONSHIP_VALUES,
  ParentRelationship,
} from '../../parents/entities/parent-invite.entity';

export class CreateParentInviteDto {
  @ApiProperty({
    description: 'UUID of the student the parent will be linked to',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    format: 'uuid',
  })
  @IsUUID('4')
  studentId!: string;

  @ApiPropertyOptional({
    description: 'Human-readable name of the parent being invited',
    example: 'Dilnoza Karimova',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @Length(1, 200)
  parentName?: string;

  @ApiPropertyOptional({
    description: 'Relationship of the parent to the student',
    enum: PARENT_RELATIONSHIP_VALUES,
    example: 'MOTHER',
  })
  @IsOptional()
  @IsIn(PARENT_RELATIONSHIP_VALUES as unknown as ParentRelationship[])
  relationship?: ParentRelationship;
}
