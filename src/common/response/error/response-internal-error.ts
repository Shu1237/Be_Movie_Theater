import { ApiProperty } from "@nestjs/swagger";

export class ResponseInternalError {
  @ApiProperty({ example: "Internal Server Error" })
  message: string;

  @ApiProperty({ example: 500 })
  statusCode: number;

  constructor(message = "Internal Server Error", statusCode = 500) {
    this.message = message;
    this.statusCode = statusCode;
  }

  static error(message = "Internal Server Error", statusCode = 500) {
    return new ResponseInternalError(message, statusCode);
  }
}
