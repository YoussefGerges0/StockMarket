import {BadRequestException,ForbiddenException,Injectable,NotFoundException,} from '@nestjs/common';
import { User, UserDocument, UserRole, UserStatus } from './schemas/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';


type BearerUser = {
  sub: string;
  email: string;
  role: string;
};

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  private checkCmsAccess(bearer: BearerUser) {
    if (
      bearer.role !== UserRole.SADMIN &&bearer.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You are not allowed to update member status');
    }
  }

  async updateMemberStatus(userId: Types.ObjectId,status: UserStatus,reason: string,bearer: BearerUser,) {
    this.checkCmsAccess(bearer);

    if (status !== UserStatus.SUSPENDED && status !== UserStatus.ACTIVE) {
      throw new BadRequestException('Status must be either suspended or active');
    }

    if (!reason || reason.trim() === '') {
      throw new BadRequestException('Reason is required');
    }

    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.status === status) {
      throw new BadRequestException(`User is already ${status}`);
    }

    if (status === UserStatus.ACTIVE && user.status !== UserStatus.SUSPENDED) {
      throw new BadRequestException('Only suspended users can be reinstated');
    }

    user.status = status;

    const actionReason =
      status === UserStatus.SUSPENDED
        ? `Suspended: ${reason.trim()}`
        : `Reinstated: ${reason.trim()}`;

    user.suspensionReason = [
      ...(user.suspensionReason ?? []),
      actionReason,
    ];

    user.suspendedAt = [
      ...(user.suspendedAt ?? []),
      new Date(),
    ];

    await user.save();

    return {
      message: 'Member status updated successfully',
      user,
    };
  }


  async createCmsUser(
  name: string,
  email: string,
  role: UserRole,
  temporaryPassword: string,
  bearer: BearerUser,
) {
  if (
    bearer.role !== UserRole.SADMIN &&
    bearer.role !== UserRole.ADMIN
  ) {
    throw new ForbiddenException('You are not allowed to create CMS accounts');
  }

  if (role === UserRole.INVESTOR) {
    throw new BadRequestException('This endpoint is only for CMS users');
  }

  if (role === UserRole.SADMIN && bearer.role !== UserRole.SADMIN) {
    throw new ForbiddenException('Only super admin can create super admin accounts');
  }

  const normalizedEmail = email.toLowerCase().trim();

  const existingUser = await this.userModel.findOne({
    email: normalizedEmail,
  });

  if (existingUser) {
    throw new BadRequestException('Email already exists');
  }

  const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

  const temporaryPasswordExpiresAt = new Date(
    Date.now() + 24 * 60 * 60 * 1000,
  );

  const user = await this.userModel.create({
    name: name.trim(),
    email: normalizedEmail,
    password: hashedPassword,
    role,
    status: UserStatus.ACTIVE,
    isEmailVerified: true,
    temporaryPassword: true,
    temporaryPasswordExpiresAt,
  });

  return {
    message: 'CMS user created successfully',
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      temporaryPassword: user.temporaryPassword,
      temporaryPasswordExpiresAt: user.temporaryPasswordExpiresAt,
    },
  };
}



async updateTemporaryPassword(
  userId: Types.ObjectId,
  temporaryPassword: string,
  bearer: BearerUser,
) {
  if (
    bearer.role !== UserRole.SADMIN &&
    bearer.role !== UserRole.ADMIN
  ) {
    throw new ForbiddenException(
      'You are not allowed to update temporary passwords',
    );
  }

  const user = await this.userModel.findById(userId);

  if (!user) {
    throw new NotFoundException('User not found');
  }

  if (user.role === UserRole.INVESTOR) {
    throw new BadRequestException(
      'Temporary password can only be updated for CMS users',
    );
  }

  const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

  user.password = hashedPassword;
  user.temporaryPassword = true;
  user.temporaryPasswordExpiresAt = new Date(
    Date.now() + 24 * 60 * 60 * 1000,
  );

  await user.save();

  return {
    message: 'Temporary password updated successfully',
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      temporaryPassword: user.temporaryPassword,
      temporaryPasswordExpiresAt: user.temporaryPasswordExpiresAt,
    },
  };
}
}