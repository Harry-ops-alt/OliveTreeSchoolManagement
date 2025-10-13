import { PartialType } from '@nestjs/mapped-types';
import { CreateLeadDto } from './create-lead.dto';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { AdmissionContactChannel } from '@prisma/client';

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
  @IsEnum(AdmissionContactChannel)
  preferredContactChannel?: AdmissionContactChannel;

  @IsOptional()
  @IsString()
  preferredContactTimezone?: string;

  @IsOptional()
  @IsString()
  preferredContactNotes?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  studentPreferredStart?: Date;

  @IsOptional()
  @IsString()
  studentYearGroup?: string;

  @IsOptional()
  @IsString()
  studentCurrentSchool?: string;

  @IsOptional()
  @IsString()
  studentCurrentYear?: string;

  @IsOptional()
  @IsString()
  studentInterests?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  addressLine1?: string;

  @IsOptional()
  @IsString()
  addressLine2?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsBoolean()
  studentHasSen?: boolean;

  @IsOptional()
  @IsString()
  studentSenDetails?: string;

  @IsOptional()
  @IsString()
  studentMedicalNotes?: string;

  @IsOptional()
  @IsString()
  studentSupportNotes?: string;

  @IsOptional()
  @IsObject()
  studentAdditionalNeeds?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  marketingOptIn?: boolean;

  @IsOptional()
  @IsBoolean()
  consentShareData?: boolean;

  @IsOptional()
  @IsString()
  referralSourceDetail?: string;

  @IsOptional()
  @IsString()
  referralCode?: string;

  @IsOptional()
  @IsArray()
  @Type(() => Date)
  @IsDate({ each: true })
  preferredTasterDates?: Date[];

  @IsOptional()
  @IsString()
  preferredTasterNotes?: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  additionalChildren?: Record<string, unknown>;
}
