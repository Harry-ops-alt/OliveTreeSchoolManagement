import { IsArray, IsDateString, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateTeacherDto {
  @IsUUID()
  @IsNotEmpty()
  userId!: string;

  @IsUUID()
  @IsNotEmpty()
  branchId!: string;

  @IsOptional()
  @IsDateString()
  hireDate?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  subjects?: string[];
}
