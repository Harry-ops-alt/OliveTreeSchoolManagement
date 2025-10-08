import { IsOptional, IsUUID } from 'class-validator';

export class ListLeadViewsDto {
  @IsOptional()
  @IsUUID()
  branchId?: string;
}
