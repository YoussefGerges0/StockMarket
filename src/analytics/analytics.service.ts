import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';
import {Order,OrderDocument,OrderStatus} from '../orders/schemas/order.schema';
import { Wallet, WalletDocument } from '../wallet/schemas/wallet.schema';
import {PortfolioPosition,PortfolioPositionDocument} from '../portfolio/schemas/portfolio.schema';
import { User, UserDocument, UserRole } from '../users/schemas/user.schema';
import {WalletTransaction,WalletTransactionDocument,WalletTransactionStatus,WalletTransactionType} from '../wallet/schemas/wallet-transaction.schema';
type Granularity = 'day' | 'month';

@Injectable()
export class AnalyticsService {
constructor(
  @InjectModel(Order.name)private readonly orderModel: Model<OrderDocument>,

  @InjectModel(Wallet.name)private readonly walletModel: Model<WalletDocument>,
  @InjectModel(PortfolioPosition.name)private readonly portfolioPositionModel: Model<PortfolioPositionDocument>,
  @InjectModel(User.name)private readonly userModel: Model<UserDocument>,
  @InjectModel(WalletTransaction.name)private readonly walletTransactionModel: Model<WalletTransactionDocument>,
 ) {}




  async getVolume(stockId:Types.ObjectId,granularity: Granularity,from: Date|undefined,to:Date|undefined) {
    if (!from || !to) {
      throw new BadRequestException('from and to dates are required');
    }

    if (granularity != 'day' && granularity != 'month') {
      throw new BadRequestException('granularity must be day or month');
    }

    const dateFormat = granularity == 'day' ? '%Y-%m-%d' : '%Y-%m';

    const pipeline: PipelineStage[] = [
      {
        $match: {
          stock: stockId,
          status:"executed",
          createdAt: {
            $gte: from,
            $lte: to,
          },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: dateFormat,
              date: '$createdAt',
            },
          },
          sharesTraded: {
            $sum: '$quantity',
          },
          totalValue: {
            $sum: '$totalValue',
          },
        },
      },
      {
        $project: {
          _id: 0,
          date: '$_id',
          sharesTraded: 1,
          totalValue: 1,
        },
      },
      {
        $sort: {
          date: 1,
        },
      },
    ];

    return this.orderModel.aggregate(pipeline).exec();
  }



  async getTopTradedStocks(limit: number, page: number) {
  if (!Number.isInteger(limit) || limit < 1) {
    throw new BadRequestException('limit must be a positive number');
  }

  if (!Number.isInteger(page) || page < 1) {
    throw new BadRequestException('page must be a positive number');
  }

  const skip = (page - 1) * limit;

  const pipeline: PipelineStage[] = [
    {
      $match: {
        status: 'executed',
      },
    },
    {
      $group: {
        _id: '$stock',
        ticker: {
          $first: '$ticker',
        },
        tradeCount: {
          $sum: 1,
        },
        totalVolume: {
          $sum: '$quantity',
        },
      },
    },
    {
      $sort: {
        tradeCount: -1,
        totalVolume: -1,
      },
    },
    {
      $facet: {
        data: [
          {
            $skip: skip,
          },
          {
            $limit: limit,
          },
          {
            $lookup: {
              from: 'stocks',
              localField: '_id',
              foreignField: '_id',
              as: 'stockData',
            },
          },
          {
            $unwind: '$stockData',
          },
          {
            $project: {
              _id: 0,
              stockId: '$_id',
              ticker: 1,
              companyName: '$stockData.companyName',
              tradeCount: 1,
              totalVolume: 1,
            },
          },
        ],
        meta: [
          {
            $count: 'totalStocks',
          },
        ],
      },
    },
    {
      $project: {
        data: 1,
        totalStocks: {
          $ifNull: [
            {
              $arrayElemAt: ['$meta.totalStocks', 0],
            },
            0,
          ],
        },
      },
    },
    {
      $project: {
        data: 1,
        meta: {
          totalStocks: '$totalStocks',
          page: {
            $literal: page,
          },
          limit: {
            $literal: limit,
          },
          totalPages: {
            $ceil: {
              $divide: ['$totalStocks', limit],
            },
          },
          hasNextPage: {
            $gt: [
              '$totalStocks',
              page * limit,
            ],
          },
        },
      },
    },
  ];

  const result = await this.orderModel.aggregate(pipeline).exec();

  return result[0];
}


async getAum() {
  const walletPipeline: PipelineStage[] = [
    {
      $group: {
        _id: null,
        totalWalletBalances: {
          $sum: '$balance',
        },
      },
    },
  ];

  const portfolioPipeline: PipelineStage[] = [
    {
      $lookup: {
        from: 'stocks',
        localField: 'stock',
        foreignField: '_id',
        as: 'stockData',
      },
    },
    {
      $unwind: '$stockData',
    },
    {
      $group: {
        _id: null,
        totalPortfolioValue: {
          $sum: {
            $multiply: ['$quantity', '$stockData.currentPrice'],
          },
        },
      },
    },
  ];

  const walletResult = await this.walletModel.aggregate(walletPipeline).exec();

  const portfolioResult = await this.portfolioPositionModel
    .aggregate(portfolioPipeline)
    .exec();

  const totalWalletBalances = walletResult[0]?.totalWalletBalances ?? 0;
  const totalPortfolioValue = portfolioResult[0]?.totalPortfolioValue ?? 0;

  return {
    totalAum: totalWalletBalances + totalPortfolioValue,
    totalWalletBalances,
    totalPortfolioValue,
  };
}



async getMostActiveMembers(days: number, limit: number) {
  if (!Number.isInteger(days) || days < 1) {
    throw new BadRequestException('days must be a positive number');
  }

  if (!Number.isInteger(limit) || limit < 1) {
    throw new BadRequestException('limit must be a positive number');
  }

  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);

  const pipeline: PipelineStage[] = [
    {
      $match: {
        status: 'executed',
        createdAt: {
          $gte: fromDate,
        },
      },
    },
    {
      $group: {
        _id: '$user',
        tradeCount: {
          $sum: 1,
        },
      },
    },
    {
      $sort: {
        tradeCount: -1,
      },
    },
    {
      $limit: limit,
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'member',
      },
    },
    {
      $unwind: '$member',
    },
    {
      $project: {
        _id: 0,
        memberId: '$_id',
        displayName: '$member.name',
        tradeCount: 1,
      },
    },
  ];

  return this.orderModel.aggregate(pipeline).exec();
}



async getSectorAllocation() {
  const walletPipeline: PipelineStage[] = [
    {
      $group: {
        _id: null,
        totalWalletBalances: {
          $sum: '$balance',
        },
      },
    },
  ];

  const sectorPipeline: PipelineStage[] = [
    {
      $match: {
        quantity: {
          $gt: 0,
        },
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
      $unwind: '$stockData',
    },
    {
      $project: {
        sector: '$stockData.sector',
        positionValue: {
          $multiply: ['$quantity', '$stockData.currentPrice'],
        },
      },
    },
    {
      $group: {
        _id: '$sector',
        sectorValue: {
          $sum: '$positionValue',
        },
      },
    },
    {
      $sort: {
        sectorValue: -1,
      },
    },
  ];

  const walletResult = await this.walletModel.aggregate(walletPipeline).exec();

  const sectors = await this.portfolioPositionModel
    .aggregate(sectorPipeline)
    .exec();

  const totalWalletBalances = walletResult[0]?.totalWalletBalances ?? 0;

  const totalPortfolioValue = sectors.reduce(
    (sum, sector) => sum + sector.sectorValue,
    0,
  );

  const totalAum = totalWalletBalances + totalPortfolioValue;

  return sectors.map((sector) => ({
    sector: sector._id,
    sectorValue: sector.sectorValue,
    percentageOfAum: totalAum === 0 ? 0 : (sector.sectorValue / totalAum) * 100,
  }));
}


async getMembersGrowth() {
  const now = new Date();

  const currentMonthStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    1,
  );

  const nextMonthStart = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    1,
  );

  const previousMonthStart = new Date(
    now.getFullYear(),
    now.getMonth() - 1,
    1,
  );

  const pipeline: PipelineStage[] = [
    {
      $match: {
        role: UserRole.INVESTOR,
      },
    },
    {
      $facet: {
        totalMembers: [
          {
            $count: 'count',
          },
        ],
        currentMonthMembers: [
          {
            $match: {
              createdAt: {
                $gte: currentMonthStart,
                $lt: nextMonthStart,
              },
            },
          },
          {
            $count: 'count',
          },
        ],
        previousMonthMembers: [
          {
            $match: {
              createdAt: {
                $gte: previousMonthStart,
                $lt: currentMonthStart,
              },
            },
          },
          {
            $count: 'count',
          },
        ],
      },
    },
    {
      $project: {
        totalRegisteredMembers: {
          $ifNull: [
            {
              $arrayElemAt: ['$totalMembers.count', 0],
            },
            0,
          ],
        },
        currentMonthRegisteredMembers: {
          $ifNull: [
            {
              $arrayElemAt: ['$currentMonthMembers.count', 0],
            },
            0,
          ],
        },
        previousMonthRegisteredMembers: {
          $ifNull: [
            {
              $arrayElemAt: ['$previousMonthMembers.count', 0],
            },
            0,
          ],
        },
      },
    },
    {
      $project: {
        totalRegisteredMembers: 1,
        currentMonthRegisteredMembers: 1,
        previousMonthRegisteredMembers: 1,
        monthOverMonthGrowthRate: {
          $cond: [
            {
              $eq: ['$previousMonthRegisteredMembers', 0],
            },
            0,
            {
              $multiply: [
                {
                  $divide: [
                    {
                      $subtract: [
                        '$currentMonthRegisteredMembers',
                        '$previousMonthRegisteredMembers',
                      ],
                    },
                    '$previousMonthRegisteredMembers',
                  ],
                },
                100,
              ],
            },
          ],
        },
      },
    },
  ];

  const result = await this.userModel.aggregate(pipeline).exec();

  return result[0];
}


async getPendingWithdrawalsCount() {
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
}





