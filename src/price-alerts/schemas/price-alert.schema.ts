import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, HydratedDocument } from 'mongoose';

export type PriceAlertDocument = HydratedDocument<PriceAlert>;

export enum PriceAlertDirection {
  ABOVE = 'above',
  BELOW = 'below',
}

@Schema({ timestamps: true, versionKey: false, id: false })
export class PriceAlert {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Stock', required: true })
  stock!: Types.ObjectId;

  @Prop({ type: Number, required: true })
  targetPrice!: number;

  @Prop({ type: String, enum: PriceAlertDirection, required: true })
  direction!: PriceAlertDirection;

  @Prop({ type: Boolean, default: false })
  isTriggered!: boolean;

  @Prop({ type: Date, default: null })
  triggeredAt!: Date | null;
}

export const PriceAlertSchema = SchemaFactory.createForClass(PriceAlert);

PriceAlertSchema.index({ user: 1, stock: 1 });
PriceAlertSchema.index({ stock: 1, isTriggered: 1 });