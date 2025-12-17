export class ResponseDetail<T> {
  data: T | null;

  constructor(data: T | null) {
    this.data = data;
  }

  static ok<T>(data: T) {
    return new ResponseDetail<T>(data);
  }
}
