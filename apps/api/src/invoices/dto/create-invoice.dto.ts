import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class InvoiceLineItemDto {
  @IsString()
  @IsNotEmpty()
  description!: string;

  @Type(() => Number)
  @Min(0)
  amount!: number;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  quantity?: number;
}

export class CreateInvoiceDto {
  @IsOptional()
  @IsUUID()
  subscriptionId?: string | null;

  @IsUUID()
  @IsNotEmpty()
  studentId!: string;

  @IsOptional()
  @IsUUID()
  parentId?: string | null;

  @IsDateString()
  dueDate!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceLineItemDto)
  lineItems!: InvoiceLineItemDto[];

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  metadata?: Record<string, unknown>;
}
