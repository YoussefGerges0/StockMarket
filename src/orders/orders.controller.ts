import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { OrdersService } from './orders.service';
import { CreateBuyOrderDto } from './dto/create-buy-order.dto';
import { CreateSellOrderDto } from './dto/create-sell-order.dto';
import { AuthGuard } from '../common/guards/jwt-auth.guard';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';

@UseGuards(AuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('/buy/:stockTicker')
  buyStock(
    @Param('stockTicker') stockTicker: string,
    @Body() body: CreateBuyOrderDto,
    @Req() req: { user: { sub: string; email: string; role: string } },
  ) {
    return this.ordersService.buyStock(
      req.user.sub,
      stockTicker,
      body.quantity,
    );
  }

  @Post('/sell/:stockTicker')
  sellStock(
    @Param('stockTicker') stockTicker: string,
    @Body() body: CreateSellOrderDto,
    @Req() req: { user: { sub: string; email: string; role: string } },
  ) {
    return this.ordersService.sellStock(
      req.user.sub,
      stockTicker,
      body.quantity,
    );
  }

  @Get('/user/:userId')
  getUserOrders(
    @Param('userId', ParseObjectIdPipe) userId: Types.ObjectId,) {
    return this.ordersService.getUserOrders(userId);
  }

  @Get('/single/:id')
  getOrderById(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,) {
    return this.ordersService.getOrderById(id);
  }
}