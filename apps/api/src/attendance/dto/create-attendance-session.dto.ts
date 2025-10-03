import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateAttendanceSessionDto {
  @IsUUID()
  branchId!: string;

  @IsOptional()
  @IsUUID()
  classScheduleId?: string;

  @IsDateString()
  date!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
