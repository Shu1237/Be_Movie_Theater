import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<any> {
    return next.handle().pipe(
      map((result) => {
        /**
         * Trường hợp controller đã trả format chuẩn (hiếm)
         * → giữ nguyên, không wrap lại
         */
        if (result?.success !== undefined) {
          return result;
        }

        /**
         * Trường hợp LIST + PAGINATION
         * Controller return: { data, meta }
         */
        if (
          result &&
          typeof result === 'object' &&
          'data' in result &&
          'meta' in result
        ) {
          return {
            success: true,
            message: 'Success',
            data: result.data,
            meta: result.meta,
          };
        }

        /**
         * Trường hợp ACTION không có data
         * Controller return: null | undefined
         */
        if (result === null || result === undefined) {
          return {
            success: true,
            message: 'Success',
            data: null,
          };
        }

        /**
         * Trường hợp DETAIL
         * Controller return: entity | object
         */
        return {
          success: true,
          message: 'Success',
          data: result,
        };
      }),
    );
  }
}
