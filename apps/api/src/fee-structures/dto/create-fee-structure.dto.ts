import {
  IsDecimal,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { BillingCycle } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateFeeStructureDto {
  @IsUUID()
  @IsNotEmpty()
  organizationId!: string;

  @IsOptional()
  @IsUUID()
  branchId?: string | null;

  @IsOptional()
  @IsUUID()
  classId?: string | null;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @Type(() => Number)
  @Min(0)
  amount!: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsEnum(BillingCycle)
  billingCycle!: BillingCycle;

  @IsOptional()
  @IsString()
  yearGroup?: string | null;

  @IsOptional()
  metadata?: Record<string, unknown>;
}
