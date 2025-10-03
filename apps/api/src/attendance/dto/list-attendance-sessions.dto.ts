import { IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { AttendanceSessionStatus } from '@prisma/client';

export class ListAttendanceSessionsDto {
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @IsOptional()
  @IsUUID()
  classScheduleId?: string;

  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @IsOptional()
  @IsDateString()
  toDate?: string;

  @IsOptional()
  @IsEnum(AttendanceSessionStatus)
  status?: AttendanceSessionStatus;
}
