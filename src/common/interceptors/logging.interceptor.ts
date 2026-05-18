import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

type RequestInfo = {
  method: string;
  url: string;
};

@Injectable()
export class LoggingInterceptor implements NestInterceptor<unknown, unknown> {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(
    context: ExecutionContext,
    next: CallHandler<unknown>,
  ): Observable<unknown> {
    const request = context.switchToHttp().getRequest<RequestInfo>();

    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;

        this.logger.log(
          `${request.method} ${request.url} - ${duration}ms`,
        );
      }),
    );
  }
}