import { BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';

export function toObjectId(id: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(id)) {
    throw new BadRequestException('Invalid MongoDB id');
  }

  return new Types.ObjectId(id);
}