import { AdmissionLeadStage } from '@prisma/client';
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class BulkUpdateLeadStageDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsUUID(undefined, { each: true })
  leadIds!: string[];

  @IsEnum(AdmissionLeadStage)
  toStage!: AdmissionLeadStage;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsUUID()
  assignedStaffId?: string;
}
