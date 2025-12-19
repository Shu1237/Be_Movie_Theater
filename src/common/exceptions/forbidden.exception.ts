import { BaseException } from './base.exception';
import { HttpStatus } from '@nestjs/common';

export class ForbiddenException extends BaseException {
  constructor(
    message = 'Forbidden',
    errorCode = 'FORBIDDEN',
  ) {
    super(message, HttpStatus.FORBIDDEN, errorCode);
  }
}
