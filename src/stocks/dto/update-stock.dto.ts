import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateStockDto {
  @IsOptional()
  @IsString()
  @Length(2,5)
  ticker?: string;

  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsString()
  sector?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  currentPrice?: number;

  @IsOptional()
  @IsString()
  @MinLength(5)
  description?: string;

  @IsOptional()
  @IsBoolean()
  isListed?: boolean;
}