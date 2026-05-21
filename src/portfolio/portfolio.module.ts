import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PortfolioController } from './portfolio.controller';
import { PortfolioService } from './portfolio.service';
import {PortfolioPosition,PortfolioPositionSchema,} from './schemas/portfolio.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {name: PortfolioPosition.name,schema: PortfolioPositionSchema},
    ]),
  ],
  controllers: [PortfolioController],
  providers: [PortfolioService],
  exports: [PortfolioService],
})
export class PortfolioModule {}