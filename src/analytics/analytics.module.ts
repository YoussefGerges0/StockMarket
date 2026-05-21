import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService} from './analytics.service';
import { Order, OrderSchema } from '../orders/schemas/order.schema';
import { Wallet, WalletSchema } from '../wallet/schemas/wallet.schema';
import {PortfolioPosition,PortfolioPositionSchema} from '../portfolio/schemas/portfolio.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import {WalletTransaction,WalletTransactionSchema} from '../wallet/schemas/wallet-transaction.schema';
import {NegativeWalletAlert,NegativeWalletAlertSchema} from './schemas/negative-wallet-alert.schema';
@Module({
  imports: [
    MongooseModule.forFeature([
      {name: Order.name,schema: OrderSchema},
      {name: Wallet.name,schema: WalletSchema},
      {name:PortfolioPosition.name,schema:PortfolioPositionSchema},
      {name: User.name,schema: UserSchema},
      {name:WalletTransaction.name,schema:WalletTransactionSchema},
      {name: NegativeWalletAlert.name,schema: NegativeWalletAlertSchema},
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}