import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { DayOfWeek, StaffAssignmentRole } from '@prisma/client';

export class StaffAssignmentInput {
  @IsUUID('4')
  userId!: string;

  @IsOptional()
  @IsEnum(StaffAssignmentRole)
  role?: StaffAssignmentRole;

  @IsOptional()
  @IsDateString()
  assignedAt?: string;
}

export class CreateClassScheduleDto {
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsEnum(DayOfWeek)
  dayOfWeek!: DayOfWeek;

  @IsDateString()
  startTime!: string;

  @IsDateString()
  endTime!: string;

  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @IsOptional()
  @IsUUID('4')
  classroomId?: string;

  @IsOptional()
  @IsUUID('4')
  teacherProfileId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => StaffAssignmentInput)
  primaryInstructor?: StaffAssignmentInput;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StaffAssignmentInput)
  additionalStaff?: StaffAssignmentInput[];
}
