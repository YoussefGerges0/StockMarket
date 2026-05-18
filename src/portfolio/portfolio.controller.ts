import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { Types } from 'mongoose';
import { PortfolioService } from './portfolio.service';
import { AuthGuard } from '../common/guards/jwt-auth.guard';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';

@UseGuards(AuthGuard)
@Controller('portfolio')
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Get(':userId')
  getUserPortfolio(
    @Param('userId', ParseObjectIdPipe) userId: Types.ObjectId,
    @Req() req: { user: { sub: string; email: string; role: string } },
  ) {
    return this.portfolioService.getUserPortfolio(userId, req.user);
  }
}