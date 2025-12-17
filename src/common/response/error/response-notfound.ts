import { ApiProperty } from "@nestjs/swagger";

export class ResponseNotFound {
  @ApiProperty({ example: "Resource not found" })
  message: string;
  @ApiProperty({ example: 404 })
  statusCode: number;

  constructor(message = "Resource not found", statusCode = 404) {
    this.message = message;
    this.statusCode = statusCode;
  }
  static error(message = "Resource not found", statusCode = 404) {
    return new ResponseNotFound(message, statusCode);
  }
}
