import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Wallet, WalletDocument } from './schemas/wallet.schema';
import {
  WalletTransaction,
  WalletTransactionDocument,
  WalletTransactionStatus,
  WalletTransactionType,
} from './schemas/wallet-transaction.schema';
import { User, UserDocument, UserRole } from '../users/schemas/user.schema';

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
  ) {}

  private checkUserAccess(userId: Types.ObjectId, bearer: BearerUser) {
    if (bearer.role !== UserRole.ADMIN && bearer.sub !== userId.toString()) {
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
    this.checkUserAccess(userId, bearer);

    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    let wallet = await this.walletModel.findOne({
      user: userId,
    });

 if (!wallet) {
  throw new NotFoundException('Wallet not found');
}

    wallet.balance += amount;
    wallet.lastDepositAt = new Date();

    await wallet.save();

    const transaction = await this.walletTransactionModel.create({
      user: userId,
      wallet: wallet._id,
      type: WalletTransactionType.DEPOSIT,
      amount,
      status: WalletTransactionStatus.COMPLETED,
      description: 'Wallet deposit',
    });

    return {
      message: 'Deposit completed successfully',
      wallet,
      transaction,
    };
  }

  async requestWithdrawal(userId: Types.ObjectId,amount: number,bearer: BearerUser) {
    this.checkUserAccess(userId, bearer);

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

    return this.walletTransactionModel
      .find(filter)
      .sort({
        createdAt: -1,
      });
  }
}