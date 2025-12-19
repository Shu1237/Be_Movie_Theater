import { BaseException } from './base.exception';
import { HttpStatus } from '@nestjs/common';

export class ConflictException extends BaseException {
   constructor(
    message = 'Conflict',
    errorCode = 'CONFLICT',
  ) {
    super(message, HttpStatus.CONFLICT, errorCode);
  }
}
