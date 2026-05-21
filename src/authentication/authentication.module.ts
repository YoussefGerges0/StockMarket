import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { AuthenticationService } from './authentication.service';
import { AuthenticationController } from './authentication.controller';
import { Otp, OtpSchema } from './schemas/otp.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Wallet, WalletSchema } from '../wallet/schemas/wallet.schema';
import { NotificationsModule } from '../notifications/notifications.module';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Otp.name, schema: OtpSchema },
      { name: User.name, schema: UserSchema },
      { name: Wallet.name, schema: WalletSchema },
    ]),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'secret_key',
      signOptions: { expiresIn: '1h' },
    }),
    NotificationsModule,
  ],
  controllers: [AuthenticationController],
  providers: [AuthenticationService],
})
export class AuthenticationModule {}