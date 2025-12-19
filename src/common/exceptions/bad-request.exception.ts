import { HttpStatus } from '@nestjs/common';
import { BaseException } from './base.exception';

export class BadRequestException extends BaseException {
    constructor(
    message = 'Bad Request',
    errorCode = 'BAD_REQUEST',
  ) {
    super(message, HttpStatus.BAD_REQUEST, errorCode);
  }
}
