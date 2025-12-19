export class ResponseDetail<T> {
  data: T | null;
  message: string;
  success: boolean;

  constructor(data: T | null, message = 'Success', success = true) {
    this.data = data;
    this.message = message;
    this.success = success;
  }

  static ok<T>(data: T, message = 'Success') {
    return new ResponseDetail<T>(data, message, true);
  }

  static fail<T = null>(message = 'Failed') {
    return new ResponseDetail<T>(null, message, false);
  }
}
