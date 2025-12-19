import { HttpStatus } from '@nestjs/common';
import { BaseException } from './base.exception';

export class UnauthorizedException extends BaseException {
    constructor(
    message = 'Unauthorized',
    errorCode = 'UNAUTHORIZED',
  ) {
    super(message, HttpStatus.UNAUTHORIZED, errorCode);
  }
}
