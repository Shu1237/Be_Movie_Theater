import { MetaOptions } from '../utils/type';
import { buildPaginationResponse } from '../pagination/pagination-response';

export class ResponseList<T> {
  data: T[];
  meta: Record<string, any>;
  message: string;
  success: boolean;

  constructor(
    data: T[],
    meta: MetaOptions,
    message = 'Success',
    success = true,
  ) {
    const built = buildPaginationResponse<T>(data, meta);
    this.data = built.data;
    this.meta = built.meta;
    this.message = message;
    this.success = success;
  }

  static ok<T>(
    payload: { data: T[]; meta: MetaOptions },
    message = 'Success',
  ) {
    const { data, meta } = payload;
    return new ResponseList<T>(data, meta, message, true);
  }

  static empty<T>(
    meta: MetaOptions,
    message = 'No data found',
  ) {
    return new ResponseList<T>([], meta, message, true);
  }
}
