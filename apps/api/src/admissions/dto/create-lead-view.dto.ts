import { IsBoolean, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateLeadViewDto {
  @IsString()
  @MaxLength(80)
  name!: string;

  @IsObject()
  @Type(() => Object)
  filters!: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsBoolean()
  sharedWithOrg?: boolean;
}
