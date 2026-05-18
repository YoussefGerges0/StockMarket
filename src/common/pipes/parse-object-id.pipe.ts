import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { isValidObjectId, Types } from 'mongoose';
import { toObjectId } from '../utils/object-id.utils';

@Injectable()
export class ParseObjectIdPipe implements PipeTransform<
  string | Types.ObjectId,
  Types.ObjectId
> {
  transform(value: string | Types.ObjectId): Types.ObjectId {
    if (value instanceof Types.ObjectId) {
      return value;
    }

    if (!isValidObjectId(value)) {
      throw new BadRequestException('Invalid MongoDB ObjectId.');
    }

    return toObjectId(value);
  }
}
