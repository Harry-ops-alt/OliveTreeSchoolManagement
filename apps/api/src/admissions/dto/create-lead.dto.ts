import { Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateLeadDto {
  @IsOptional()
  @IsString()
  branchId?: string;

  @IsOptional()
  @IsUUID()
  assignedStaffId?: string;

  @IsNotEmpty()
  @IsString()
  parentFirstName!: string;

  @IsNotEmpty()
  @IsString()
  parentLastName!: string;

  @IsNotEmpty()
  @IsEmail()
  parentEmail!: string;

  @IsOptional()
  @IsString()
  parentPhone?: string;

  @IsOptional()
  @IsString()
  studentFirstName?: string;

  @IsOptional()
  @IsString()
  studentLastName?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  studentDateOfBirth?: Date;

  @IsOptional()
  @IsString()
  programmeInterest?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  preferredContactAt?: Date;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  metadata?: Record<string, unknown>;
}
