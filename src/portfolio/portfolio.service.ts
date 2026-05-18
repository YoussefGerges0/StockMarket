import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  PortfolioPosition,
  PortfolioPositionDocument,
} from './schemas/portfolio.schema';
import { toObjectId } from '../common/utils/object-id.utils';
import { UserRole } from '../users/schemas/user.schema';

type BearerUser = {
  sub: string;
  email: string;
  role: string;
};

interface AddBuyToPortfolioInput {
  user: string;
  stock: string;
  ticker: string;
  quantity: number;
  price: number;
}

interface SellFromPortfolioInput {
  user: string;
  stock: string;
  quantity: number;
  price: number;
}

@Injectable()
export class PortfolioService {
  constructor(
    @InjectModel(PortfolioPosition.name)
    private readonly portfolioPositionModel: Model<PortfolioPositionDocument>,
  ) {}

  private checkUserAccess(userId: Types.ObjectId, bearer: BearerUser) {
    if (bearer.role !== UserRole.ADMIN && bearer.sub !== userId.toString()) {
      throw new ForbiddenException('You are not allowed to access this portfolio');
    }
  }

  async getUserPortfolio(userId: Types.ObjectId, bearer: BearerUser) {
    this.checkUserAccess(userId, bearer);

    const result = await this.portfolioPositionModel.aggregate([
      {
        $match: {
          user: userId,
        },
      },
      {
        $lookup: {
          from: 'stocks',
          localField: 'stock',
          foreignField: '_id',
          as: 'stockData',
        },
      },
      {
        $unwind: {
          path: '$stockData',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          user: 1,
          stock: 1,
          ticker: 1,
          quantity: 1,
          averageBuyPrice: 1,
          totalInvested: 1,
          currentPrice: {
            $ifNull: ['$stockData.currentPrice', 0],
          },
          marketValue: {
            $multiply: [
              '$quantity',
              {
                $ifNull: ['$stockData.currentPrice', 0],
              },
            ],
          },
          profitLoss: {
            $multiply: [
              '$quantity',
              {
                $subtract: [
                  {
                    $ifNull: ['$stockData.currentPrice', 0],
                  },
                  '$averageBuyPrice',
                ],
              },
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          positions: {
            $push: '$$ROOT',
          },
          totalMarketValue: {
            $sum: '$marketValue',
          },
          totalProfitLoss: {
            $sum: '$profitLoss',
          },
        },
      },
      {
        $project: {
          _id: 0,
          user: userId,
          totalMarketValue: 1,
          totalProfitLoss: 1,
          positions: 1,
        },
      },
    ]);

    if (result.length === 0) {
      return {
        user: userId,
        totalMarketValue: 0,
        totalProfitLoss: 0,
        positions: [],
      };
    }

    return result[0];
  }

  async addBuyToPortfolio(data: AddBuyToPortfolioInput) {
    if (data.quantity <= 0) {
      throw new BadRequestException('Quantity must be greater than 0');
    }

    if (data.price <= 0) {
      throw new BadRequestException('Price must be greater than 0');
    }

    const userObjectId = toObjectId(data.user);
    const stockObjectId = toObjectId(data.stock);

    const existingPosition = await this.portfolioPositionModel.findOne({
      user: userObjectId,
      stock: stockObjectId,
    });

    const buyValue = data.quantity * data.price;

    if (!existingPosition) {
      return this.portfolioPositionModel.create({
        user: userObjectId,
        stock: stockObjectId,
        ticker: data.ticker,
        quantity: data.quantity,
        averageBuyPrice: data.price,
        totalInvested: buyValue,
      });
    }

    const newQuantity = existingPosition.quantity + data.quantity;
    const newTotalInvested = existingPosition.totalInvested + buyValue;
    const newAverageBuyPrice = newTotalInvested / newQuantity;

    existingPosition.quantity = newQuantity;
    existingPosition.totalInvested = newTotalInvested;
    existingPosition.averageBuyPrice = newAverageBuyPrice;

    return existingPosition.save();
  }

  async sellFromPortfolio(data: SellFromPortfolioInput) {
    if (data.quantity <= 0) {
      throw new BadRequestException('Quantity must be greater than 0');
    }

    if (data.price <= 0) {
      throw new BadRequestException('Price must be greater than 0');
    }

    const userObjectId = toObjectId(data.user);
    const stockObjectId = toObjectId(data.stock);

    const position = await this.portfolioPositionModel.findOne({
      user: userObjectId,
      stock: stockObjectId,
    });

    if (!position) {
      throw new NotFoundException('Open position not found');
    }

    if (position.quantity < data.quantity) {
      throw new BadRequestException('Not enough shares to sell');
    }

    const realizedProfitLoss =
      (data.price - position.averageBuyPrice) * data.quantity;

    const remainingQuantity = position.quantity - data.quantity;

    if (remainingQuantity === 0) {
      position.quantity = 0;
      position.totalInvested = 0;
    } else {
      position.quantity = remainingQuantity;
      position.totalInvested = position.averageBuyPrice * remainingQuantity;
    }

    await position.save();

    return {
      position,
      realizedProfitLoss,
    };
  }
}