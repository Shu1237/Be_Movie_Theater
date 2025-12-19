import { BaseErrorResponse } from "./base-error-request";

export class ResponseForbidden extends BaseErrorResponse {
  constructor(message = 'Forbidden') {
    super(403, 'Forbidden', message);
  }
}
