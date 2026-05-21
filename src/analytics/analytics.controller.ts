import { Controller, Get, Query,UseGuards } from '@nestjs/common';
import { Types } from 'mongoose';
import { AnalyticsService } from './analytics.service';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';
import { ParseDatePipe } from '../common/pipes/parse-date.pipe';
import { AuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
type Granularity = 'day' | 'month';

@UseGuards(AuthGuard,RolesGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Roles(UserRole.SADMIN,UserRole.ADMIN,UserRole.ANALYST)
  @Get('volume')
  getVolume(
    @Query('stock_id', ParseObjectIdPipe) stockId: Types.ObjectId,
    @Query('granularity') granularity: Granularity,
    @Query('from', ParseDatePipe) from: Date|undefined,
    @Query('to', ParseDatePipe) to: Date|undefined,
  ) {
    return this.analyticsService.getVolume(stockId,granularity,from,to);
  }
  
@Roles(UserRole.SADMIN,UserRole.ADMIN,UserRole.ANALYST)
  @Get('stocks/top')
getTopTradedStocks(
  @Query('limit') limit = '5',
  @Query('page') page = '1',
) {
  return this.analyticsService.getTopTradedStocks(
    Number(limit),
    Number(page),
  );
}
@Roles(UserRole.SADMIN,UserRole.ADMIN,UserRole.ANALYST)
@Get('aum')
  getAum() {
  return this.analyticsService.getAum();
}


@Roles(UserRole.SADMIN,UserRole.ADMIN,UserRole.ANALYST)
@Get('members/active')
getMostActiveMembers(
  @Query('days') days = '30',
  @Query('limit') limit = '10',
) {
  return this.analyticsService.getMostActiveMembers(
    Number(days),
    Number(limit),
  );
}

@Roles(UserRole.SADMIN,UserRole.ADMIN,UserRole.ANALYST)
@Get('sectors')
getSectorAllocation() {
  return this.analyticsService.getSectorAllocation();
}

@Roles(UserRole.SADMIN,UserRole.ADMIN,)
@Get('members/growth')
getMembersGrowth() {
  return this.analyticsService.getMembersGrowth();
}

@Roles(UserRole.SADMIN,UserRole.ADMIN)
@Get('withdrawals/pending')
getPendingWithdrawalsCount() {
  return this.analyticsService.getPendingWithdrawalsCount();
}


@Get('alerts/negative-wallets')
getNegativeWalletAlerts() {
  return this.analyticsService.getNegativeWalletAlerts();
}
}