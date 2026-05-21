import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Order,
  OrderDocument,
  OrderStatus,
  OrderType,
} from './schemas/order.schema';
import { Stock, StockDocument } from '../stocks/schemas/stock.schema';
import { Wallet, WalletDocument } from '../wallet/schemas/wallet.schema';
import {
  WalletTransaction,
  WalletTransactionDocument,
  WalletTransactionStatus,
  WalletTransactionType,
} from '../wallet/schemas/wallet-transaction.schema';
import { PortfolioService } from '../portfolio/portfolio.service';
import { toObjectId } from '../common/utils/object-id.utils';
import { User,UserDocument,UserRole,UserStatus } from '../users/schemas/user.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/schemas/notification.schema';
type BearerUser = {
  sub: string;
  email: string;
  role: string;
};

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,

    @InjectModel(Stock.name)
    private readonly stockModel: Model<StockDocument>,

    @InjectModel(Wallet.name)
    private readonly walletModel: Model<WalletDocument>,

    @InjectModel(WalletTransaction.name)
    private readonly walletTransactionModel: Model<WalletTransactionDocument>,

    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,

    private readonly portfolioService: PortfolioService,
    private readonly notificationsService: NotificationsService,
  ) {}



    private checkUserAccess(userId: Types.ObjectId, bearer: BearerUser) {
      if (bearer.role !== UserRole.SADMIN &&bearer.role !== UserRole.SUPPORT && bearer.role !== UserRole.ADMIN && bearer.role !== UserRole.ANALYST && bearer.sub !== userId.toString()) {
        throw new ForbiddenException('You are not allowed to access ');
      }
    }

  
  async buyStock(bearer: BearerUser, ticker: string, quantity: number) {
    if (quantity <= 0) {
      throw new BadRequestException('Quantity must be greater than 0');
    }

      const user = await this.userModel.findById(bearer.sub);
            if (!user) {
        throw new NotFoundException('User not found');
      }
        if(user.role!=="investor"){
          throw new ForbiddenException('Your account is not allowed to buy stock');
        }
          if (user.status == UserStatus.PENDING ||user.status == UserStatus.SUSPENDED) {
        throw new ForbiddenException('Your account is not allowed to buy stock');
      }

    const userObjectId = toObjectId(bearer.sub);
    const normalizedTicker = ticker.toUpperCase().trim();

    const stock = await this.stockModel.findOne({
      ticker: normalizedTicker,
    });

    if (!stock) {
      throw new NotFoundException('Stock not found');
    }

    if (!stock.isListed) {
      throw new BadRequestException('This stock is delisted');
    }

    const wallet = await this.walletModel.findOne({
      user: userObjectId,
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    const priceAtExecution = stock.currentPrice;
    const totalValue = priceAtExecution * quantity;

    if (wallet.balance < totalValue) {
      throw new BadRequestException('Insufficient wallet balance');
    }

    wallet.balance -= totalValue;
    await wallet.save();

    await this.portfolioService.addBuyToPortfolio({
      user: userObjectId.toString(),
      stock: stock._id.toString(),
      ticker: stock.ticker,
      quantity,
      price: priceAtExecution,
    });

    const order = await this.orderModel.create({
      user: userObjectId,
      stock: stock._id,
      ticker: stock.ticker,
      orderType: OrderType.BUY,
      quantity,
      priceAtExecution,
      totalValue,
      status: OrderStatus.EXECUTED,
      realizedProfitLoss: null,
      rejectionReason: null,
    });

    await this.walletTransactionModel.create({
      user: userObjectId,
      wallet: wallet._id,
      type: WalletTransactionType.BUY,
      amount: totalValue,
      status: WalletTransactionStatus.COMPLETED,
      description: `Bought ${quantity} shares of ${stock.ticker}`,
    });

await this.notificationsService.createNotification(
  userObjectId,
  user.email,
  user.name,
  NotificationType.TRADE_EXECUTION,
  'Buy order executed',
  `Your buy order for ${quantity} shares of ${ticker} was executed successfully.`,
  `<html>
    <body>
      <h2>Buy Order Executed</h2>
      <p>Your buy order for ${quantity} shares of ${ticker} was executed successfully.</p>
    </body>
  </html>`,
);
    return {
      message: 'Buy order executed successfully',
      order,
      walletBalance: wallet.balance,
    };
  }

  async sellStock(bearer: BearerUser, ticker: string, quantity: number) {
    if (quantity <= 0) {
      throw new BadRequestException('Quantity must be greater than 0');
    }

          const user = await this.userModel.findById(bearer.sub);
            if (!user) {
        throw new NotFoundException('User not found');
      }
              if(user.role!=="investor"){
          throw new ForbiddenException('Your account is not allowed to sell stock');
        }

          if (user.status == UserStatus.PENDING ||user.status == UserStatus.SUSPENDED) {
        throw new ForbiddenException('Your account is not allowed to sell stock');
      }
    
    const userObjectId = toObjectId(bearer.sub);
    const normalizedTicker = ticker.toUpperCase().trim();

    const stock = await this.stockModel.findOne({
      ticker: normalizedTicker,
    });

    if (!stock) {
      throw new NotFoundException('Stock not found');
    }

    const wallet = await this.walletModel.findOne({
      user: userObjectId,
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    const priceAtExecution = stock.currentPrice;
    const totalValue = priceAtExecution * quantity;

    const portfolioResult = await this.portfolioService.sellFromPortfolio({
      user: userObjectId.toString(),
      stock: stock._id.toString(),
      quantity,
      price: priceAtExecution,
    });

    wallet.balance += totalValue;
    await wallet.save();

    const order = await this.orderModel.create({
      user: userObjectId,
      stock: stock._id,
      ticker: stock.ticker,
      orderType: OrderType.SELL,
      quantity,
      priceAtExecution,
      totalValue,
      status: OrderStatus.EXECUTED,
      realizedProfitLoss: portfolioResult.realizedProfitLoss,
      rejectionReason: null,
    });

    await this.walletTransactionModel.create({
      user: userObjectId,
      wallet: wallet._id,
      type: WalletTransactionType.SELL,
      amount: totalValue,
      status: WalletTransactionStatus.COMPLETED,
      description: `Sold ${quantity} shares of ${stock.ticker}`,
    });


await this.notificationsService.createNotification(
  userObjectId,
  user.email,
  user.name,
  NotificationType.TRADE_EXECUTION,
  'Sell order executed',
  `Your sell order for ${quantity} shares of ${ticker} was executed successfully.`,
  `<html>
    <body>
      <h2>Sell Order Executed</h2>
      <p>Your sell order for ${quantity} shares of ${ticker} was executed successfully.</p>
    </body>
  </html>`,
);

    return {
      message: 'Sell order executed successfully',
      order,
      walletBalance: wallet.balance,
      realizedProfitLoss: portfolioResult.realizedProfitLoss,
    };
  }

  async getUserOrders(userId: Types.ObjectId,bearer: BearerUser) {
     this.checkUserAccess(userId, bearer);
    return this.orderModel
      .find({
        user: userId,
      })
      .sort({
        createdAt: -1,
      });
  }

async getOrderById(id: Types.ObjectId, bearer: BearerUser) {
  const order = await this.orderModel.findById(id);

  if (!order) {
    throw new NotFoundException('Order not found');
  }

  this.checkUserAccess(order.user, bearer);

  return order;
}
}