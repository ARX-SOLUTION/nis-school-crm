import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Min,
} from 'class-validator';
import { PAYMENT_METHODS, type PaymentMethod } from '@nis/shared';

export class CreatePaymentDto {
  @ApiProperty({ format: 'uuid', description: 'Student UUID' })
  @IsUUID('4')
  studentId!: string;

  @ApiProperty({ description: 'Payment amount in UZS', example: 2500000 })
  @IsNumber()
  @Min(1000)
  amount!: number;

  @ApiProperty({ enum: PAYMENT_METHODS, description: 'Payment method', example: 'CASH' })
  @IsIn(PAYMENT_METHODS)
  method!: PaymentMethod;

  @ApiProperty({ description: 'Billing month in YYYY-MM format', example: '2026-09' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}$/, { message: 'month must be in YYYY-MM format' })
  month!: string;

  @ApiPropertyOptional({ description: 'Date of payment (defaults to now)', example: '2026-09-28' })
  @IsOptional()
  @IsDateString()
  paidAt?: string;

  @ApiPropertyOptional({ description: 'Optional comment or note' })
  @IsOptional()
  @IsString()
  comment?: string;
}
