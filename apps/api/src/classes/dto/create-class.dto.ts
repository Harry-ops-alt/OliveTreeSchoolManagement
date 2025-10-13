import { IsBoolean, IsDateString, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateClassDto {
  @IsUUID()
  branchId!: string;

  @IsOptional()
  @IsUUID()
  classroomId?: string | null;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  code?: string | null;

  @IsInt()
  @Min(0)
  capacity!: number;

  @IsOptional()
  @IsString()
  yearGroup?: string | null;

  @IsOptional()
  @IsDateString()
  startDate?: string | null;

  @IsOptional()
  @IsDateString()
  endDate?: string | null;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  metadata?: Record<string, unknown>;
}
