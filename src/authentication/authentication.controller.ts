import { Body, Controller, Post } from '@nestjs/common';
import { AuthenticationService } from './authentication.service';
import { SendRegisterOtpDto } from './dto/send-register-otp.dto';
import { VerifyRegisterOtpDto } from './dto/verify-register-otp.dto';
import { LoginDto } from './dto/login.dto';

@Controller('authentication')
export class AuthenticationController {
  constructor(
    private readonly authenticationService: AuthenticationService,
  ) {}

  @Post('send-register-otp')
  sendRegisterOtp(@Body() body: SendRegisterOtpDto) {
    return this.authenticationService.sendRegisterOtp(body.email);
  }

  @Post('verify-register-otp')
  verifyRegisterOtp(@Body() body: VerifyRegisterOtpDto) {
    return this.authenticationService.verifyRegisterOtp(
      body.email,
      body.code,
      body.password,
    );
  }

  @Post('login')
  login(@Body() body: LoginDto) {
    return this.authenticationService.login(body.email, body.password);
  }
}