import { IsArray, IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateTeacherDto {
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @IsOptional()
  @IsDateString()
  hireDate?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  subjects?: string[];
}
