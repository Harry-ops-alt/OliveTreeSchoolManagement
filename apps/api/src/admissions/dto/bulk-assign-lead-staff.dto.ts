import { ArrayNotEmpty, ArrayUnique, IsArray, IsOptional, IsUUID } from 'class-validator';

export class BulkAssignLeadStaffDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsUUID(undefined, { each: true })
  leadIds!: string[];

  @IsOptional()
  @IsUUID()
  assignedStaffId?: string;
}
