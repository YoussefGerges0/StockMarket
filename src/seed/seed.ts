import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import {IdentityVerificationStatus,User,UserDocument,UserRole,UserStatus} from '../users/schemas/user.schema';
import { Wallet,WalletDocument } from '../wallet/schemas/wallet.schema';
@Injectable()
export class SeedService implements OnApplicationBootstrap {
  constructor(
    @InjectModel(User.name)private readonly userModel: Model<UserDocument>,
    @InjectModel(Wallet.name)private readonly walletModel: Model<WalletDocument>,
  ) {}

  async onApplicationBootstrap() {
    const existingOmar = await this.userModel.findOne({
      email: 'omar@example.com',
    });

    if (!existingOmar) {
      const hashedPassword = await bcrypt.hash('Omar123', 10);

      await this.userModel.create({
        name: 'Omar',
        email: 'omar@example.com',
        password: hashedPassword,
        role: UserRole.SADMIN,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        isFirstLogin: false,
        temporaryPassword: false,
        identityVerificationStatus: IdentityVerificationStatus.APPROVED,
      });

      console.log('Omar super-admin created successfully.');
    } else {
      console.log('Omar already exists. Nothing added.');
    }

    const existingLeila = await this.userModel.findOne({
      email: 'leila@example.com',
    });

    if (!existingLeila) {
      const hashedPassword = await bcrypt.hash('Leila123', 10);

      await this.userModel.create({
        name: 'Leila',
        email: 'leila@example.com',
        password: hashedPassword,
        role: UserRole.ANALYST,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        isFirstLogin: false,
        temporaryPassword: false,
        nationalID:"111",
        identityVerificationStatus: IdentityVerificationStatus.APPROVED,
      });

      console.log('Leila analyst created successfully.');
    } else {
      console.log('Leila already exists. Nothing added.');
    }

    const existingJason = await this.userModel.findOne({
      email: 'jason@example.com',
    });

    if (!existingJason) {
      const hashedPassword = await bcrypt.hash('jason123', 10);

      await this.userModel.create({
        name: 'Jason',
        email: 'jason@example.com',
        password: hashedPassword,
        role: UserRole.SUPPORT,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        isFirstLogin: false,
        temporaryPassword: false,
        nationalID:"222",
        identityVerificationStatus: IdentityVerificationStatus.APPROVED,
      });

      console.log('Jason support agent created successfully.');
    } else {
      console.log('Jason already exists. Nothing added.');
    }


    const existingAdam = await this.userModel.findOne({
      email: 'adam@example.com',
    });

    if (!existingAdam) {
      const hashedPassword = await bcrypt.hash('adam123', 10);

    const adam=await this.userModel.create({
        name: 'adam',
        email: 'adam@example.com',
        password: hashedPassword,
        role: UserRole.INVESTOR,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        isFirstLogin: false,
        temporaryPassword: false,
        nationalID:"333",
        identityVerificationStatus: IdentityVerificationStatus.APPROVED,
      });

      await this.walletModel.create({
        user: adam._id,
        balance:0,

      });


      console.log('adam investor created successfully.');
    } else {
      console.log('adam already exists. Nothing added.');
    }

    console.log('Seed check completed.');
  }
}