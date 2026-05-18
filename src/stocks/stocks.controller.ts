import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { Types } from 'mongoose';
import { StocksService } from './stocks.service';
import { CreateStockDto } from './dto/create-stock.dto';
import { UpdateStockDto } from './dto/update-stock.dto';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';

@Controller('stocks')
export class StocksController {
  constructor(private readonly stocksService: StocksService) {}

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

  @Patch(':id')
  updateStock(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Body() body: UpdateStockDto,
  ) {
    return this.stocksService.updateStock(id, body);
  }

  @Patch(':id/delist')
  delistStock(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.stocksService.delistStock(id);
  }
}