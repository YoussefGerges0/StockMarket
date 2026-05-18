import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import { Otp, OtpDocument } from './schemas/otp.schema';
import {
  User,
  UserDocument,
  UserStatus,
} from '../users/schemas/user.schema';
import { Wallet, WalletDocument } from '../wallet/schemas/wallet.schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthenticationService {
  constructor(
    @InjectModel(Otp.name)
    private readonly otpModel: Model<OtpDocument>,

    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,

    @InjectModel(Wallet.name)
    private readonly walletModel: Model<WalletDocument>,

    private readonly jwtService: JwtService,
  ) {}

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private getOtpExpirationDate(): Date {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);
    return expiresAt;
  }

  async sendRegisterOtp(email: string) {
    const normalizedEmail = email.toLowerCase().trim();

    const user = await this.userModel.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    await this.otpModel.deleteMany({
      email: normalizedEmail,
      usedAt: null,
    });

    const code = this.generateOtp();

    await this.otpModel.create({
      email: normalizedEmail,
      code,
      expiresAt: this.getOtpExpirationDate(),
    });

    return {
      
      message: 'OTP sent successfully',
      code, // remove later when email sending is ready
    };
  }

  async verifyRegisterOtp(email: string, code: string, password: string) {
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedCode = code.trim();

    const user = await this.userModel.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isEmailVerified && user.password) {
      throw new BadRequestException('Email is already verified');
    }

    const otp = await this.otpModel
      .findOne({
        email: normalizedEmail,
        usedAt: null,
      })
      .sort({ createdAt: -1 });

    if (!otp) {
      throw new BadRequestException('Invalid OTP');
    }

    if (otp.expiresAt < new Date()) {
      throw new BadRequestException('OTP expired');
    }

    if (otp.attempts >= 5) {
      throw new BadRequestException('Too many wrong attempts');
    }

    if (otp.code !== normalizedCode) {
      otp.attempts += 1;
      await otp.save();

      throw new BadRequestException('Invalid OTP');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    otp.usedAt = new Date();
    await otp.save();

    user.isEmailVerified = true;
    user.password = hashedPassword;
    user.status = UserStatus.ACTIVE;
    user.temporaryPassword = false;

    await user.save();

    const existingWallet = await this.walletModel.findOne({
      user: user._id,
    });

    if (!existingWallet) {
      await this.walletModel.create({
        user: user._id,
        balance: 0,
      });
    }

    return {
  
      message: 'Email verified, password created, and wallet created successfully',
    };
  }

  async login(email: string, password: string) {
    const normalizedEmail = email.toLowerCase().trim();

    const user = await this.userModel.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.password) {
      throw new BadRequestException(
        'Please verify your email and create a password first',
      );
    }

    if (!user.isEmailVerified) {
      throw new BadRequestException('Email is not verified');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new BadRequestException('User account is not active');
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      throw new UnauthorizedException('Invalid email or password');
    }


    user.lastLoginAt = new Date();
    

    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload);
    if(user.isFirstLogin){
      user.isFirstLogin = false;
      await user.save()
    return {
  
      message: 'Login successful',
      note:'Please fund your wallet',
      accessToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        
      },
    };
  }

await user.save();
  
        return {
   
      message: 'Login successful',
      accessToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        
      },
    };
  }
}
