import { BaseException } from './base.exception';
import { HttpStatus } from '@nestjs/common';

export class NotFoundException extends BaseException {
  constructor(
    message = 'Resource not found',
    errorCode = 'NOT_FOUND',
  ) {
    super(message, HttpStatus.NOT_FOUND, errorCode);
  }
}
