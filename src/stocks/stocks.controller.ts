import { Body, Controller, Get, Param, Patch, Post,UseGuards } from '@nestjs/common';
import { Types } from 'mongoose';
import { StocksService } from './stocks.service';
import { CreateStockDto } from './dto/create-stock.dto';
import { UpdateStockDto } from './dto/update-stock.dto';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';
import { AuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';

@UseGuards(AuthGuard,RolesGuard)
@Controller('stocks')
export class StocksController {
  constructor(private readonly stocksService: StocksService) {}

  @Roles(UserRole.SADMIN,UserRole.ADMIN,UserRole.ANALYST)
  @Post()
  createStock(@Body() body: CreateStockDto) {
    return this.stocksService.createStock(body);
  }

  @Get()
  getAllStocks() {
    return this.stocksService.getAllStocks();
  }

  @Get('listed')
  getListedStocks() {
    return this.stocksService.getListedStocks();
  }

  @Get(':id')
  getStockById(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.stocksService.getStockById(id);
  }

  @Roles(UserRole.SADMIN,UserRole.ADMIN,UserRole.ANALYST)
  @Patch(':id')
  updateStock(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Body() body: UpdateStockDto,
  ) {
    return this.stocksService.updateStock(id, body);
  }

  @Roles(UserRole.SADMIN,UserRole.ADMIN,UserRole.ANALYST)
  @Patch(':id/delist')
  delistStock(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.stocksService.delistStock(id);
  }



}