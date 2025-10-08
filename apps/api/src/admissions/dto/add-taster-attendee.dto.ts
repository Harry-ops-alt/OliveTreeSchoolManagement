import { AdmissionTasterStatus } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class AddTasterAttendeeDto {
  @IsNotEmpty()
  @IsUUID()
  leadId!: string;

  @IsOptional()
  @IsUUID()
  tasterId?: string;

  @IsOptional()
  @IsEnum(AdmissionTasterStatus)
  status?: AdmissionTasterStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}
