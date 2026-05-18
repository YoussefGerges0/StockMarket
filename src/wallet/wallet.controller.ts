import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { WalletService } from './wallet.service';
import { WalletAmountDto } from './dto/wallet-amount.dto';
import { AuthGuard } from '../common/guards/jwt-auth.guard';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';
import { ParseDatePipe } from '../common/pipes/parse-date.pipe';

@UseGuards(AuthGuard)
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get(':userId')
  getUserWallet(
    @Param('userId', ParseObjectIdPipe) userId: Types.ObjectId,
    @Req() req: { user: { sub: string; email: string; role: string } },
  ) {
    return this.walletService.getUserWallet(userId, req.user);
  }

  @Post('/deposit/:userId')
  deposit(
    @Param('userId', ParseObjectIdPipe) userId: Types.ObjectId,
    @Body() body: WalletAmountDto,
    @Req() req: { user: { sub: string; email: string; role: string } },
  ) {
    return this.walletService.deposit(userId, body.amount, req.user);
  }

  @Post('/withdraw/:userId')
  requestWithdrawal(
    @Param('userId', ParseObjectIdPipe) userId: Types.ObjectId,
    @Body() body: WalletAmountDto,
    @Req() req: { user: { sub: string; email: string; role: string } },
  ) {
    return this.walletService.requestWithdrawal(userId, body.amount, req.user);
  }

  @Get('/transactions/:userId')
  getUserTransactions(
    @Param('userId', ParseObjectIdPipe) userId: Types.ObjectId,
    @Query('from', ParseDatePipe) from: Date | undefined,
    @Query('to', ParseDatePipe) to: Date | undefined,
    @Req() req: { user: { sub: string; email: string; role: string } },
  ) {
    return this.walletService.getUserTransactions(userId, req.user, from, to);
  }
}