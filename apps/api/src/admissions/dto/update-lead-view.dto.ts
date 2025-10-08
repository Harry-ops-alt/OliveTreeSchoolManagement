import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateLeadViewDto } from './create-lead-view.dto';

export class UpdateLeadViewDto extends PartialType(CreateLeadViewDto) {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  override name?: string;

  @IsOptional()
  @Type(() => Object)
  override filters?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  override isDefault?: boolean;

  @IsOptional()
  @IsBoolean()
  override sharedWithOrg?: boolean;
}
