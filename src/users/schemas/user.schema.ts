import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

export enum UserRole {
  SADMIN="Super-Administrator",
  ADMIN = 'Administrator',
  ANALYST = 'Analyst',
  SUPPORT = 'Support Agent',
  INVESTOR = 'Investor',
}

export enum UserStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
}

export enum IdentityVerificationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Schema({
  timestamps: true,
  versionKey: false,
  id: false,
  toJSON: { virtuals: true, versionKey: false },
  toObject: { virtuals: true, versionKey: false },
})
export class User {
  @Prop({ type: String, required: true, trim: true, minlength: 2, maxlength: 80 })
  name!: string;

  @Prop({ type: String, required: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ type: String, trim: true })
  nationalID!: string;

  @Prop({ type: Date, default: null })
  dateOfBirth?: Date | null;

  @Prop({ type: String, default: null })
  password!: string;

  @Prop({ enum: UserRole, default: UserRole.INVESTOR })
  role!: UserRole;

  @Prop({ type: Boolean, default: false })
  isEmailVerified!: boolean;

  @Prop({ type: Boolean, default: true })
  isFirstLogin!: boolean;

  @Prop({ enum: UserStatus, default: UserStatus.PENDING })
  status!: UserStatus;

  @Prop({
    enum: IdentityVerificationStatus,
    default: IdentityVerificationStatus.PENDING,
  })
  identityVerificationStatus!: IdentityVerificationStatus;

  @Prop({ type: String, default: null })
  identityRejectionReason!: string;

  @Prop({ type: [String], default: [] })
  suspensionReason!: string[];

  @Prop({ type: [Date], default: [] })
  suspendedAt!: Date[];

  @Prop({ type: Date, default: null })
  lastLoginAt!: Date;

  @Prop({ type: Boolean, default: false })
  temporaryPassword!: boolean;

  @Prop({ type: Date, default: null })
  temporaryPasswordExpiresAt!: Date ;
}


export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ nationalID: 1 }, { unique: true, sparse: true });
UserSchema.index({ status: 1 });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ role: 1, status: 1 });