import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AttendanceStatus } from '@prisma/client';

class AttendanceRecordInput {
  @IsUUID()
  studentId!: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsString()
  status!: AttendanceStatus;
}

export class SubmitAttendanceRecordsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AttendanceRecordInput)
  records!: AttendanceRecordInput[];

  @IsOptional()
  @IsBoolean()
  finalize?: boolean;
}
