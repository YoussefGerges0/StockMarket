import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type OtpDocument = HydratedDocument<Otp>;

@Schema({
    id:false,
  timestamps: true,
  versionKey: false,
})
export class Otp {
  @Prop({type: String,required: true,lowercase: true,trim: true})
  email!: string;

  @Prop({type: String,required: true})
  code!: string;

  @Prop({type: Date,required: true})
  expiresAt!: Date;

  @Prop({type: Date,default: null})
  usedAt!: Date ;

  @Prop({type: Number,default: 0,
  })
  attempts!: number;
}

export const OtpSchema = SchemaFactory.createForClass(Otp);

OtpSchema.index({ email: 1 });
OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });