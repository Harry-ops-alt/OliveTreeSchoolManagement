import { PartialType } from '@nestjs/mapped-types';
import { CreateApplicationDto } from './create-application.dto';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import {
  AdmissionApplicationStatus,
  AdmissionDecision,
} from '@prisma/client';

export class UpdateApplicationDto extends PartialType(CreateApplicationDto) {
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
