import { IsDateString, IsInt, IsNotEmpty, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePaymentPlanDto {
  @IsUUID()
  @IsNotEmpty()
  invoiceId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(2)
  installmentCount!: number;

  @IsDateString()
  startDate!: string;
}
