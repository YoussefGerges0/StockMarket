import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type OrderDocument = HydratedDocument<Order>;

export enum OrderSide {
  BUY = 'buy',
  SELL = 'sell',
}

export enum OrderStatus {
  EXECUTED = 'executed',
  REJECTED = 'rejected',
}

@Schema({
  timestamps: true,
  versionKey: false,
  id: false,
})
export class Order {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  user!: Types.ObjectId;

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
    type: String,
    enum: OrderSide,
    required: true,
  })
  side!: OrderSide;

  @Prop({
    type: Number,
    required: true,
    min: 1,
  })
  quantity!: number;

  @Prop({
    type: Number,
    required: true,
    min: 0,
  })
  priceAtExecution!: number;

  @Prop({
    type: Number,
    required: true,
    min: 0,
  })
  totalValue!: number;

  @Prop({
    type: String,
    enum: Object.values(OrderStatus),
    default: OrderStatus.EXECUTED,
  })
  status!: OrderStatus;

  @Prop({
    type: Number,
    default: null,
  })
  realizedProfitLoss!: number | null;

  @Prop({
    type: String,
    default: null,
  })
  rejectionReason!: string | null;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

OrderSchema.index({ user: 1, createdAt: -1 });
OrderSchema.index({ stock: 1, createdAt: -1 });
OrderSchema.index({ stock: 1, side: 1, createdAt: -1 });
OrderSchema.index({ side: 1, createdAt: -1 });
OrderSchema.index({ status: 1 });