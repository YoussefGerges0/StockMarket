import {Type } from 'class-transformer';
import {IsInt, IsString,Min,Length } from 'class-validator';

export class CreateSellOrderDto {


  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;
}