import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { OrdersService } from './orders.service';
import { CreateBuyOrderDto } from './dto/create-buy-order.dto';
import { CreateSellOrderDto } from './dto/create-sell-order.dto';
import { AuthGuard } from '../common/guards/jwt-auth.guard';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';

@UseGuards(AuthGuard, RolesGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}



  @Roles(UserRole.INVESTOR)
  @Post('/buy/:stockTicker')
  buyStock(
    @Param('stockTicker') stockTicker: string,
    @Body() body: CreateBuyOrderDto,
    @Req() req: { user: { sub: string; email: string; role: string } },
  ) {
    return this.ordersService.buyStock(
      req.user,
      stockTicker,
      body.quantity,
    );
  }


@Roles(UserRole.INVESTOR)
  @Post('/sell/:stockTicker')
  sellStock(
    @Param('stockTicker') stockTicker: string,
    @Body() body: CreateSellOrderDto,
    @Req() req: { user: { sub: string; email: string; role: string } },
  ) {
    return this.ordersService.sellStock(
      req.user,
      stockTicker,
      body.quantity,
    );
  }


@Roles(UserRole.INVESTOR,UserRole.SADMIN,UserRole.ADMIN,UserRole.SUPPORT,UserRole.ANALYST)
  @Get('/user/:userId')
  getUserOrders(
    @Param('userId', ParseObjectIdPipe) userId: Types.ObjectId,
    @Req() req: { user: { sub: string; email: string; role: string } },) {
    return this.ordersService.getUserOrders(userId,req.user);
  }

@Roles(UserRole.INVESTOR,UserRole.SADMIN,UserRole.ADMIN,UserRole.SUPPORT,UserRole.ANALYST)
  @Get('/:id')
  getOrderById(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
  @Req() req: { user: { sub: string; email: string; role: string } }) {
    return this.ordersService.getOrderById(id,req.user);
  }


}