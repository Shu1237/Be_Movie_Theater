import {
  Catch,
  ExceptionFilter,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const payload = exception.getResponse();

      return res.status(status).json(payload);
    }

    // 2️⃣ Exception không kiểm soát
    console.error('[UNHANDLED_EXCEPTION]', exception);

    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Internal Server Error',
      errorCode: 'INTERNAL_ERROR',
    });
  }
}
