import { HttpException, HttpStatus } from '@nestjs/common';

export interface BaseExceptionPayload {
  statusCode: number;
  message: string | string[];
  errorCode?: string;
}

export class BaseException extends HttpException {
  constructor(
    message: string | string[],
    statusCode: HttpStatus,
    errorCode?: string,
  ) {
    super(
      {
        success: false,
        statusCode,
        message,
        errorCode,
      },
      statusCode,
    );
  }
}
