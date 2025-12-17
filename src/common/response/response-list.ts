import { MetaOptions } from "../utils/type";
import { buildPaginationResponse } from "../pagination/pagination-response";

export class ResponseList<T> {
  data: T[];

  meta: Record<string, any>;

  constructor(data: T[], meta: MetaOptions) {
    const built = buildPaginationResponse<T>(data, meta);
    this.data = built.data;
    this.meta = built.meta;
  }

  static ok<T>(payload: { data: T[]; meta: MetaOptions }) {
    const { data, meta } = payload;
    return new ResponseList<T>(data, meta);
  }
}
