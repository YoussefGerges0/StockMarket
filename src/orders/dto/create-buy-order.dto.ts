import { Type } from 'class-transformer';
import { IsInt, IsString, Min } from 'class-validator';

export class CreateBuyOrderDto {


  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;
}