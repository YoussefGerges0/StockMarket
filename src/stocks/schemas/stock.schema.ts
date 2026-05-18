import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type StockDocument = HydratedDocument<Stock>;

@Schema({
  timestamps: true,
  versionKey: false,
  id: false,
})
export class Stock {
  @Prop({ type: String, required: true, uppercase: true, trim: true })
  ticker!: string;

  @Prop({ type: String, required: true, trim: true })
  companyName!: string;

  @Prop({ type: String, required: true, trim: true })
  sector!: string;

  @Prop({ type: Number, required: true, min: 0 })
  currentPrice!: number;

  @Prop({ type: String, required: true, trim: true })
  description!: string;

  @Prop({ type: Boolean, default: true })
  isListed!: boolean;
}

export const StockSchema = SchemaFactory.createForClass(Stock);

StockSchema.index({ ticker: 1 }, { unique: true });
StockSchema.index({ sector: 1 });
StockSchema.index({ isListed: 1 });
StockSchema.index({ sector: 1, isListed: 1 });
StockSchema.index({ createdAt: -1 });