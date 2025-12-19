import { BaseErrorResponse } from "./base-error-request";

export class ResponseConflict extends BaseErrorResponse {
  constructor(message = 'Conflict') {
    super(409, 'Conflict', message);
  }
}
