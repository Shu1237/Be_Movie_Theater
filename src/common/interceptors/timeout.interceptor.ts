import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  HttpStatus,
} from '@nestjs/common';
import { Observable, timeout, catchError, throwError } from 'rxjs';
import { BaseException } from '@common/exceptions/base.exception';

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<any> {
    return next.handle().pipe(
      timeout(5000), 
      catchError((err) => {
        if (err.name === 'TimeoutError') {
          throw new BaseException(
            'Request timeout',
            HttpStatus.REQUEST_TIMEOUT,
            'REQUEST_TIMEOUT',
          );
        }
        return throwError(() => err);
      }),
    );
  }
}
