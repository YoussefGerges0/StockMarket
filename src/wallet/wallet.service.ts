import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types,PipelineStage} from 'mongoose';
import { Wallet, WalletDocument } from './schemas/wallet.schema';
import {
  WalletTransaction,
  WalletTransactionDocument,
  WalletTransactionStatus,
  WalletTransactionType,
} from './schemas/wallet-transaction.schema';
import { User, UserDocument,UserRole,UserStatus } from '../users/schemas/user.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/schemas/notification.schema';

type BearerUser = {
  sub: string;
  email: string;
  role: string;
};

@Injectable()
export class WalletService {
  constructor(
    @InjectModel(Wallet.name)
    private readonly walletModel: Model<WalletDocument>,

    @InjectModel(WalletTransaction.name)
    private readonly walletTransactionModel: Model<WalletTransactionDocument>,

    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly notificationsService: NotificationsService,
  ) {}

  private checkUserAccess(userId: Types.ObjectId, bearer: BearerUser) {
    if (bearer.role !== UserRole.SADMIN &&bearer.role !== UserRole.SUPPORT && bearer.role !== UserRole.ADMIN && bearer.role !== UserRole.ANALYST && bearer.sub !== userId.toString()) {
      throw new ForbiddenException('You are not allowed to access this wallet');
    }
  }

  async getUserWallet(userId: Types.ObjectId, bearer: BearerUser) {
    this.checkUserAccess(userId, bearer);

    const wallet = await this.walletModel.findOne({
      user: userId,
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    return wallet;
  }

async deposit(userId: Types.ObjectId, amount: number, bearer: BearerUser) {
  if (bearer.sub !== userId.toString()) {
    throw new ForbiddenException('You are not allowed to access this wallet');
  }
  if(bearer.role !="investor"){
    throw new ForbiddenException('You are not allowed to deposit');}
  const user = await this.userModel.findById(userId);

  if (!user) {
    throw new NotFoundException('User not found');
  }

  if (user.status == UserStatus.PENDING ||user.status == UserStatus.SUSPENDED) {
    throw new ForbiddenException('Your account is not allowed to make deposits');
  }

  if (amount <= 0) {
    throw new BadRequestException('Amount must be greater than 0');
  }

  const wallet = await this.walletModel.findOne({
    user: userId,
  });

  if (!wallet) {
    throw new NotFoundException('Wallet not found');
  }

  const transaction = await this.walletTransactionModel.create({
    user: userId,
    wallet: wallet._id,
    type: WalletTransactionType.DEPOSIT,
    amount,
    status: WalletTransactionStatus.PENDING,
    description: 'Deposit request pending CMS approval',
  });

  return {
    message: 'Deposit request created successfully',
    wallet,
    transaction,
  };
}

  async requestWithdrawal(userId: Types.ObjectId,amount: number,bearer: BearerUser) {
        if (bearer.sub !== userId.toString()) {
      throw new ForbiddenException('You are not allowed to access this wallet');
    }

      if(bearer.role !="investor"){
    throw new ForbiddenException('You are not allowed to deposit');}

      const user = await this.userModel.findById(userId);
        if (!user) {
    throw new NotFoundException('User not found');
  }
      if (user.status == UserStatus.PENDING ||user.status == UserStatus.SUSPENDED) {
    throw new ForbiddenException('Your account is not allowed to make deposits');
  }
    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    const wallet = await this.walletModel.findOne({
      user: userId,
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    if (wallet.balance < amount) {
      throw new BadRequestException('Insufficient wallet balance');
    }

    //const holdingPeriodMs = 1;
const holdingPeriodMs = 48 * 60 * 60 * 1000;
    if (
      wallet.lastDepositAt &&
      Date.now() - wallet.lastDepositAt.getTime() < holdingPeriodMs
    ) {
      throw new BadRequestException(
        'Withdrawals are not allowed before 48 hours from the most recent deposit',
      );
    }

    wallet.balance -= amount;
    await wallet.save();

    const transaction = await this.walletTransactionModel.create({
      user: userId,
      wallet: wallet._id,
      type: WalletTransactionType.WITHDRAWAL,
      amount,
      status: WalletTransactionStatus.PENDING,
      description: 'Withdrawal request pending CMS approval',
    });

    return {
      message: 'Withdrawal request created successfully',
      wallet,
      transaction,
    };
  }

  async getUserTransactions(userId: Types.ObjectId,bearer: BearerUser,from?: Date,to?: Date) {
    this.checkUserAccess(userId, bearer);

    const filter: {
      user: Types.ObjectId;
      createdAt?: {
        $gte?: Date;
        $lte?: Date;
      };
    } = {
      user: userId,
    };

    if (from || to) {
      filter.createdAt = {};

      if (from) {
        filter.createdAt.$gte = from;
      }

      if (to) {
        filter.createdAt.$lte = to;
      }
    }

    return this.walletTransactionModel.find(filter).sort({
        createdAt: -1,
      });
  }
  async getPendingWalletTransactions(bearer: BearerUser) {
  if (
    bearer.role !== UserRole.SADMIN &&
    bearer.role !== UserRole.ADMIN &&
    bearer.role !== UserRole.SUPPORT

  ) {
    throw new ForbiddenException(
      'You are not allowed to access pending withdrawals',
    );
  }

  const pipeline: PipelineStage[] = [
  {
    '$match': {
      'status': 'pending'
    }
  }, {
    '$sort': {
      'createdAt': 1
    }
  }
]

  return this.walletTransactionModel.aggregate(pipeline).exec();
}

async updateWalletTransactionStatus(transactionId: Types.ObjectId,status: WalletTransactionStatus,bearer: BearerUser) {
  if (
    bearer.role !== UserRole.SADMIN &&
    bearer.role !== UserRole.ADMIN &&
    bearer.role !== UserRole.SUPPORT
  ) {
    throw new ForbiddenException(
      'You are not allowed to update wallet transaction status',
    );
  }

  if (status !== WalletTransactionStatus.COMPLETED &&status !== WalletTransactionStatus.REJECTED) {
    throw new BadRequestException(
      'Status must be either completed or rejected',
    );
  }

  const transaction = await this.walletTransactionModel.findById(transactionId);

  if (!transaction) {
    throw new NotFoundException('Wallet transaction not found');
  }

  if (transaction.status !== WalletTransactionStatus.PENDING) {
    throw new BadRequestException('Only pending transactions can be updated');
  }

  const wallet = await this.walletModel.findById(transaction.wallet);

  if (!wallet) {
    throw new NotFoundException('Wallet not found');
  }

  transaction.status = status;
  transaction.reviewedBy = new Types.ObjectId(bearer.sub);
  transaction.reviewedAt = new Date();

  if (transaction.type === WalletTransactionType.DEPOSIT) {
    if (status === WalletTransactionStatus.COMPLETED) {
      wallet.balance += transaction.amount;
      wallet.lastDepositAt = new Date();
      await wallet.save();

      const user = await this.userModel.findById(transaction.user);
      if (!user) {
    throw new NotFoundException('User not found');}

 await this.notificationsService.createNotification(
  transaction.user,
  user.email,
  user.name,
  NotificationType.WALLET_CREDIT,
  'Wallet credited',
  `Your wallet has been credited with ${transaction.amount}.`,
  `<html>
    <body>
      <h2>Wallet Credited</h2>
      <p>Your wallet has been credited with ${transaction.amount}.</p>
    </body>
  </html>`,
);

      transaction.description = 'Deposit approved';
      await transaction.save();

      return {
        message: 'Deposit approved successfully and amount added to wallet',
        wallet,
        transaction,
      };
    }

    transaction.description = 'Deposit rejected';
    await transaction.save();

    return {
      message: 'Deposit rejected successfully',
      wallet,
      transaction,
    };
  }

  if (transaction.type === WalletTransactionType.WITHDRAWAL) {
    if (status === WalletTransactionStatus.COMPLETED) {
      transaction.description = 'Withdrawal approved';
      await transaction.save();

      return {
        message: 'Withdrawal approved successfully',
        wallet,
        transaction,
      };
    }

    wallet.balance += transaction.amount;
    await wallet.save();

    transaction.description = 'Withdrawal rejected';
    await transaction.save();

    return {
      message: 'Withdrawal rejected and amount returned to wallet',
      wallet,
      transaction,
    };
  }

  throw new BadRequestException('This transaction type cannot be reviewed');
}





async adjustWalletBalance(userId: Types.ObjectId,amount: number,note: string,bearer: BearerUser) {
  if (
    bearer.role !== UserRole.SADMIN &&
    bearer.role !== UserRole.ADMIN
  ) {
    throw new ForbiddenException(
      'You are not allowed to manually adjust wallet balance',
    );
  }

  if (amount === 0) {
    throw new BadRequestException('Amount cannot be 0');
  }

  if (!note || note.trim() === '') {
    throw new BadRequestException('Justification note is required');
  }

  const user = await this.userModel.findById(userId);

  if (!user) {
    throw new NotFoundException('User not found');
  }

  const wallet = await this.walletModel.findOne({
    user: userId,
  });

  if (!wallet) {
    throw new NotFoundException('Wallet not found');
  }

  const newBalance = wallet.balance + amount;

  if (newBalance < 0) {
    throw new BadRequestException('Wallet balance cannot become negative');
  }

  wallet.balance = newBalance;
  await wallet.save();

  const transaction = await this.walletTransactionModel.create({
    user: userId,
    wallet: wallet._id,
    type: WalletTransactionType.ADJUSTMENT,
    amount: Math.abs(amount),
    status: WalletTransactionStatus.COMPLETED,
    description: note.trim(),
    reviewedBy: new Types.ObjectId(bearer.sub),
    reviewedAt: new Date(),
  });

  return {
    message: 'Wallet balance adjusted successfully',
    wallet,
    transaction,
  };
}


async getAdjustmentTransactions(bearer: BearerUser) {
  if (
    bearer.role !== UserRole.SADMIN &&
    bearer.role !== UserRole.ADMIN
  ) {
    throw new ForbiddenException(
      'You are not allowed to access adjustment transactions',
    );
  }

  return this.walletTransactionModel
    .find({
      type: WalletTransactionType.ADJUSTMENT,
    })
    .sort({
      createdAt: -1,
    });
}

}