import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Order,
  OrderDocument,
  OrderSide,
  OrderStatus,
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

    private readonly portfolioService: PortfolioService,
  ) {}

  async buyStock(userId: string, ticker: string, quantity: number) {
    if (quantity <= 0) {
      throw new BadRequestException('Quantity must be greater than 0');
    }

    const userObjectId = toObjectId(userId);
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
      side: OrderSide.BUY,
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

    return {
      message: 'Buy order executed successfully',
      order,
      walletBalance: wallet.balance,
    };
  }

  async sellStock(userId: string, ticker: string, quantity: number) {
    if (quantity <= 0) {
      throw new BadRequestException('Quantity must be greater than 0');
    }

    const userObjectId = toObjectId(userId);
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
      side: OrderSide.SELL,
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

    return {
      message: 'Sell order executed successfully',
      order,
      walletBalance: wallet.balance,
      realizedProfitLoss: portfolioResult.realizedProfitLoss,
    };
  }

  async getUserOrders(userId: Types.ObjectId) {
    return this.orderModel
      .find({
        user: userId,
      })
      .sort({
        createdAt: -1,
      });
  }

  async getOrderById(id: Types.ObjectId) {
    const order = await this.orderModel.findById(id);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }
}