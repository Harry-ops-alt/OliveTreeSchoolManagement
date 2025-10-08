import { PartialType } from '@nestjs/mapped-types';
import { CreateLeadDto } from './create-lead.dto.js';
import { Type } from 'class-transformer';
import { IsArray, IsDate, IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateLeadDto extends PartialType(CreateLeadDto) {
  @IsOptional()
  @IsString()
  branchId?: string;

  @IsOptional()
  @IsUUID()
  assignedStaffId?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  studentDateOfBirth?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  preferredContactAt?: Date;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  metadata?: Record<string, unknown>;
}
