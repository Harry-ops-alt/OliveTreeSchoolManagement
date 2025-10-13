import {
  IsBoolean,
  IsDecimal,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { BillingCycle } from '@prisma/client';
import { Type } from 'class-transformer';

export class UpdateFeeStructureDto {
  @IsOptional()
  @IsUUID()
  branchId?: string | null;

  @IsOptional()
  @IsUUID()
  classId?: string | null;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsEnum(BillingCycle)
  billingCycle?: BillingCycle;

  @IsOptional()
  @IsString()
  yearGroup?: string | null;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  metadata?: Record<string, unknown>;
}
