import { IsEmail } from 'class-validator';

export class SendRegisterOtpDto {
  @IsEmail()
  email!: string;
}