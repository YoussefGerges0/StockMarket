import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PortfolioPositionDocument = HydratedDocument<PortfolioPosition>;



@Schema({
  timestamps: true,
  versionKey: false,
  id: false,
})
export class PortfolioPosition {
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
    type: Number,
    required: true,
    min: 0,
  })
  quantity!: number;

  @Prop({
    type: Number,
    required: true,
    min: 0,
  })
  averageBuyPrice!: number;

  @Prop({
    type: Number,
    required: true,
    min: 0,
  })
  totalInvested!: number;



}

export const PortfolioPositionSchema =
  SchemaFactory.createForClass(PortfolioPosition);

PortfolioPositionSchema.index({ user: 1, stock: 1}, { unique: true });
PortfolioPositionSchema.index({ user: 1 });
PortfolioPositionSchema.index({ stock: 1});