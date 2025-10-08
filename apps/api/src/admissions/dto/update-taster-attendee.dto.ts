import { AdmissionTasterStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { IsDate } from 'class-validator';

export class UpdateTasterAttendeeDto {
  @IsOptional()
  @IsEnum(AdmissionTasterStatus)
  status?: AdmissionTasterStatus;

  @IsOptional()
  @IsString()
  notes?: string | null;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  attendedAt?: Date | null;
}
