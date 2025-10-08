import { Transform, type TransformFnParams } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { AdmissionLeadStage } from '@prisma/client';

const toNumber = ({ value }: TransformFnParams): number | undefined => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const toStringArray = ({ value }: TransformFnParams): string[] | undefined => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const items = Array.isArray(value) ? value : String(value).split(',');
  const normalised = items
    .map((item) => String(item).trim())
    .filter((item) => item.length > 0);

  return normalised.length ? normalised : undefined;
};

const toUuidArray = (params: TransformFnParams): string[] | undefined => toStringArray(params);

const toStageArray = (params: TransformFnParams): AdmissionLeadStage[] | undefined => {
  const items = toStringArray(params);
  if (!items) {
    return undefined;
  }

  return items.map((item) => item.toUpperCase() as AdmissionLeadStage);
};

const toTrimmedString = (params: TransformFnParams): string | undefined => {
  const { value } = params;

  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
};

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export class ListLeadsDto {
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @IsOptional()
  @Transform(toUuidArray)
  @IsUUID(undefined, { each: true })
  branchIds?: string[];

  @IsOptional()
  @IsEnum(AdmissionLeadStage)
  stage?: AdmissionLeadStage;

  @IsOptional()
  @Transform(toStageArray)
  @IsEnum(AdmissionLeadStage, { each: true })
  stages?: AdmissionLeadStage[];

  @IsOptional()
  @IsUUID()
  assignedStaffId?: string;

  @IsOptional()
  @Transform(toUuidArray)
  @IsUUID(undefined, { each: true })
  assignedStaffIds?: string[];

  @IsOptional()
  @Transform(toStringArray)
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @Transform(toTrimmedString)
  @IsString()
  search?: string;

  @IsOptional()
  @Transform(toNumber)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(toNumber)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  pageSize?: number = DEFAULT_PAGE_SIZE;
}
