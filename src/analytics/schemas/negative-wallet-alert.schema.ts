import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type NegativeWalletAlertDocument =
  HydratedDocument<NegativeWalletAlert>;

@Schema({ timestamps: true, versionKey: false, id: false })
export class NegativeWalletAlert {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  member!: Types.ObjectId;

  @Prop({ type: String, required: true })
  displayName!: string;

  @Prop({ type: String, required: true })
  email!: string;

  @Prop({ type: Number, required: true })
  walletBalance!: number;

  @Prop({ type: Date, required: true })
  refreshedAt!: Date;
}

export const NegativeWalletAlertSchema =
  SchemaFactory.createForClass(NegativeWalletAlert);

NegativeWalletAlertSchema.index({ walletBalance: 1 });
NegativeWalletAlertSchema.index({ refreshedAt: -1 });