import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { ParentInvite, ParentRelationship } from '../../parents/entities/parent-invite.entity';

export class ParentInviteResponseDto {
  @ApiProperty({
    description: 'Invite UUID',
    format: 'uuid',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  id!: string;

  @ApiProperty({
    description: 'Raw invite token — 64 lowercase hex chars. Share this with the parent.',
    example: 'a3f1c2d4e5b6a7f8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
  })
  token!: string;

  @ApiProperty({
    description: 'Full URL the parent should open to accept the invite',
    example:
      'https://nis.uz/invite/a3f1c2d4e5b6a7f8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
  })
  inviteUrl!: string;

  @ApiProperty({
    description: 'UUID of the student this invite links to',
    format: 'uuid',
    example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  })
  studentId!: string;

  @ApiPropertyOptional({
    description: 'Human-readable name of the parent being invited',
    example: 'Dilnoza Karimova',
    nullable: true,
  })
  parentName!: string | null;

  @ApiPropertyOptional({
    description: 'Relationship of the parent to the student',
    enum: ['FATHER', 'MOTHER', 'GUARDIAN', 'OTHER'],
    nullable: true,
    example: 'MOTHER',
  })
  relationship!: ParentRelationship | null;

  @ApiProperty({
    description: 'When the invite expires (ISO 8601)',
    type: 'string',
    format: 'date-time',
    example: '2026-04-30T10:00:00.000Z',
  })
  expiresAt!: string;

  @ApiProperty({
    description: 'When the invite was created (ISO 8601)',
    type: 'string',
    format: 'date-time',
    example: '2026-04-23T10:00:00.000Z',
  })
  createdAt!: string;

  /**
   * Constructs the response DTO from the entity.
   *
   * Invite URL resolution order:
   * 1. TELEGRAM_LOGIN_DOMAIN   (production — the Telegram-verified domain)
   * 2. FRONTEND_URL            (dev fallback)
   * 3. Empty string            (last resort; consumers should handle this gracefully)
   */
  static fromEntity(invite: ParentInvite, config: ConfigService): ParentInviteResponseDto {
    const dto = new ParentInviteResponseDto();

    dto.id = invite.id;
    dto.token = invite.token;
    dto.studentId = invite.studentId;
    dto.parentName = invite.parentName;
    dto.relationship = invite.relationship;
    dto.expiresAt = invite.expiresAt.toISOString();
    dto.createdAt = invite.createdAt.toISOString();

    const telegramDomain = config.get<string>('TELEGRAM_LOGIN_DOMAIN', '');
    const frontendUrl = config.get<string>('FRONTEND_URL', '');
    const baseUrl = telegramDomain || frontendUrl;

    dto.inviteUrl = baseUrl ? `${baseUrl}/invite/${invite.token}` : `/invite/${invite.token}`;

    return dto;
  }
}
