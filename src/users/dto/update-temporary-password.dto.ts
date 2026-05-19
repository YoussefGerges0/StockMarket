import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class UpdateTemporaryPasswordDto {
  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  temporaryPassword!: string;
}