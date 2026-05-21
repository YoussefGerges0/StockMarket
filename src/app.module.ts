import {Module} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthenticationModule } from './authentication/authentication.module';
import { PortfolioModule } from './portfolio/portfolio.module';
import { StocksModule } from './stocks/stocks.module';
import { WalletModule } from './wallet/wallet.module';
import { OrdersModule } from './orders/orders.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { ScheduleModule } from '@nestjs/schedule';
import { SeedModule } from './seed/seed.module';
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
    ScheduleModule.forRoot(),
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


     ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        {
          name: 'auth_ip',
          ttl: Number(configService.get<string>('AUTH_IP_TTL')),
          limit: Number(configService.get<string>('AUTH_IP_LIMIT')),
        },
        {
          name: 'auth_user',
          ttl: Number(configService.get<string>('AUTH_USER_TTL')),
          limit: Number(configService.get<string>('AUTH_USER_LIMIT')),
        },
      ],
    }),
    

    

    UsersModule,
    AuthenticationModule,
    PortfolioModule,
    StocksModule,
    WalletModule,
    OrdersModule,
    AnalyticsModule,
    SeedModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}