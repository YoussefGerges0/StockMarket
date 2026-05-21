import { IsEmail, IsString, Length, Matches, MinLength } from 'class-validator';

export class VerifyRegisterOtpDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/, {
    message: 'code must contain exactly 6 digits',
  })
  code!: string;

  @MinLength(2)
  password!: string;
}