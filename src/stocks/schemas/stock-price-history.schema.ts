import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type StockPriceHistoryDocument = HydratedDocument<StockPriceHistory>;

@Schema({
  timestamps: true,
  versionKey: false,
  id: false,
})
export class StockPriceHistory {
  @Prop({
    type: Types.ObjectId,
    ref: 'Stock',
    required: true,
  })
  stock!: Types.ObjectId;

  @Prop({
    type: String,
    required: true,
    uppercase: true,
    trim: true,
  })
  ticker!: string;

  @Prop({
    type: Number,
    required: true,
    min: 0,
  })
  oldPrice!: number;

  @Prop({
    type: Number,
    required: true,
    min: 0,
  })
  newPrice!: number;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    default: null,
  })
  changedBy!: Types.ObjectId | null;

  @Prop({
    type: Date,
    default: Date.now,
  })
  changedAt!: Date;
}

export const StockPriceHistorySchema =
  SchemaFactory.createForClass(StockPriceHistory);

StockPriceHistorySchema.index({ stock: 1, changedAt: -1 });
StockPriceHistorySchema.index({ ticker: 1, changedAt: -1 });
StockPriceHistorySchema.index({ changedAt: -1 });