import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';

type ResponseFormat = {
  success: boolean;
  data: unknown;
};

@Injectable()
export class ResponseInterceptor
  implements NestInterceptor<unknown, ResponseFormat>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler<unknown>,
  ): Observable<ResponseFormat> {
    return next.handle().pipe(
      map((data: unknown) => ({
        success: true,
        data,
      })),
    );
  }
}