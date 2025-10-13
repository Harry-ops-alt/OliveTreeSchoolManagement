import { Type } from 'class-transformer';
import {
  AdmissionApplicationStatus,
  AdmissionDecision,
} from '@prisma/client';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateApplicationDto {
  @IsNotEmpty()
  @IsUUID()
  leadId!: string;

  @IsOptional()
  @IsUUID()
  branchId?: string;

  @IsOptional()
  @IsString()
  yearGroup?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  requestedStart?: Date;

  @IsOptional()
  @IsEnum(AdmissionApplicationStatus)
  status?: AdmissionApplicationStatus;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  submittedAt?: Date;

  @IsOptional()
  @IsUUID()
  reviewedById?: string;

  @IsOptional()
  @IsEnum(AdmissionDecision)
  decision?: AdmissionDecision;

  @IsOptional()
  @IsString()
  decisionNotes?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  decisionAt?: Date;

  @IsOptional()
  extraData?: Record<string, unknown>;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  reviewStartedAt?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  offerSentAt?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  offerAcceptedAt?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  enrolledAt?: Date;
}
