import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SeedService } from './seed';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Wallet,WalletSchema } from '../wallet/schemas/wallet.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {name: User.name,schema: UserSchema},
      {name: Wallet.name,schema: WalletSchema},
    ]),
  ],
  providers: [SeedService],
})
export class SeedModule {}