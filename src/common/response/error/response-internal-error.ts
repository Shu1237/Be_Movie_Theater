import { BaseErrorResponse } from "./base-error-request";

export class ResponseInternalError extends BaseErrorResponse {
  constructor(message = 'Internal Server Error') {
    super(500, 'Internal Server Error', message);
  }
}
