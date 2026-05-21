import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StocksController } from './stocks.controller';
import { StocksService } from './stocks.service';
import { Stock, StockSchema } from './schemas/stock.schema';
import {StockPriceHistory,StockPriceHistorySchema,} from './schemas/stock-price-history.schema';
import { PriceAlertsModule } from '../price-alerts/price-alerts.module';
@Module({
  imports: [
    PriceAlertsModule,
    MongooseModule.forFeature([
      {name: Stock.name,schema: StockSchema},
      {name: StockPriceHistory.name,schema: StockPriceHistorySchema,},
    ]),
    
  ],
  controllers: [StocksController],
  providers: [StocksService],
  exports: [StocksService],
})
export class StocksModule {}