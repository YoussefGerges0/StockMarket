import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, HydratedDocument } from 'mongoose';

export type NotificationDocument = HydratedDocument<Notification>;

export enum NotificationType {
  OTP_DELIVERY = 'otp_delivery',
  WALLET_CREDIT = 'wallet_credit',
  TRADE_EXECUTION = 'trade_execution',
  PRICE_ALERT = 'price_alert',
}

@Schema({ timestamps: true, versionKey: false, id: false })
export class Notification {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user!: Types.ObjectId;

  @Prop({ type: String, enum: NotificationType, required: true })
  type!: NotificationType;

  @Prop({ type: String, required: true })
  title!: string;

  @Prop({ type: String, required: true })
  message!: string;

  @Prop({ type: Boolean, default: false })
  isRead!: boolean;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

NotificationSchema.index({ user: 1, createdAt: -1 });
NotificationSchema.index({ type: 1 });