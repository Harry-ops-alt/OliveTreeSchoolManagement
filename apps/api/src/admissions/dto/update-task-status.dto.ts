import { AdmissionTaskStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateTaskStatusDto {
  @IsEnum(AdmissionTaskStatus)
  status!: AdmissionTaskStatus;
}
