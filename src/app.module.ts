import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthenticationModule } from './authentication/authentication.module';
import { PortfolioModule } from './portfolio/portfolio.module';
import { StocksModule } from './stocks/stocks.module';
import { WalletModule } from './wallet/wallet.module';
import { OrdersModule } from './orders/orders.module';

function validateConfig(config: Record<string, unknown>) {
  if (!config.MONGO_URI) {
    throw new Error('MONGO_URI is required');
  }

  if (!config.JWT_SECRET) {
    throw new Error('JWT_SECRET is required');
  }

  const port = Number(config.PORT ?? 3000);

  if (Number.isNaN(port)) {
    throw new Error('PORT must be a number');
  }

  return {
    ...config,
    PORT: port,
  };
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateConfig,
    }),

    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.getOrThrow<string>('MONGO_URI'),
      }),
    }),

    UsersModule,
    AuthenticationModule,
    PortfolioModule,
    StocksModule,
    WalletModule,
    OrdersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}