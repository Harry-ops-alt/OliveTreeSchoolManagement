import { Expose, Type } from 'class-transformer';
import { AdmissionContactChannel } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RecordLeadContactDto {
  @Expose()
  @IsEnum(AdmissionContactChannel)
  channel!: AdmissionContactChannel;

  @Expose()
  @IsNotEmpty()
  @IsString()
  summary!: string;

  @Expose()
  @IsOptional()
  @Type(() => Date)
  occurredAt?: Date;

  @Expose()
  @IsOptional()
  metadata?: Record<string, unknown>;
}
