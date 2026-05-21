import {BadRequestException,ForbiddenException,Injectable,NotFoundException,UnauthorizedException} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  PriceAlert,
  PriceAlertDirection,
  PriceAlertDocument,
} from './schemas/price-alert.schema';
import { Stock, StockDocument } from '../stocks/schemas/stock.schema';
import { User, UserDocument, UserRole } from '../users/schemas/user.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/schemas/notification.schema';

type BearerUser = {
  sub: string;
  email: string;
  role: string;
};

@Injectable()
export class PriceAlertsService {
  constructor(
    @InjectModel(PriceAlert.name)
    private readonly priceAlertModel: Model<PriceAlertDocument>,

    @InjectModel(Stock.name)
    private readonly stockModel: Model<StockDocument>,

    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,

    private readonly notificationsService: NotificationsService,
  ) {}

  async createPriceAlert(
    stockId: Types.ObjectId,
    targetPrice: number,
    direction: PriceAlertDirection,
    bearer: BearerUser,
  ) {
    if (bearer.role !== UserRole.INVESTOR) {
      throw new ForbiddenException('Only investors can create price alerts');
    }

    const stock = await this.stockModel.findById(stockId);

    if (!stock) {
      throw new NotFoundException('Stock not found');
    }

    if (!stock.isListed) {
      throw new BadRequestException('You cannot create an alert for delisted stock');
    }

    const alert = await this.priceAlertModel.create({
      user: new Types.ObjectId(bearer.sub),
      stock: stockId,
      targetPrice,
      direction,
    });

    return {
      message: 'Price alert created successfully',
      alert,
    };
  }

  async checkPriceAlerts(
    stockId: Types.ObjectId,
    oldPrice: number,
    newPrice: number,
  ) {
    const alerts = await this.priceAlertModel.find({
      stock: stockId,
      isTriggered: false,
    });

    const stock = await this.stockModel.findById(stockId);

    if (!stock) {
      return;
    }

    for (const alert of alerts) {
      const crossedAbove =
        alert.direction === PriceAlertDirection.ABOVE &&
        oldPrice < alert.targetPrice &&
        newPrice >= alert.targetPrice;

      const crossedBelow =
        alert.direction === PriceAlertDirection.BELOW &&
        oldPrice > alert.targetPrice &&
        newPrice <= alert.targetPrice;

      if (!crossedAbove && !crossedBelow) {
        continue;
      }

      const user = await this.userModel.findById(alert.user);

      if (!user) {
        continue;
      }

      alert.isTriggered = true;
      alert.triggeredAt = new Date();
      await alert.save();

      await this.notificationsService.createNotification(
        user._id,
        user.email,
        user.name,
        NotificationType.PRICE_ALERT,
        'Price alert triggered',
        `${stock.ticker} crossed your target price of ${alert.targetPrice}.`,
        `<html>
          <body>
            <h2>Price Alert Triggered</h2>
            <p>${stock.ticker} crossed your target price of ${alert.targetPrice}.</p>
            <p>Current price: ${newPrice}</p>
          </body>
        </html>`,
      );
    }
  }

  async getAllPriceAlertsByUserId(
  userId: Types.ObjectId,
  bearer: { sub: string; email: string; role: string },
) {
  if (!bearer) {
    throw new UnauthorizedException('Missing authenticated user');
  }

  if (
    bearer.role === UserRole.INVESTOR &&
    bearer.sub !== userId.toString()
  ) {
    throw new ForbiddenException(
      'Investors can only access their own price alerts',
    );
  }

  const alerts = await this.priceAlertModel
    .find({
      user: userId,
    })
    .populate('stock', 'ticker companyName currentPrice')
    .sort({
      createdAt: -1,
    });

  return {
    message: 'Price alerts retrieved successfully',
    alerts,
  };
}


async removePriceAlert(
  alertId: Types.ObjectId,
  bearer: { sub: string; email: string; role: string },
) {
  if (!bearer) {
    throw new UnauthorizedException('Missing authenticated user');
  }

  if (bearer.role !== UserRole.INVESTOR) {
    throw new ForbiddenException('Only investors can delete price alerts');
  }

  const alert = await this.priceAlertModel.findById(alertId);

  if (!alert) {
    throw new NotFoundException('Price alert not found');
  }

  if (alert.user.toString() !== bearer.sub) {
    throw new ForbiddenException(
      'Investors can only delete their own price alerts',
    );
  }

  await this.priceAlertModel.findByIdAndDelete(alertId);

  return {
    message: 'Price alert removed successfully',
  };
}

}