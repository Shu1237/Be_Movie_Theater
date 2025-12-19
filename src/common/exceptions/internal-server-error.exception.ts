import { BaseException } from './base.exception';
import { HttpStatus } from '@nestjs/common';

export class InternalServerErrorException extends BaseException {
   constructor(
    message = 'Internal Server Error',
    errorCode = 'INTERNAL_SERVER_ERROR',
  ) {
    super(message, HttpStatus.INTERNAL_SERVER_ERROR, errorCode);
  }
}
