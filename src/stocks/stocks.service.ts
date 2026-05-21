import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Stock, StockDocument } from './schemas/stock.schema';
import { CreateStockDto } from './dto/create-stock.dto';
import { UpdateStockDto } from './dto/update-stock.dto';
import { toObjectId } from '../common/utils/object-id.utils';
import {StockPriceHistory,StockPriceHistoryDocument} from './schemas/stock-price-history.schema';
import { PriceAlertsService } from '../price-alerts/price-alerts.service';
@Injectable()
export class StocksService {
  constructor(
    @InjectModel(StockPriceHistory.name)
    private readonly stockPriceHistoryModel: Model<StockPriceHistoryDocument>,

    @InjectModel(Stock.name)private readonly stockModel: Model<StockDocument>,
    private readonly priceAlertsService: PriceAlertsService,
  ) {}

  async createStock(body: CreateStockDto) {
    const ticker = body.ticker.toUpperCase().trim();

    const existingStock = await this.stockModel.findOne({ ticker });

    if (existingStock) {
      throw new BadRequestException('Stock ticker already exists');
    }

    const stock = await this.stockModel.create({
      ticker,
      companyName: body.companyName,
      sector: body.sector,
      currentPrice: body.currentPrice,
      description: body.description,
      isListed: body.isListed ?? true,
    });

    return {
      message: 'Stock created successfully',
      stock,
    };
  }

async getAllStocks() {
  return this.stockModel
    .find()
    .populate({
      path: 'priceHistory',
      options: {
        sort: { changedAt: 1 },
      },
    })
    .sort({ createdAt: -1 });
}

async getListedStocks() {
  return this.stockModel
    .find({
      isListed: true,
    })
    .populate({
      path: 'priceHistory',
      options: {
        sort: { changedAt: 1 },
      },
    })
    .sort({ createdAt: -1 });
}

async getStockById(id: Types.ObjectId) {
  const stock = await this.stockModel
    .findById(id)
    .populate({
      path: 'priceHistory',
      options: {
        sort: { changedAt: 1 },
      },
    });

  if (!stock) {
    throw new NotFoundException('Stock not found');
  }

  return stock;
}


  async updateStock(
    id: Types.ObjectId,
    body: UpdateStockDto,
    changedBy?: string,
  ) {
    const oldStock = await this.stockModel.findById(id);

    if (!oldStock) {
      throw new NotFoundException('Stock not found');
    }

    if (body.ticker) {
      body.ticker = body.ticker.toUpperCase().trim();

      const existingStock = await this.stockModel.findOne({
        ticker: body.ticker,
        _id: {
          $ne: id,
        },
      });

      if (existingStock) {
        throw new BadRequestException('Stock ticker already exists');
      }
    }

    const oldPrice = oldStock.currentPrice;
    const newPrice = body.currentPrice;

    const stock = await this.stockModel.findByIdAndUpdate(id, body, {
      new: true,
    });

    if (!stock) {
      throw new NotFoundException('Stock not found');
    }

if (newPrice !== undefined && newPrice !== oldPrice) {
  await this.stockPriceHistoryModel.create({
    stock: stock._id,
    ticker: stock.ticker,
    oldPrice,
    newPrice,
    changedBy: changedBy ? toObjectId(changedBy) : null,
    changedAt: new Date(),
  });

  await this.priceAlertsService.checkPriceAlerts(
    stock._id,
    oldPrice,
    newPrice,
  );
}

    return {
      message: 'Stock updated successfully',
      stock,
    };
  }

  async delistStock(id: Types.ObjectId) {
    const stock = await this.stockModel.findByIdAndUpdate(
      id,
      {
        isListed: false,
      },
      {
        new: true,
      },
    );

    if (!stock) {
      throw new NotFoundException('Stock not found');
    }

    return {
      message: 'Stock delisted successfully',
      stock,
    };
  }

}