import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { Order, OrderSchema } from './schemas/order.schema';
import { Stock, StockSchema } from '../stocks/schemas/stock.schema';
import { Wallet, WalletSchema } from '../wallet/schemas/wallet.schema';
import {WalletTransaction,WalletTransactionSchema,} from '../wallet/schemas/wallet-transaction.schema';
import { PortfolioModule } from '../portfolio/portfolio.module';
import { User, UserSchema } from '../users/schemas/user.schema';
@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Order.name,
        schema: OrderSchema,
      },
      {
        name: Stock.name,
        schema: StockSchema,
      },
      {name: Wallet.name,schema: WalletSchema},
      {name: WalletTransaction.name,schema: WalletTransactionSchema},
      {name: User.name,schema: UserSchema}
    ]),
    PortfolioModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}