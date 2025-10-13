import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DiscountType } from '@prisma/client';

export class CreateDiscountDto {
  @IsUUID()
  @IsNotEmpty()
  organizationId!: string;

  @IsOptional()
  @IsString()
  code?: string | null;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEnum(DiscountType)
  type!: DiscountType;

  @IsOptional()
  @ValidateIf((o) => !o.fixedAmount)
  @Type(() => Number)
  @Min(0)
  percentage?: number | null;

  @IsOptional()
  @ValidateIf((o) => !o.percentage)
  @Type(() => Number)
  @Min(0)
  fixedAmount?: number | null;

  @IsOptional()
  criteria?: Record<string, unknown>;

  @IsOptional()
  @IsDateString()
  validFrom?: string | null;

  @IsOptional()
  @IsDateString()
  validTo?: string | null;
}
