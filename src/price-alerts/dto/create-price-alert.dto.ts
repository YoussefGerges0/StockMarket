import { Type } from 'class-transformer';
import { IsEnum, IsNumber, Min } from 'class-validator';
import { PriceAlertDirection } from '../schemas/price-alert.schema';

export class CreatePriceAlertDto {
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  targetPrice!: number;

  @IsEnum(PriceAlertDirection)
  direction!: PriceAlertDirection;
}