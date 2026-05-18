import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
  Length
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateStockDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 5)
  ticker!: string;

  @IsString()
  @IsNotEmpty()
  companyName!: string;

  @IsString()
  @IsNotEmpty()
  sector!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  currentPrice!: number;

  @IsString()
  @MinLength(5)
  description!: string;

  @IsOptional()
  @IsBoolean()
  isListed?: boolean;
}