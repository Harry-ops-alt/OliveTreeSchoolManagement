import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { AdmissionContactChannel } from '@prisma/client';

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
  studentLanguages?: string[];

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
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  additionalChildren?: Record<string, unknown>;
}
