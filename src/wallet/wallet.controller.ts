import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { WalletService } from './wallet.service';
import { WalletAmountDto } from './dto/wallet-amount.dto';
import { AuthGuard } from '../common/guards/jwt-auth.guard';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';
import { ParseDatePipe } from '../common/pipes/parse-date.pipe';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { UpdateWithdrawalStatusDto } from './dto/update-withdrawal-status.dto';
import { AdjustWalletDto } from './dto/adjust-wallet.dto';

@UseGuards(AuthGuard,RolesGuard)
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}



  @Roles(UserRole.SADMIN, UserRole.ADMIN, UserRole.SUPPORT)
  @Get('pending')
getPendingWithdrawals(
  @Req() req: { user: { sub: string; email: string; role: string } },
) {
  return this.walletService.getPendingWalletTransactions(req.user);
}


@Roles(UserRole.SADMIN, UserRole.ADMIN, UserRole.SUPPORT)
@Patch('withdrawals/:transactionId/status')
updateWithdrawalStatus(
  @Param('transactionId', ParseObjectIdPipe) transactionId: Types.ObjectId,
  @Body() body: UpdateWithdrawalStatusDto,
  @Req() req: { user: { sub: string; email: string; role: string } },
) {
  return this.walletService.updateWalletTransactionStatus(
    transactionId,
    body.status,
    req.user,
  );
}

@Roles(UserRole.SADMIN, UserRole.ADMIN)
@Patch('adjust/:userId')
adjustWalletBalance(
  @Param('userId', ParseObjectIdPipe) userId: Types.ObjectId,
  @Body() body: AdjustWalletDto,
  @Req() req: { user: { sub: string; email: string; role: string } },
) {
  return this.walletService.adjustWalletBalance(
    userId,
    body.amount,
    body.note,
    req.user,
  );
}

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