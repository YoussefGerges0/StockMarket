import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { Wallet, WalletSchema } from './schemas/wallet.schema';
import {WalletTransaction,WalletTransactionSchema} from './schemas/wallet-transaction.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Wallet.name,
        schema: WalletSchema,
      },
      {name: WalletTransaction.name,schema: WalletTransactionSchema},
      {name: User.name,schema: UserSchema},
    ]),
    JwtModule.register({
  secret: process.env.JWT_SECRET || 'secret_key',
  signOptions: {
    expiresIn:'1h',
  },
}),
  ],
  controllers: [WalletController],
  providers: [WalletService],
  exports: [WalletService],
})
export class WalletModule {}