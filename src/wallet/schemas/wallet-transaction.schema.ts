import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type WalletTransactionDocument = HydratedDocument<WalletTransaction>;

export enum WalletTransactionType {
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',
  BUY = 'buy',
  SELL = 'sell',
  ADJUSTMENT = 'adjustment',
}

export enum WalletTransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
  FAILED = 'failed',
}

@Schema({
  timestamps: true,
  versionKey: false,
  id: false,
})
export class WalletTransaction {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  user!: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Wallet',
    required: true,
  })
  wallet!: Types.ObjectId;

  @Prop({
    type: String,
    enum:WalletTransactionType,
    required: true,
  })
  type!: WalletTransactionType;

  @Prop({
    type: Number,
    required: true,
    min: 0,
  })
  amount!: number;

  @Prop({
    type: String,
    enum: WalletTransactionStatus,
    default: WalletTransactionStatus.PENDING,
  })
  status!: WalletTransactionStatus;

  @Prop({
    type: String,
    default: null,
  })
  description!: string | null;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    default: null,
  })
  reviewedBy!: Types.ObjectId | null;

  @Prop({
    type: Date,
    default: null,
  })
  reviewedAt!: Date | null;
}

export const WalletTransactionSchema =SchemaFactory.createForClass(WalletTransaction);

WalletTransactionSchema.index({ user: 1, createdAt: -1 });
WalletTransactionSchema.index({ user: 1, type: 1, createdAt: -1 });
WalletTransactionSchema.index({ status: 1, createdAt: -1 });