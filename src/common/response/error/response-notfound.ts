import { BaseErrorResponse } from "./base-error-request";

export class ResponseNotFound extends BaseErrorResponse {
  constructor(message = 'Resource not found') {
    super(404, 'Not Found', message);
  }
}
