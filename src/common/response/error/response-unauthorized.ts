import { BaseErrorResponse } from "./base-error-request";

export class ResponseUnauthorized extends BaseErrorResponse {
  constructor(message = 'Unauthorized') {
    super(401, 'Unauthorized', message);
  }
}
