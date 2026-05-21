import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();

      const errorResponse = exception.getResponse();

      if (typeof errorResponse === 'string') {
        message = errorResponse;
      } else {
        const errorBody = errorResponse as { message?: string | string[] };
        message = errorBody.message ?? exception.message;
      }
    }

    return response.status(statusCode).json({
      success: false,
      statusCode,
      message,
    });
  }
}