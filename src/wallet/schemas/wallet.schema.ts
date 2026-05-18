import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type WalletDocument = HydratedDocument<Wallet>;

@Schema({
  timestamps: true,
  versionKey: false,
  id: false,
})
export class Wallet {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  user!: Types.ObjectId;

  @Prop({
    type: Number,
    default: 0,
    min: 0,
  })
  balance!: number;


  @Prop({
    type: Date,
    default: null,
  })
  lastDepositAt!: Date | null;
}

export const WalletSchema = SchemaFactory.createForClass(Wallet);

WalletSchema.index({ user: 1 }, { unique: true });
WalletSchema.index({ balance: 1 });