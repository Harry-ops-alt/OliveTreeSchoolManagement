import { AdmissionLeadStage } from '@prisma/client';
import { Expose } from 'class-transformer';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateLeadStageDto {
  @Expose()
  @IsEnum(AdmissionLeadStage)
  toStage!: AdmissionLeadStage;

  @Expose()
  @IsOptional()
  @IsString()
  reason?: string;

  @Expose()
  @IsOptional()
  @IsUUID()
  assignedStaffId?: string;
}
